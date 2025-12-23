-- ============================================
-- MIGRACIÓN: Cuentas Contables para Nómina
-- Fecha: 2025-12-20
-- Descripción: Crea cuentas del PUC necesarias para nómina y actualiza configuración
-- ============================================

-- 1. Insertar Cuentas Contables (PUC Colombia - Sector Real)
INSERT IGNORE INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, is_active) VALUES 
-- GASTOS (5)
('51', 'OPERACIONALES DE ADMINISTRACION', 'GASTO', 2, '5', 'DEBITO', TRUE),
('5105', 'GASTOS DE PERSONAL', 'GASTO', 4, '51', 'DEBITO', TRUE),
('510506', 'Sueldos', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510515', 'Horas Extras y Recargos', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510518', 'Comisiones', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510527', 'Auxilio de Transporte', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510530', 'Cesantías', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510533', 'Intereses sobre Cesantías', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510536', 'Prima de Servicios', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510539', 'Vacaciones', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510568', 'Aportes ARL', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510569', 'Aportes EPS', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510570', 'Aportes Fondos de Pensiones', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510572', 'Aportes Cajas de Compensación', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510575', 'Aportes ICBF', 'GASTO', 6, '5105', 'DEBITO', TRUE),
('510578', 'Aportes SENA', 'GASTO', 6, '5105', 'DEBITO', TRUE),

-- PASIVOS (2)
('23', 'CUENTAS POR PAGAR', 'PASIVO', 2, '2', 'CREDITO', TRUE),
('2365', 'RETENCION EN LA FUENTE', 'PASIVO', 4, '23', 'CREDITO', TRUE),
('236505', 'Salarios y Pagos Laborales', 'PASIVO', 6, '2365', 'CREDITO', TRUE),

('2370', 'RETENCIONES Y APORTES DE NOMINA', 'PASIVO', 4, '23', 'CREDITO', TRUE),
('237005', 'Aportes EPS', 'PASIVO', 6, '2370', 'CREDITO', TRUE),
('237006', 'Aportes ARL', 'PASIVO', 6, '2370', 'CREDITO', TRUE),
('237010', 'Aportes Parafiscales (Caja)', 'PASIVO', 6, '2370', 'CREDITO', TRUE),
('237030', 'Aportes ICBF', 'PASIVO', 6, '2370', 'CREDITO', TRUE),
('237040', 'Aportes SENA', 'PASIVO', 6, '2370', 'CREDITO', TRUE),

('2380', 'ACREEDORES VARIOS', 'PASIVO', 4, '23', 'CREDITO', TRUE),
('238030', 'Fondos de Cesantías y/o Pensiones', 'PASIVO', 6, '2380', 'CREDITO', TRUE),

('25', 'OBLIGACIONES LABORALES', 'PASIVO', 2, '2', 'CREDITO', TRUE),
('2505', 'SALARIOS POR PAGAR', 'PASIVO', 4, '25', 'CREDITO', TRUE),
('250501', 'Salarios por Pagar', 'PASIVO', 6, '2505', 'CREDITO', TRUE),

('26', 'PASIVOS ESTIMADOS Y PROVISIONES', 'PASIVO', 2, '2', 'CREDITO', TRUE),
('2610', 'OBLIGACIONES LABORALES', 'PASIVO', 4, '26', 'CREDITO', TRUE),
('261005', 'Cesantías', 'PASIVO', 6, '2610', 'CREDITO', TRUE),
('261010', 'Intereses sobre Cesantías', 'PASIVO', 6, '2610', 'CREDITO', TRUE),
('261015', 'Vacaciones', 'PASIVO', 6, '2610', 'CREDITO', TRUE),
('261020', 'Prima de Servicios', 'PASIVO', 6, '2610', 'CREDITO', TRUE);

-- 2. Actualizar Configuración de Nómina
-- Activamos la integración. 
-- Nota: Dejamos las cuentas específicas en NULL para que el sistema use el desglose automático 
-- basado en los códigos estándar (510506, 510515, etc.) que acabamos de crear.
-- Si se asignara un valor aquí, se agruparían todos los conceptos en esa única cuenta.

UPDATE payroll_configuration
SET 
    enable_accounting_integration = TRUE
    -- payroll_expense_account = NULL, (Para mantener desglose por concepto)
    -- salaries_payable_account = NULL, (Usa 250501 por defecto)
    -- taxes_payable_account = NULL (Para mantener desglose de SS e Impuestos)
WHERE id > 0;
