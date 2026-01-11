-- ============================================================================
-- SCHEMA: Microservicio DIAN - CloudFly ERP
-- Descripción: Tabla para almacenar documentos electrónicos procesados
-- Versión: 1.0.0
-- Fecha: 2024-12-29
-- ============================================================================

CREATE DATABASE IF NOT EXISTS dian_service
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE dian_service;

-- Tabla principal de documentos electrónicos
CREATE TABLE IF NOT EXISTS electronic_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación
    event_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'ID único del evento Kafka',
    document_type VARCHAR(20) NOT NULL COMMENT 'INVOICE, CREDIT_NOTE, DEBIT_NOTE, PAYROLL',
    
    -- Multi-tenancy
    tenant_id BIGINT NOT NULL COMMENT 'ID del tenant',
    company_id BIGINT NOT NULL COMMENT 'ID de la compañía',
    
    -- Origen
    source_system VARCHAR(50) DEFAULT NULL COMMENT 'Sistema origen (ERP, POS, etc)',
    source_document_id VARCHAR(100) DEFAULT NULL COMMENT 'ID del documento en el sistema origen',
    
    -- Datos DIAN
    dian_document_number VARCHAR(100) DEFAULT NULL COMMENT 'Número DIAN asignado',
    cufe_or_cune VARCHAR(500) DEFAULT NULL COMMENT 'CUFE (factura) o CUNE (nómina)',
    
    -- Estado
    status VARCHAR(20) NOT NULL COMMENT 'RECEIVED, PROCESSING, ACCEPTED, REJECTED, ERROR',
    environment VARCHAR(20) DEFAULT 'TEST' COMMENT 'TEST o PRODUCTION',
    
    -- XMLs
    xml_signed LONGBLOB DEFAULT NULL COMMENT 'XML firmado digitalmente',
    xml_response LONGBLOB DEFAULT NULL COMMENT 'XML de respuesta DIAN',
    
    -- Errores
    error_code VARCHAR(50) DEFAULT NULL,
    error_message VARCHAR(1000) DEFAULT NULL,
    
    -- Payload original
    payload_json TEXT DEFAULT NULL COMMENT 'JSON del payload completo',
    
    -- Auditoría
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    processed_at DATETIME DEFAULT NULL COMMENT 'Fecha de procesamiento completado',
    
    -- Índices para rendimiento
    INDEX idx_tenant_company (tenant_id, company_id),
    INDEX idx_event_id (event_id),
    INDEX idx_source (source_system, source_document_id),
    INDEX idx_status (status),
    INDEX idx_cufe (cufe_or_cune),
    INDEX idx_created (created_at),
    INDEX idx_processed (processed_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Documentos electrónicos procesados por el microservicio DIAN';

-- ============================================================================
-- Datos de prueba (opcional - solo desarrollo)
-- ============================================================================

-- INSERT INTO electronic_documents (
--     event_id, document_type, tenant_id, company_id,
--     source_system, source_document_id,
--     dian_document_number, status, environment
-- ) VALUES (
--     'test-event-001',
--     'INVOICE',
--     1,
--     1,
--     'ERP_INVOICE',
--     'INV-2024-001',
--     'FE0001',
--     'RECEIVED',
--     'TEST'
-- );

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
