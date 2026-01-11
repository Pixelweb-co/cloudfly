-- ============================================================================
-- MIGRACIÓN: Agregar campos DIAN a tabla InvoiceItem (invoice_items)
-- Descripción: Agrega campos necesarios para facturación electrónica DIAN UBL 2.1
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- Agregar identificación del producto/servicio
ALTER TABLE invoice_items
    ADD COLUMN IF NOT EXISTS codigo_producto VARCHAR(100) DEFAULT NULL COMMENT 'SKU, EAN, código interno',
    ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT NULL COMMENT 'Descripción detallada (OBLIGATORIO DIAN)',
    ADD COLUMN IF NOT EXISTS unidad_medida_unece VARCHAR(10) DEFAULT NULL COMMENT 'Código UNECE: NIU, KGM, MTR, HUR',
    ADD COLUMN IF NOT EXISTS unidad_medida_desc VARCHAR(100) DEFAULT NULL COMMENT 'Descripción unidad de medida',
    ADD COLUMN IF NOT EXISTS marca VARCHAR(200) DEFAULT NULL COMMENT 'Marca del producto',
    ADD COLUMN IF NOT EXISTS modelo VARCHAR(200) DEFAULT NULL COMMENT 'Modelo del producto';

-- Agregar impuestos detallados (OBLIGATORIO DIAN)
ALTER TABLE invoice_items
    ADD COLUMN IF NOT EXISTS tipo_impuesto VARCHAR(20) DEFAULT NULL COMMENT 'IVA, INC (Consumo), ICA',
    ADD COLUMN IF NOT EXISTS tarifa_iva VARCHAR(20) DEFAULT NULL COMMENT '0%, 5%, 19%, EXCLUIDO, EXENTO',
    ADD COLUMN IF NOT EXISTS porcentaje_impuesto DECIMAL(5,2) DEFAULT NULL COMMENT 'Porcentaje del impuesto',
    ADD COLUMN IF NOT EXISTS base_impuesto DECIMAL(12,2) DEFAULT NULL COMMENT 'Base sobre la que se calcula el impuesto',
    ADD COLUMN IF NOT EXISTS impuesto_calculado DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor del impuesto calculado';

-- Agregar descuentos y cargos a nivel de línea
ALTER TABLE invoice_items
    ADD COLUMN IF NOT EXISTS descuentos_linea TEXT DEFAULT NULL COMMENT 'JSON con descuentos aplicados',
    ADD COLUMN IF NOT EXISTS valor_descuentos DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total descuentos de la línea',
    ADD COLUMN IF NOT EXISTS cargos_linea TEXT DEFAULT NULL COMMENT 'JSON con cargos adicionales',
    ADD COLUMN IF NOT EXISTS valor_cargos DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total cargos de la línea';

-- Agregar información adicional
ALTER TABLE invoice_items
    ADD COLUMN IF NOT EXISTS numero_linea INT DEFAULT NULL COMMENT 'Número de línea en la factura',
    ADD COLUMN IF NOT EXISTS es_gratuito BOOLEAN DEFAULT FALSE COMMENT 'Item gratuito (bonificación)',
    ADD COLUMN IF NOT EXISTS notas_linea VARCHAR(1000) DEFAULT NULL COMMENT 'Notas adicionales';

-- Agregar auditoría
ALTER TABLE invoice_items
    ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha creación';

-- Modificar precision de campos existentes para manejar valores más grandes
ALTER TABLE invoice_items
    MODIFY COLUMN unitPrice DECIMAL(12,2),
    MODIFY COLUMN discount DECIMAL(12,2),
    MODIFY COLUMN subtotal DECIMAL(12,2),
    MODIFY COLUMN tax DECIMAL(12,2),
    MODIFY COLUMN total DECIMAL(12,2);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_product_id ON invoice_items(productId);
CREATE INDEX IF NOT EXISTS idx_numero_linea ON invoice_items(numero_linea);

-- ============================================================================
-- DATOS DE EJEMPLO (Opcional - solo para desarrollo/testing)
-- ============================================================================

-- Actualizar items existentes con valores por defecto
UPDATE invoice_items 
SET 
    unidad_medida_unece = 'NIU',  -- Unidad por defecto
    unidad_medida_desc = 'Unidad',
    tipo_impuesto = 'IVA',
    es_gratuito = FALSE,
    valor_descuentos = 0.00,
    valor_cargos = 0.00
WHERE unidad_medida_unece IS NULL;

-- Copiar datos existentes a nuevos campos DIAN
UPDATE invoice_items 
SET 
    descripcion = productName,
    base_impuesto = subtotal,
    impuesto_calculado = tax
WHERE descripcion IS NULL AND productName IS NOT NULL;

-- Calcular porcentaje de IVA basado en el tax y subtotal
UPDATE invoice_items 
SET 
    porcentaje_impuesto = CASE 
        WHEN subtotal > 0 THEN ROUND((tax / subtotal) * 100, 2)
        ELSE 0
    END,
    tarifa_iva = CASE 
        WHEN subtotal > 0 AND tax > 0 THEN 
            CONCAT(ROUND((tax / subtotal) * 100, 0), '%')
        ELSE '0%'
    END
WHERE porcentaje_impuesto IS NULL AND subtotal IS NOT NULL AND tax IS NOT NULL;

-- ============================================================================
-- COMENTARIOS TABLA
-- ============================================================================

ALTER TABLE invoice_items COMMENT = 'Líneas de factura con soporte DIAN UBL 2.1';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las columnas se agregaron correctamente
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cloudfly_erp'
  AND TABLE_NAME = 'invoice_items'
  AND (COLUMN_NAME LIKE '%dian%' 
       OR COLUMN_NAME LIKE '%impuesto%' 
       OR COLUMN_NAME LIKE '%unidad%'
       OR COLUMN_NAME LIKE '%descuento%'
       OR COLUMN_NAME LIKE '%cargo%')
ORDER BY ORDINAL_POSITION;

-- Mostrar estadísticas
SELECT 
    COUNT(*) as total_items,
    COUNT(DISTINCT invoice_id) as total_facturas,
    SUM(CASE WHEN descripcion IS NOT NULL THEN 1 ELSE 0 END) as con_descripcion,
    SUM(CASE WHEN unidad_medida_unece IS NOT NULL THEN 1 ELSE 0 END) as con_unidad_medida
FROM invoice_items;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
