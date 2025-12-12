-- ============================================
-- MIGRACIÓN: Campos Contables para Productos
-- Fecha: 2025-12-11
-- Descripción: Agrega campos contables a la tabla productos
-- ============================================

ALTER TABLE productos
ADD COLUMN income_account_code VARCHAR(10) COMMENT 'Cuenta de ingresos (Ej: 4135)',
ADD COLUMN cost_account_code VARCHAR(10) COMMENT 'Cuenta de costos (Ej: 6135)',
ADD COLUMN inventory_account_code VARCHAR(10) COMMENT 'Cuenta de inventario (Ej: 1435)',
ADD COLUMN vat_rate DECIMAL(5,2) COMMENT 'Tarifa de IVA (%)',
ADD COLUMN consumption_tax_code VARCHAR(10) COMMENT 'Código impuesto al consumo',
ADD COLUMN consumption_tax_rate DECIMAL(5,2) COMMENT 'Tarifa impuesto consumo (%)',
ADD COLUMN vat_exempt BOOLEAN DEFAULT FALSE COMMENT 'Excluido de IVA',
ADD COLUMN average_cost DECIMAL(15,2) COMMENT 'Costo promedio para contabilidad';

-- Índices para optimizar consultas contables
CREATE INDEX idx_productos_income_account ON productos(income_account_code);
CREATE INDEX idx_productos_cost_account ON productos(cost_account_code);
CREATE INDEX idx_productos_inventory_account ON productos(inventory_account_code);

-- ============================================
-- Actualizar productos existentes con valores por defecto
-- ============================================

-- Productos de venta al público: cuenta de ingresos 4135
UPDATE productos 
SET income_account_code = '413599',  -- Otros al por menor
    cost_account_code = '613599',     -- Costo otros al por menor
    inventory_account_code = '143599', -- Otras mercancías
    vat_rate = 19.00,                 -- IVA del 19%
    vat_exempt = FALSE
WHERE income_account_code IS NULL;

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
