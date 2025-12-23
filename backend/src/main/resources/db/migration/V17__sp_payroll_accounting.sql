-- ============================================
-- MIGRACIÓN: Procedimiento Almacenado para Contabilidad de Nómina
-- Fecha: 2025-12-20
-- Descripción: Genera automáticamente el asiento contable cuando se liquida nómina
-- ============================================

DELIMITER //

-- Procedimiento para generar comprobante de causación de nómina
CREATE PROCEDURE IF NOT EXISTS sp_generate_payroll_voucher(
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
    
    -- Obtener descripción del período
    SELECT CONCAT('Causación Nómina ', COALESCE(period_name, CONCAT('Periodo ', period_number, '/', year)))
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
    
    -- Si no hay recibos, salir
    IF v_total_salary = 0 AND v_total_net_pay = 0 THEN
        SET p_voucher_id = NULL;
        LEAVE;
    END IF;
    
    -- Generar número de comprobante
    SELECT CONCAT('NC-NOM-', LPAD(COALESCE(MAX(CAST(SUBSTRING(voucher_number, 8) AS UNSIGNED)), 0) + 1, 6, '0'))
    INTO v_voucher_number
    FROM accounting_vouchers 
    WHERE voucher_type = 'NOTA_CONTABLE' AND tenant_id = p_tenant_id;
    
    -- Crear el comprobante
    INSERT INTO accounting_vouchers (
        voucher_type, voucher_number, date, description, reference, 
        status, tenant_id, fiscal_year, fiscal_period, total_debit, total_credit, created_at
    ) VALUES (
        'NOTA_CONTABLE', v_voucher_number, CURDATE(), v_period_description, 
        CONCAT('NOM-PER-', p_period_id),
        'DRAFT', p_tenant_id, YEAR(CURDATE()), MONTH(CURDATE()), 0, 0, NOW()
    );
    
    SET p_voucher_id = LAST_INSERT_ID();
    
    -- ========== DÉBITOS (GASTOS) ==========
    
    -- Sueldos (510506)
    IF v_total_salary > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510506', 'Sueldos', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510506', 'Sueldos', v_total_salary, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_salary;
    END IF;
    
    -- Horas Extras (510515)
    IF v_total_overtime > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510515', 'Horas Extras y Recargos', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510515', 'Horas Extras', v_total_overtime, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_overtime;
    END IF;
    
    -- Auxilio Transporte (510527)
    IF v_total_transport > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510527', 'Auxilio de Transporte', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510527', 'Auxilio Transporte', v_total_transport, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_transport;
    END IF;
    
    -- Aportes Salud Empleador (510569)
    IF v_total_health_empr > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510569', 'Aportes EPS', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510569', 'Aporte Salud Empleador', v_total_health_empr, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_health_empr;
    END IF;
    
    -- Aportes Pensión Empleador (510570)
    IF v_total_pension_empr > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510570', 'Aportes Fondos de Pensiones', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510570', 'Aporte Pensión Empleador', v_total_pension_empr, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_pension_empr;
    END IF;
    
    -- ARL (510568)
    IF v_total_arl > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510568', 'Aportes ARL', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510568', 'Aporte ARL', v_total_arl, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_arl;
    END IF;
    
    -- Caja Compensación (510572)
    IF v_total_caja > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510572', 'Aportes Cajas de Compensación', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510572', 'Aporte Caja Compensación', v_total_caja, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_caja;
    END IF;
    
    -- ICBF (510575)
    IF v_total_icbf > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510575', 'Aportes ICBF', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510575', 'Aporte ICBF', v_total_icbf, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_icbf;
    END IF;
    
    -- SENA (510578)
    IF v_total_sena > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510578', 'Aportes SENA', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510578', 'Aporte SENA', v_total_sena, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_sena;
    END IF;
    
    -- Cesantías Provisión (510530)
    IF v_total_cesantias > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510530', 'Cesantías', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510530', 'Provisión Cesantías', v_total_cesantias, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_cesantias;
    END IF;
    
    -- Intereses Cesantías (510533)
    IF v_total_int_cesantias > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510533', 'Intereses sobre Cesantías', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510533', 'Provisión Int. Cesantías', v_total_int_cesantias, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_int_cesantias;
    END IF;
    
    -- Prima (510536)
    IF v_total_prima > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510536', 'Prima de Servicios', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510536', 'Provisión Prima', v_total_prima, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_prima;
    END IF;
    
    -- Vacaciones (510539)
    IF v_total_vacaciones > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('510539', 'Vacaciones', 'GASTO', 'DEBITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '510539', 'Provisión Vacaciones', v_total_vacaciones, 0, NOW());
        SET v_total_debit = v_total_debit + v_total_vacaciones;
    END IF;
    
    -- ========== CRÉDITOS (PASIVOS) ==========
    
    -- Salarios por Pagar (250501)
    IF v_total_net_pay > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('250501', 'Salarios por Pagar', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '250501', 'Salarios por Pagar', 0, v_total_net_pay, NOW());
        SET v_total_credit = v_total_credit + v_total_net_pay;
    END IF;
    
    -- Aportes EPS por Pagar (237005) = Empleado + Empleador
    IF (v_total_health_emp + v_total_health_empr) > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('237005', 'Aportes EPS', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '237005', 'Aportes EPS por Pagar', 0, v_total_health_emp + v_total_health_empr, NOW());
        SET v_total_credit = v_total_credit + v_total_health_emp + v_total_health_empr;
    END IF;
    
    -- Aportes Pensión por Pagar (238030) = Empleado + Empleador
    IF (v_total_pension_emp + v_total_pension_empr) > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('238030', 'Fondos de Cesantías y/o Pensiones', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '238030', 'Aportes Pensión por Pagar', 0, v_total_pension_emp + v_total_pension_empr, NOW());
        SET v_total_credit = v_total_credit + v_total_pension_emp + v_total_pension_empr;
    END IF;
    
    -- ARL por Pagar (237006)
    IF v_total_arl > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('237006', 'Aportes ARL', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '237006', 'Aportes ARL por Pagar', 0, v_total_arl, NOW());
        SET v_total_credit = v_total_credit + v_total_arl;
    END IF;
    
    -- Caja Compensación por Pagar (237010)
    IF v_total_caja > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('237010', 'Aportes Parafiscales (Caja)', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '237010', 'Caja Compensación por Pagar', 0, v_total_caja, NOW());
        SET v_total_credit = v_total_credit + v_total_caja;
    END IF;
    
    -- ICBF por Pagar (237030)
    IF v_total_icbf > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('237030', 'Aportes ICBF', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '237030', 'ICBF por Pagar', 0, v_total_icbf, NOW());
        SET v_total_credit = v_total_credit + v_total_icbf;
    END IF;
    
    -- SENA por Pagar (237040)
    IF v_total_sena > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('237040', 'Aportes SENA', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '237040', 'SENA por Pagar', 0, v_total_sena, NOW());
        SET v_total_credit = v_total_credit + v_total_sena;
    END IF;
    
    -- Provisión Cesantías (261005)
    IF v_total_cesantias > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('261005', 'Cesantías', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '261005', 'Provisión Cesantías', 0, v_total_cesantias, NOW());
        SET v_total_credit = v_total_credit + v_total_cesantias;
    END IF;
    
    -- Provisión Intereses Cesantías (261010)
    IF v_total_int_cesantias > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('261010', 'Intereses sobre Cesantías', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '261010', 'Provisión Int. Cesantías', 0, v_total_int_cesantias, NOW());
        SET v_total_credit = v_total_credit + v_total_int_cesantias;
    END IF;
    
    -- Provisión Prima (261020)
    IF v_total_prima > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('261020', 'Prima de Servicios', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '261020', 'Provisión Prima', 0, v_total_prima, NOW());
        SET v_total_credit = v_total_credit + v_total_prima;
    END IF;
    
    -- Provisión Vacaciones (261015)
    IF v_total_vacaciones > 0 THEN
        SET v_line_number = v_line_number + 1;
        CALL sp_ensure_account_exists('261015', 'Vacaciones', 'PASIVO', 'CREDITO');
        INSERT INTO accounting_entries (voucher_id, line_number, account_code, description, debit_amount, credit_amount, created_at)
        VALUES (p_voucher_id, v_line_number, '261015', 'Provisión Vacaciones', 0, v_total_vacaciones, NOW());
        SET v_total_credit = v_total_credit + v_total_vacaciones;
    END IF;
    
    -- Actualizar totales del comprobante
    UPDATE accounting_vouchers 
    SET total_debit = v_total_debit, total_credit = v_total_credit
    WHERE id = p_voucher_id;
    
END //

-- Procedimiento auxiliar para asegurar que una cuenta existe
CREATE PROCEDURE IF NOT EXISTS sp_ensure_account_exists(
    IN p_code VARCHAR(10),
    IN p_name VARCHAR(255),
    IN p_type VARCHAR(50),
    IN p_nature VARCHAR(10)
)
BEGIN
    INSERT IGNORE INTO chart_of_accounts (code, name, account_type, nature, is_active, level, created_at, updated_at)
    VALUES (p_code, p_name, p_type, p_nature, TRUE, LENGTH(p_code), NOW(), NOW());
END //

DELIMITER ;

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
