-- ============================================================================
-- MIGRACIÓN: Nómina Electrónica DIAN
-- Descripción: Actualiza tabla payroll_receipts para soporte DIAN Nómina Electrónica
--              y remueve campos legacy de CFDI (México)
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- ============================================================================
-- ACTUALIZACIÓN: payroll_receipts
-- ============================================================================

-- 1. Agregar nuevas columnas para DIAN
ALTER TABLE payroll_receipts
    ADD COLUMN cune VARCHAR(500) COMMENT 'Código Único de Nómina Electrónica',
    ADD COLUMN consecutive BIGINT COMMENT 'Consecutivo interno DIAN',
    ADD COLUMN payroll_type VARCHAR(20) DEFAULT '102' COMMENT '102=Nómina Individual, 103=Nota Ajuste',
    ADD COLUMN payment_method VARCHAR(2) DEFAULT '1' COMMENT '1=Efectivo, 10=Cheque, 42=Consignación',
    ADD COLUMN dian_status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING, SENT, ACCEPTED, REJECTED, ERROR',
    ADD COLUMN dian_message TEXT COMMENT 'Mensaje respuesta DIAN',
    ADD COLUMN xml_dian LONGBLOB COMMENT 'XML Firmado enviado a DIAN',
    ADD COLUMN xml_response LONGBLOB COMMENT 'XML Respuesta (AttachedDocument)',
    ADD COLUMN qr_code TEXT COMMENT 'Contenido QR para representación gráfica',
    ADD COLUMN sent_at DATETIME COMMENT 'Fecha envío DIAN';

-- 2. Eliminar columnas legacy (CFDI México)
-- Se recomienda verificar que no haya datos importantes antes de borrar
ALTER TABLE payroll_receipts
    DROP COLUMN uuid,
    DROP COLUMN xml_path,
    DROP COLUMN pdf_path,
    DROP COLUMN stamped_at;

-- 3. Agregar índices para búsquedas rápidas
CREATE INDEX idx_pr_cune ON payroll_receipts(cune(255));
CREATE INDEX idx_pr_dian_status ON payroll_receipts(dian_status);
CREATE INDEX idx_pr_consecutive ON payroll_receipts(consecutive);

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

ALTER TABLE payroll_receipts COMMENT = 'Recibos de Nómina Electrónica DIAN';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
