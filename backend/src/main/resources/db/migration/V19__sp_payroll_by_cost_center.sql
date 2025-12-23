-- V19: Updated stored procedure to generate payroll vouchers with cost center breakdown
-- This SP groups payroll entries by cost center for analytical accounting

DELIMITER //

-- Drop existing procedure
DROP PROCEDURE IF EXISTS sp_generate_payroll_voucher_by_cost_center//

-- Create new procedure that groups by cost center
CREATE PROCEDURE sp_generate_payroll_voucher_by_cost_center(
    IN p_period_id BIGINT,
    IN p_tenant_id INT,
    OUT p_voucher_id BIGINT
)
BEGIN
    DECLARE v_voucher_number VARCHAR(50);
    DECLARE v_period_description VARCHAR(255);
    DECLARE v_total_debit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_credit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_line_number INT DEFAULT 0;
    DECLARE v_has_receipts INT DEFAULT 0;
    
    -- Variables for cursor
    DECLARE v_cc_id BIGINT;
    DECLARE v_cc_code VARCHAR(20);
    DECLARE v_cc_name VARCHAR(255);
    DECLARE v_cc_salary DECIMAL(15,2);
    DECLARE v_cc_overtime DECIMAL(15,2);
    DECLARE v_cc_transport DECIMAL(15,2);
    DECLARE v_cc_health_emp DECIMAL(15,2);
    DECLARE v_cc_pension_emp DECIMAL(15,2);
    DECLARE v_cc_health_empr DECIMAL(15,2);
    DECLARE v_cc_pension_empr DECIMAL(15,2);
    DECLARE v_cc_arl DECIMAL(15,2);
    DECLARE v_cc_caja DECIMAL(15,2);
    DECLARE v_cc_icbf DECIMAL(15,2);
    DECLARE v_cc_sena DECIMAL(15,2);
    DECLARE v_cc_net_pay DECIMAL(15,2);
    DECLARE v_done INT DEFAULT FALSE;
    
    -- Cursor for payroll by cost center
    DECLARE cur_cost_centers CURSOR FOR
        SELECT 
            COALESCE(e.cost_center_id, 0) AS cost_center_id,
            COALESCE(cc.code, 'SIN-CC') AS cc_code,
            COALESCE(cc.name, 'Sin Centro de Costo') AS cc_name,
            COALESCE(SUM(pr.salary_amount), 0) AS total_salary,
            COALESCE(SUM(pr.overtime_amount), 0) AS total_overtime,
            COALESCE(SUM(pr.transport_allowance_amount), 0) AS total_transport,
            COALESCE(SUM(pr.health_deduction), 0) AS health_emp,
            COALESCE(SUM(pr.pension_deduction), 0) AS pension_emp,
            COALESCE(SUM(pr.employer_health_contribution), 0) AS health_empr,
            COALESCE(SUM(pr.employer_pension_contribution), 0) AS pension_empr,
            COALESCE(SUM(pr.arl_contribution), 0) AS arl,
            COALESCE(SUM(pr.caja_compensacion_contribution), 0) AS caja,
            COALESCE(SUM(pr.icbf_contribution), 0) AS icbf,
            COALESCE(SUM(pr.sena_contribution), 0) AS sena,
            COALESCE(SUM(pr.net_pay), 0) AS net_pay
        FROM payroll_receipts pr
        JOIN employees e ON pr.employee_id = e.id
        LEFT JOIN cost_centers cc ON e.cost_center_id = cc.id
        WHERE pr.payroll_period_id = p_period_id
        GROUP BY e.cost_center_id, cc.code, cc.name
        HAVING total_salary > 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    -- Check if there are receipts
    SELECT COUNT(*) INTO v_has_receipts FROM payroll_receipts WHERE payroll_period_id = p_period_id;
    
    IF v_has_receipts = 0 THEN
        SET p_voucher_id = NULL;
    ELSE
        -- Get period description
        SELECT CONCAT('Causación Nómina Período ', period_number, '/', year)
        INTO v_period_description
        FROM payroll_periods WHERE id = p_period_id;
        
        -- Generate voucher number
        SELECT CONCAT('NC-NOM-CC-', LPAD(COALESCE(MAX(id), 0) + 1, 6, '0'))
        INTO v_voucher_number
        FROM accounting_vouchers 
        WHERE tenant_id = p_tenant_id;
        
        -- Ensure accounts exist
        CALL sp_ensure_account_exists('510506', 'Sueldos', 'GASTO', 'DEBITO');
        CALL sp_ensure_account_exists('510515', 'Horas Extras', 'GASTO', 'DEBITO');
        CALL sp_ensure_account_exists('510527', 'Auxilio Transporte', 'GASTO', 'DEBITO');
        CALL sp_ensure_account_exists('250501', 'Salarios por Pagar', 'PASIVO', 'CREDITO');
        CALL sp_ensure_account_exists('237005', 'Aportes EPS', 'PASIVO', 'CREDITO');
        CALL sp_ensure_account_exists('238030', 'Fondos Pensión', 'PASIVO', 'CREDITO');
        CALL sp_ensure_account_exists('237006', 'ARL por Pagar', 'PASIVO', 'CREDITO');
        CALL sp_ensure_account_exists('237510', 'Parafiscales por Pagar', 'PASIVO', 'CREDITO');
        
        -- Create voucher
        INSERT INTO accounting_vouchers (
            voucher_type, voucher_number, date, description, reference, 
            status, tenant_id, fiscal_year, fiscal_period, total_debit, total_credit, 
            created_at, posted_at
        ) VALUES (
            'NOTA_CONTABLE', v_voucher_number, CURDATE(), v_period_description, 
            CONCAT('NOM-PER-CC-', p_period_id),
            'POSTED', p_tenant_id, YEAR(CURDATE()), MONTH(CURDATE()), 0, 0, NOW(), NOW()
        );
        
        SET p_voucher_id = LAST_INSERT_ID();
        
        -- Open cursor and iterate through cost centers
        OPEN cur_cost_centers;
        
        read_loop: LOOP
            FETCH cur_cost_centers INTO 
                v_cc_id, v_cc_code, v_cc_name,
                v_cc_salary, v_cc_overtime, v_cc_transport,
                v_cc_health_emp, v_cc_pension_emp,
                v_cc_health_empr, v_cc_pension_empr,
                v_cc_arl, v_cc_caja, v_cc_icbf, v_cc_sena,
                v_cc_net_pay;
            
            IF v_done THEN
                LEAVE read_loop;
            END IF;
            
            -- DEBIT: Salaries by cost center
            IF v_cc_salary > 0 THEN
                SET v_line_number = v_line_number + 1;
                INSERT INTO accounting_entries (
                    voucher_id, line_number, account_code, cost_center_id, 
                    description, debit_amount, credit_amount, created_at
                ) VALUES (
                    p_voucher_id, v_line_number, '510506', 
                    CASE WHEN v_cc_id > 0 THEN v_cc_id ELSE NULL END,
                    CONCAT('Sueldos - ', v_cc_name), v_cc_salary, 0, NOW()
                );
                SET v_total_debit = v_total_debit + v_cc_salary;
            END IF;
            
            -- DEBIT: Overtime by cost center
            IF v_cc_overtime > 0 THEN
                SET v_line_number = v_line_number + 1;
                INSERT INTO accounting_entries (
                    voucher_id, line_number, account_code, cost_center_id,
                    description, debit_amount, credit_amount, created_at
                ) VALUES (
                    p_voucher_id, v_line_number, '510515',
                    CASE WHEN v_cc_id > 0 THEN v_cc_id ELSE NULL END,
                    CONCAT('Horas Extras - ', v_cc_name), v_cc_overtime, 0, NOW()
                );
                SET v_total_debit = v_total_debit + v_cc_overtime;
            END IF;
            
            -- DEBIT: Transport allowance by cost center
            IF v_cc_transport > 0 THEN
                SET v_line_number = v_line_number + 1;
                INSERT INTO accounting_entries (
                    voucher_id, line_number, account_code, cost_center_id,
                    description, debit_amount, credit_amount, created_at
                ) VALUES (
                    p_voucher_id, v_line_number, '510527',
                    CASE WHEN v_cc_id > 0 THEN v_cc_id ELSE NULL END,
                    CONCAT('Auxilio Transporte - ', v_cc_name), v_cc_transport, 0, NOW()
                );
                SET v_total_debit = v_total_debit + v_cc_transport;
            END IF;
            
        END LOOP;
        
        CLOSE cur_cost_centers;
        
        -- CREDIT entries (consolidated, not by cost center as they are liabilities)
        -- Get consolidated totals
        SELECT 
            COALESCE(SUM(net_pay), 0),
            COALESCE(SUM(health_deduction + employer_health_contribution), 0),
            COALESCE(SUM(pension_deduction + employer_pension_contribution), 0),
            COALESCE(SUM(arl_contribution), 0),
            COALESCE(SUM(caja_compensacion_contribution + icbf_contribution + sena_contribution), 0)
        INTO 
            @v_total_net, @v_total_health, @v_total_pension, @v_total_arl, @v_total_parafiscales
        FROM payroll_receipts
        WHERE payroll_period_id = p_period_id;
        
        -- CREDIT: Salaries Payable
        IF @v_total_net > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '250501', 'Salarios por Pagar', 0, @v_total_net, NOW());
            SET v_total_credit = v_total_credit + @v_total_net;
        END IF;
        
        -- CREDIT: Health contributions
        IF @v_total_health > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '237005', 'Aportes EPS', 0, @v_total_health, NOW());
            SET v_total_credit = v_total_credit + @v_total_health;
        END IF;
        
        -- CREDIT: Pension contributions
        IF @v_total_pension > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '238030', 'Aportes Pensión', 0, @v_total_pension, NOW());
            SET v_total_credit = v_total_credit + @v_total_pension;
        END IF;
        
        -- CREDIT: ARL
        IF @v_total_arl > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '237006', 'ARL por Pagar', 0, @v_total_arl, NOW());
            SET v_total_credit = v_total_credit + @v_total_arl;
        END IF;
        
        -- CREDIT: Parafiscales (ICBF + SENA + Caja)
        IF @v_total_parafiscales > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '237510', 'Parafiscales por Pagar', 0, @v_total_parafiscales, NOW());
            SET v_total_credit = v_total_credit + @v_total_parafiscales;
        END IF;
        
        -- Update voucher totals
        UPDATE accounting_vouchers 
        SET total_debit = v_total_debit, total_credit = v_total_credit
        WHERE id = p_voucher_id;
        
    END IF;
END//

DELIMITER ;

-- Message
SELECT 'Stored procedure sp_generate_payroll_voucher_by_cost_center created successfully' AS resultado;
