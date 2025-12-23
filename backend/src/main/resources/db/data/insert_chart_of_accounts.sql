-- ========================================
-- Script SQL: Datos de Prueba para Plan de Cuentas (PUC Colombia)
-- ========================================

-- Limpiar tabla si existe
DELETE FROM chart_of_accounts WHERE id > 0;

-- ACTIVOS (Clase 1)
INSERT INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, is_active, is_system) VALUES
-- Nivel 1: Clase
('1', 'ACTIVO', 'ACTIVO', 1, NULL, 'DEBITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 2: Grupos
('11', 'DISPONIBLE', 'ACTIVO', 2, '1', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('13', 'DEUDORES', 'ACTIVO', 2, '1', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('14', 'INVENTARIOS', 'ACTIVO', 2, '1', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('15', 'PROPIEDADES PLANTA Y EQUIPO', 'ACTIVO', 2, '1', 'DEBITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 3: Cuentas
('1105', 'CAJA', 'ACTIVO', 3, '11', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('1110', 'BANCOS', 'ACTIVO', 3, '11', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('1305', 'CLIENTES', 'ACTIVO', 3, '13', 'DEBITO', TRUE, FALSE, TRUE, TRUE),
('1355', 'ANTICIPO IMPUESTOS', 'ACTIVO', 3, '13', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('1435', 'MERCANCIAS NO FABRICADAS POR LA EMPRESA', 'ACTIVO', 3, '14', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('1524', 'EQUIPO DE OFICINA', 'ACTIVO', 3, '15', 'DEBITO', FALSE, TRUE, TRUE, TRUE),
('1528', 'EQUIPO DE COMPUTACION Y COMUNICACION', 'ACTIVO', 3, '15', 'DEBITO', FALSE, TRUE, TRUE, TRUE);

-- PASIVOS (Clase 2)
INSERT INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, is_active, is_system) VALUES
-- Nivel 1: Clase
('2', 'PASIVO', 'PASIVO', 1, NULL, 'CREDITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 2: Grupos
('23', 'CUENTAS POR PAGAR', 'PASIVO', 2, '2', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('24', 'IMPUESTOS GRAVAMENES Y TASAS', 'PASIVO', 2, '2', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('25', 'OBLIGACIONES LABORALES', 'PASIVO', 2, '2', 'CREDITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 3: Cuentas
('2335', 'COSTOS Y GASTOS POR PAGAR', 'PASIVO', 3, '23', 'CREDITO', TRUE, FALSE, TRUE, TRUE),
('2365', 'RETENCION EN LA FUENTE', 'PASIVO', 3, '23', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('2367', 'RETENCION IVA', 'PASIVO', 3, '23', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('2408', 'IMPUESTO SOBRE LAS VENTAS POR PAGAR', 'PASIVO', 3, '24', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('2505', 'SALARIOS POR PAGAR', 'PASIVO', 3, '25', 'CREDITO', FALSE, FALSE, TRUE, TRUE);

-- PATRIMONIO (Clase 3)
INSERT INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, is_active, is_system) VALUES
-- Nivel 1: Clase
('3', 'PATRIMONIO', 'PATRIMONIO', 1, NULL, 'CREDITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 2: Grupos  
('31', 'CAPITAL SOCIAL', 'PATRIMONIO', 2, '3', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('36', 'RESULTADOS DEL EJERCICIO', 'PATRIMONIO', 2, '3', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('37', 'RESULTADOS DE EJERCICIOS ANTERIORES', 'PATRIMONIO', 2, '3', 'CREDITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 3: Cuentas
('3105', 'CAPITAL SUSCRITO Y PAGADO', 'PATRIMONIO', 3, '31', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('3605', 'UTILIDAD DEL EJERCICIO', 'PATRIMONIO', 3, '36', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('3610', 'PERDIDA DEL EJERCICIO', 'PATRIMONIO', 3, '36', 'DEBITO', FALSE, FALSE, TRUE, TRUE);

-- INGRESOS (Clase 4)
INSERT INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, is_active, is_system) VALUES
-- Nivel 1: Clase
('4', 'INGRESOS', 'INGRESO', 1, NULL, 'CREDITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 2: Grupos
('41', 'OPERACIONALES', 'INGRESO', 2, '4', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('42', 'NO OPERACIONALES', 'INGRESO', 2, '4', 'CREDITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 3: Cuentas
('4135', 'COMERCIO AL POR MAYOR Y AL POR MENOR', 'INGRESO', 3, '41', 'CREDITO', FALSE, FALSE, TRUE, TRUE),
('4175', 'DEVOLUCIONES EN VENTAS', 'INGRESO', 3, '41', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('4210', 'FINANCIEROS', 'INGRESO', 3, '42', 'CREDITO', FALSE, FALSE, TRUE, TRUE);

-- GASTOS (Clase 5)
INSERT INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, is_active, is_system) VALUES
-- Nivel 1: Clase
('5', 'GASTOS', 'GASTO', 1, NULL, 'DEBITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 2: Grupos
('51', 'OPERACIONALES DE ADMINISTRACION', 'GASTO', 2, '5', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('52', 'OPERACIONALES DE VENTAS', 'GASTO', 2, '5', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('53', 'NO OPERACIONALES', 'GASTO', 2, '5', 'DEBITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 3: Cuentas
('5105', 'GASTOS DE PERSONAL', 'GASTO', 3, '51', 'DEBITO', FALSE, TRUE, TRUE, TRUE),
('5115', 'IMPUESTOS', 'GASTO', 3, '51', 'DEBITO', FALSE, FALSE, TRUE, TRUE),
('5120', 'ARRENDAMIENTOS', 'GASTO', 3, '51', 'DEBITO', FALSE, TRUE, TRUE, TRUE),
('5195', 'DIVERSOS', 'GASTO', 3, '51', 'DEBITO', FALSE, TRUE, TRUE, TRUE),
('5205', 'GASTOS DE PERSONAL', 'GASTO', 3, '52', 'DEBITO', FALSE, TRUE, TRUE, TRUE),
('5305', 'FINANCIEROS', 'GASTO', 3, '53', 'DEBITO', FALSE, FALSE, TRUE, TRUE);

-- COSTOS (Clase 6)
INSERT INTO chart_of_accounts (code, name, account_type, level, parent_code, nature, requires_third_party, requires_cost_center, is_active, is_system) VALUES
-- Nivel 1: Clase
('6', 'COSTOS DE VENTAS', 'COSTO', 1, NULL, 'DEBITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 2: Grupos
('61', 'COSTO DE VENTAS Y DE PRESTACION DE SERVICIOS', 'COSTO', 2, '6', 'DEBITO', FALSE, FALSE, TRUE, TRUE),

-- Nivel 3: Cuentas
('6135', 'COMERCIO AL POR MAYOR Y AL POR MENOR', 'COSTO', 3, '61', 'DEBITO', FALSE, TRUE, TRUE, TRUE);

-- Verificación
SELECT 
    account_type AS 'Tipo',
    COUNT(*) AS 'Cantidad'
FROM chart_of_accounts
GROUP BY account_type
ORDER BY account_type;

SELECT 
    CONCAT('Total de cuentas: ', COUNT(*)) AS 'Resultado'
FROM chart_of_accounts;
