-- Script para crear procedimientos almacenados de nomina

DELIMITER //

DROP PROCEDURE IF EXISTS sp_ensure_account_exists//
CREATE PROCEDURE sp_ensure_account_exists(
    IN p_code VARCHAR(10),
    IN p_name VARCHAR(255),
    IN p_type VARCHAR(50),
    IN p_nature VARCHAR(10)
)
BEGIN
    INSERT IGNORE INTO chart_of_accounts (code, name, account_type, nature, is_active, level, created_at, updated_at)
    VALUES (p_code, p_name, p_type, p_nature, TRUE, LENGTH(p_code), NOW(), NOW());
END//


DROP PROCEDURE IF EXISTS sp_generate_payroll_voucher//
CREATE PROCEDURE sp_generate_payroll_voucher(
    IN p_period_id BIGINT,
    IN p_tenant_id INT,
    OUT p_voucher_id BIGINT
)
BEGIN
    DECLARE v_voucher_number VARCHAR(50);
    DECLARE v_period_description VARCHAR(255);
    DECLARE v_total_salary DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_overtime DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_transport DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_health_emp DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_pension_emp DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_health_empr DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_pension_empr DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_arl DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_caja DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_icbf DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_sena DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_cesantias DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_int_cesantias DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_prima DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_vacaciones DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_net_pay DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_debit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_credit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_line_number INT DEFAULT 0;
    
    -- Obtener descripcion del periodo
    SELECT CONCAT('Causacion Nomina Periodo ', period_number, '/', year)
    INTO v_period_description
    FROM payroll_periods WHERE id = p_period_id;
    
    -- Calcular totales desde los recibos
    SELECT 
        COALESCE(SUM(salary_amount), 0),
        COALESCE(SUM(overtime_amount), 0),
        COALESCE(SUM(transport_allowance_amount), 0),
        COALESCE(SUM(health_deduction), 0),
        COALESCE(SUM(pension_deduction), 0),
        COALESCE(SUM(employer_health_contribution), 0),
        COALESCE(SUM(employer_pension_contribution), 0),
        COALESCE(SUM(arl_contribution), 0),
        COALESCE(SUM(caja_compensacion_contribution), 0),
        COALESCE(SUM(icbf_contribution), 0),
        COALESCE(SUM(sena_contribution), 0),
        COALESCE(SUM(cesantias_provision), 0),
        COALESCE(SUM(intereses_cesantias_provision), 0),
        COALESCE(SUM(prima_servicios_provision), 0),
        COALESCE(SUM(vacaciones_provision), 0),
        COALESCE(SUM(net_pay), 0)
    INTO 
        v_total_salary, v_total_overtime, v_total_transport,
        v_total_health_emp, v_total_pension_emp,
        v_total_health_empr, v_total_pension_empr,
        v_total_arl, v_total_caja, v_total_icbf, v_total_sena,
        v_total_cesantias, v_total_int_cesantias, v_total_prima, v_total_vacaciones,
        v_total_net_pay
    FROM payroll_receipts
    WHERE payroll_period_id = p_period_id;
    
    -- Si no hay datos, salir
    IF v_total_net_pay = 0 THEN
        SET p_voucher_id = NULL;
    ELSE
        -- Generar numero de comprobante
        SELECT CONCAT('NC-NOM-', LPAD(COALESCE(MAX(id), 0) + 1, 6, '0'))
        INTO v_voucher_number
        FROM accounting_vouchers 
        WHERE tenant_id = p_tenant_id;
        
        -- Crear el comprobante (CONTABILIZADO AUTOMATICAMENTE)
        INSERT INTO accounting_vouchers (
            voucher_type, voucher_number, date, description, reference, 
            status, tenant_id, fiscal_year, fiscal_period, total_debit, total_credit, created_at, posted_at
        ) VALUES (
            'NOTA_CONTABLE', v_voucher_number, CURDATE(), v_period_description, 
            CONCAT('NOM-PER-', p_period_id),
            'POSTED', p_tenant_id, YEAR(CURDATE()), MONTH(CURDATE()), 0, 0, NOW(), NOW()
        );
        
        SET p_voucher_id = LAST_INSERT_ID();
        
        -- Asegurar cuentas existen
        CALL sp_ensure_account_exists('510506', 'Sueldos', 'GASTO', 'DEBITO');
        CALL sp_ensure_account_exists('250501', 'Salarios por Pagar', 'PASIVO', 'CREDITO');
        
        -- DEBITO: Sueldos
        IF v_total_salary > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '510506', 'Sueldos', v_total_salary, 0, NOW());
            SET v_total_debit = v_total_debit + v_total_salary;
        END IF;
        
        -- DEBITO: Extras y demas
        IF v_total_overtime > 0 THEN
            SET v_line_number = v_line_number + 1;
            CALL sp_ensure_account_exists('510515', 'Horas Extras', 'GASTO', 'DEBITO');
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '510515', 'Horas Extras', v_total_overtime, 0, NOW());
            SET v_total_debit = v_total_debit + v_total_overtime;
        END IF;
        
        IF v_total_transport > 0 THEN
            SET v_line_number = v_line_number + 1;
            CALL sp_ensure_account_exists('510527', 'Auxilio Transporte', 'GASTO', 'DEBITO');
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '510527', 'Auxilio Transporte', v_total_transport, 0, NOW());
            SET v_total_debit = v_total_debit + v_total_transport;
        END IF;
        
        -- CREDITO: Salarios por Pagar
        IF v_total_net_pay > 0 THEN
            SET v_line_number = v_line_number + 1;
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '250501', 'Salarios por Pagar', 0, v_total_net_pay, NOW());
            SET v_total_credit = v_total_credit + v_total_net_pay;
        END IF;
        
        -- CREDITO: Seguridad Social
        IF (v_total_health_emp + v_total_health_empr) > 0 THEN
            SET v_line_number = v_line_number + 1;
            CALL sp_ensure_account_exists('237005', 'Aportes EPS', 'PASIVO', 'CREDITO');
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '237005', 'Aportes EPS', 0, v_total_health_emp + v_total_health_empr, NOW());
            SET v_total_credit = v_total_credit + v_total_health_emp + v_total_health_empr;
        END IF;
        
        IF (v_total_pension_emp + v_total_pension_empr) > 0 THEN
            SET v_line_number = v_line_number + 1;
            CALL sp_ensure_account_exists('238030', 'Fondos Pension', 'PASIVO', 'CREDITO');
            INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
            VALUES (p_voucher_id, v_line_number, '238030', 'Aportes Pension', 0, v_total_pension_emp + v_total_pension_empr, NOW());
            SET v_total_credit = v_total_credit + v_total_pension_emp + v_total_pension_empr;
        END IF;
        
        -- Actualizar totales
        UPDATE accounting_vouchers 
        SET total_debit = v_total_debit, total_credit = v_total_credit
        WHERE id = p_voucher_id;
        
    END IF;
END//

DELIMITER ;

SELECT 'Procedimientos creados exitosamente' as resultado;
