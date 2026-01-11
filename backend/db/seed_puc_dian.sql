-- ============================================================================
-- SEED DATA: PLAN ÚNICO DE CUENTAS (PUC) COLOMBIA - DIAN COMPLIANT
-- ============================================================================
-- Incluye: Activos, Pasivos, Patrimonio, Ingresos, Gastos, Costos
-- Configurado para Tenant 1 (Default)

USE cloud_master;

-- Limpiar registros dependientes primero para evitar violaciones de foreign key
DELETE FROM accounting_entries WHERE voucher_id IN (SELECT id FROM accounting_vouchers WHERE tenant_id = 1);
DELETE FROM accounting_vouchers WHERE tenant_id = 1;

-- Limpiar PUC existente para evitar duplicados en reinicio
DELETE FROM chart_of_accounts WHERE tenant_id = 1;

-- ============================================================================
-- 1. ACTIVOS
-- ============================================================================
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, tax_type, tax_rate, dian_code, is_active) VALUES
(1, '1', 'ACTIVO', 'ACTIVO', 1, NULL, 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '11', 'DISPONIBLE', 'ACTIVO', 2, '1', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '1105', 'CAJA', 'ACTIVO', 3, '11', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '110505', 'Caja General', 'ACTIVO', 4, '1105', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '1110', 'BANCOS', 'ACTIVO', 3, '11', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '111005', 'Moneda Nacional', 'ACTIVO', 4, '1110', 'DEBITO', 0, 0, NULL, 0, NULL, 1),

(1, '13', 'DEUDORES', 'ACTIVO', 2, '1', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '1305', 'CLIENTES', 'ACTIVO', 3, '13', 'DEBITO', 1, 0, NULL, 0, NULL, 1),
(1, '130505', 'Clientes Nacionales', 'ACTIVO', 4, '1305', 'DEBITO', 1, 0, NULL, 0, NULL, 1),
(1, '1355', 'ANTICIPO DE IMPUESTOS', 'ACTIVO', 3, '13', 'DEBITO', 1, 0, NULL, 0, NULL, 1),
(1, '135515', 'Retención en la fuente', 'ACTIVO', 4, '1355', 'DEBITO', 1, 0, 'RETEFUENTE', 0, NULL, 1),

(1, '14', 'INVENTARIOS', 'ACTIVO', 2, '1', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '1435', 'MERCANCIAS NO FABR. POR LA EMPRESA', 'ACTIVO', 3, '14', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '143501', 'Inventario General', 'ACTIVO', 4, '1435', 'DEBITO', 0, 0, NULL, 0, NULL, 1),

(1, '15', 'PROPIEDADES PLANTA Y EQUIPO', 'ACTIVO', 2, '1', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '1524', 'EQUIPO DE OFICINA', 'ACTIVO', 3, '15', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '1528', 'EQUIPO DE COMPUTACION', 'ACTIVO', 3, '15', 'DEBITO', 0, 1, NULL, 0, NULL, 1);

-- ============================================================================
-- 2. PASIVOS
-- ============================================================================
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, tax_type, tax_rate, dian_code, is_active) VALUES
(1, '2', 'PASIVO', 'PASIVO', 1, NULL, 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '22', 'PROVEEDORES', 'PASIVO', 2, '2', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '2205', 'NACIONALES', 'PASIVO', 3, '22', 'CREDITO', 1, 0, NULL, 0, NULL, 1),
(1, '220501', 'Proveedores Nacionales', 'PASIVO', 4, '2205', 'CREDITO', 1, 0, NULL, 0, NULL, 1),

(1, '23', 'CUENTAS POR PAGAR', 'PASIVO', 2, '2', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '2335', 'COSTOS Y GASTOS POR PAGAR', 'PASIVO', 3, '23', 'CREDITO', 1, 0, NULL, 0, NULL, 1),
(1, '233550', 'Servicios Públicos', 'PASIVO', 4, '2335', 'CREDITO', 1, 0, NULL, 0, NULL, 1),

-- IMPUESTOS
(1, '2365', 'RETENCION EN LA FUENTE', 'PASIVO', 3, '23', 'CREDITO', 1, 0, 'RETEFUENTE', 0, NULL, 1),
(1, '236515', 'Honorarios', 'PASIVO', 4, '2365', 'CREDITO', 1, 0, 'RETEFUENTE', 11.00, NULL, 1),
(1, '236525', 'Servicios', 'PASIVO', 4, '2365', 'CREDITO', 1, 0, 'RETEFUENTE', 4.00, NULL, 1),
(1, '236540', 'Compras', 'PASIVO', 4, '2365', 'CREDITO', 1, 0, 'RETEFUENTE', 2.50, NULL, 1),

(1, '2368', 'IMPUESTO DE INDUSTRIA Y COMERCIO', 'PASIVO', 3, '23', 'CREDITO', 1, 0, 'RETE_ICA', 0, NULL, 1),
(1, '236805', 'ReteICA', 'PASIVO', 4, '2368', 'CREDITO', 1, 0, 'RETE_ICA', 0.966, NULL, 1), -- Ejemplo tarifa 9.66/1000

-- IVA
(1, '24', 'IMPUESTOS GRAVAMENES Y TASAS', 'PASIVO', 2, '2', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '2408', 'IMPUESTO SOBRE LAS VENTAS POR PAGAR', 'PASIVO', 3, '24', 'CREDITO', 0, 0, 'IVA_GENERADO', 19.00, NULL, 1),
(1, '240801', 'IVA Generado en Ventas', 'PASIVO', 4, '2408', 'CREDITO', 0, 0, 'IVA_GENERADO', 19.00, NULL, 1),
(1, '240810', 'IVA Descontable en Compras', 'PASIVO', 4, '2408', 'DEBITO', 0, 0, 'IVA_DESCONTABLE', 19.00, NULL, 1),

-- NOMINA PASIVOS
(1, '25', 'OBLIGACIONES LABORALES', 'PASIVO', 2, '2', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '2505', 'SALARIOS POR PAGAR', 'PASIVO', 3, '25', 'CREDITO', 1, 0, NULL, 0, NULL, 1),
(1, '250501', 'Salarios por Pagar', 'PASIVO', 4, '2505', 'CREDITO', 1, 0, NULL, 0, NULL, 1),
(1, '2370', 'RETENCIONES Y APORTES DE NOMINA', 'PASIVO', 3, '23', 'CREDITO', 1, 0, NULL, 0, NULL, 1),
(1, '237005', 'Aportes EPS', 'PASIVO', 4, '2370', 'CREDITO', 1, 0, NULL, 4.00, NULL, 1),
(1, '238030', 'Fondos de Pensiones', 'PASIVO', 4, '2380', 'CREDITO', 1, 0, NULL, 4.00, NULL, 1);


-- ============================================================================
-- 3. PATRIMONIO
-- ============================================================================
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, tax_type, tax_rate, dian_code, is_active) VALUES
(1, '3', 'PATRIMONIO', 'PATRIMONIO', 1, NULL, 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '31', 'CAPITAL SOCIAL', 'PATRIMONIO', 2, '3', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '3105', 'CAPITAL SUSCRITO Y PAGADO', 'PATRIMONIO', 3, '31', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '36', 'RESULTADOS DEL EJERCICIO', 'PATRIMONIO', 2, '3', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '3605', 'Utilidad del Ejercicio', 'PATRIMONIO', 3, '36', 'CREDITO', 0, 0, NULL, 0, NULL, 1);

-- ============================================================================
-- 4. INGRESOS
-- ============================================================================
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, tax_type, tax_rate, dian_code, is_active) VALUES
(1, '4', 'INGRESOS', 'INGRESO', 1, NULL, 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '41', 'OPERACIONALES', 'INGRESO', 2, '4', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '4135', 'COMERCIO AL POR MAYOR Y MENOR', 'INGRESO', 3, '41', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '413501', 'Venta de Bienes', 'INGRESO', 4, '4135', 'CREDITO', 0, 0, NULL, 0, NULL, 1),
(1, '413505', 'Venta de Servicios', 'INGRESO', 4, '4135', 'CREDITO', 0, 0, NULL, 0, NULL, 1);

-- ============================================================================
-- 5. GASTOS
-- ============================================================================
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, tax_type, tax_rate, dian_code, is_active) VALUES
(1, '5', 'GASTOS', 'GASTO', 1, NULL, 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '51', 'OPERACIONALES DE ADMINISTRACION', 'GASTO', 2, '5', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '5105', 'GASTOS DE PERSONAL', 'GASTO', 3, '51', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510506', 'Sueldos', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510515', 'Horas Extras', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510527', 'Auxilio de Transporte', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510568', 'Aportes ARL', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510569', 'Aportes EPS', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510570', 'Aportes Pensión', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),
(1, '510572', 'Caja de Compensación', 'GASTO', 4, '5105', 'DEBITO', 0, 1, NULL, 0, NULL, 1),

(1, '5135', 'SERVICIOS', 'GASTO', 3, '51', 'DEBITO', 1, 1, NULL, 0, NULL, 1),
(1, '513525', 'Acueducto y Alcantarillado', 'GASTO', 4, '5135', 'DEBITO', 1, 1, NULL, 0, NULL, 1),
(1, '513530', 'Energía Eléctrica', 'GASTO', 4, '5135', 'DEBITO', 1, 1, NULL, 0, NULL, 1),
(1, '513535', 'Teléfono', 'GASTO', 4, '5135', 'DEBITO', 1, 1, NULL, 0, NULL, 1),

(1, '5195', 'DIVERSOS', 'GASTO', 3, '51', 'DEBITO', 1, 1, NULL, 0, NULL, 1),
(1, '519530', 'Útiles, Papelería y Fotocopias', 'GASTO', 4, '5195', 'DEBITO', 1, 1, NULL, 0, NULL, 1),
(1, '519595', 'Otros Gastos Diversos', 'GASTO', 4, '5195', 'DEBITO', 1, 1, NULL, 0, NULL, 1),

(1, '53', 'NO OPERACIONALES', 'GASTO', 2, '5', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '5305', 'FINANCIEROS', 'GASTO', 3, '53', 'DEBITO', 1, 0, NULL, 0, NULL, 1),
(1, '530505', 'Gastos Bancarios', 'GASTO', 4, '5305', 'DEBITO', 1, 0, NULL, 0, NULL, 1);

-- ============================================================================
-- 6. COSTOS
-- ============================================================================
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, tax_type, tax_rate, dian_code, is_active) VALUES
(1, '6', 'COSTOS DE VENTAS', 'COSTO', 1, NULL, 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '61', 'COSTO DE VENTAS Y SERVICIOS', 'COSTO', 2, '6', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '6135', 'COMERCIO AL POR MAYOR Y MENOR', 'COSTO', 3, '61', 'DEBITO', 0, 0, NULL, 0, NULL, 1),
(1, '613501', 'Costo de Ventas', 'COSTO', 4, '6135', 'DEBITO', 0, 0, NULL, 0, NULL, 1);
