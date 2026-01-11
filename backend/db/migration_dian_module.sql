-- ============================================================================
-- MIGRACIÓN: Módulo DIAN - Cloudfly ERP
-- Descripción: Crea las tablas necesarias para el módulo de configuración DIAN
-- Versión: 1.0.0
-- Fecha: 2024-12-29
-- ============================================================================

-- Eliminar tablas existentes (solo en desarrollo)
-- ¡COMENTAR ESTAS LINEAS EN PRODUCCIÓN!
-- DROP TABLE IF EXISTS dian_resolutions;
-- DROP TABLE IF EXISTS dian_certificates;
-- DROP TABLE IF EXISTS dian_operation_modes;

-- ============================================================================
-- Tabla: dian_operation_modes
-- Descripción: Almacena la configuración de software propio DIAN por empresa
-- ============================================================================
CREATE TABLE IF NOT EXISTS dian_operation_modes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT 'ID del tenant (Customer)',
    company_id BIGINT NOT NULL COMMENT 'ID de la compañía dentro del tenant',
    document_type VARCHAR(50) NOT NULL COMMENT 'Tipo de documento: INVOICE, CREDIT_NOTE, etc.',
    environment VARCHAR(20) NOT NULL COMMENT 'Ambiente: TEST o PRODUCTION',
    software_id VARCHAR(100) NOT NULL COMMENT 'Software ID proporcionado por DIAN',
    pin VARCHAR(10) NOT NULL COMMENT 'PIN del software DIAN',
    test_set_id VARCHAR(100) DEFAULT NULL COMMENT 'Test Set ID para habilitación',
    certification_process BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si está en proceso de certificación',
    active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el modo está activo',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para rendimiento
    INDEX idx_tenant_company (tenant_id, company_id),
    INDEX idx_document_type (document_type),
    INDEX idx_environment (environment),
    INDEX idx_active (active),
    
    -- Índice compuesto para búsquedas comunes
    INDEX idx_tenant_company_doc (tenant_id, company_id, document_type),
    
    -- Constraint: solo un modo activo por combinación
    UNIQUE KEY uk_active_mode (tenant_id, company_id, document_type, environment, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Configuración de modos de operación DIAN por empresa';

-- ============================================================================
-- Tabla: dian_certificates
-- Descripción: Almacena certificados digitales para firma electrónica DIAN
-- ============================================================================
CREATE TABLE IF NOT EXISTS dian_certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT 'ID del tenant',
    company_id BIGINT NOT NULL COMMENT 'ID de la compañía',
    alias VARCHAR(100) NOT NULL COMMENT 'Nombre amigable del certificado',
    type VARCHAR(10) NOT NULL COMMENT 'Tipo: P12 o PEM',
    storage_key VARCHAR(500) NOT NULL COMMENT 'Ruta de almacenamiento del archivo',
    password_hash VARCHAR(500) NOT NULL COMMENT 'Contraseña encriptada',
    issuer VARCHAR(500) DEFAULT NULL COMMENT 'Emisor del certificado (DN)',
    subject VARCHAR(500) DEFAULT NULL COMMENT 'Sujeto del certificado (DN)',
    serial_number VARCHAR(100) DEFAULT NULL COMMENT 'Número de serie',
    valid_from DATETIME DEFAULT NULL COMMENT 'Fecha inicio de vigencia',
    valid_to DATETIME DEFAULT NULL COMMENT 'Fecha fin de vigencia',
    active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el certificado está activo',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_cert_tenant_company (tenant_id, company_id),
    INDEX idx_cert_active (active),
    INDEX idx_cert_validity (valid_from, valid_to),
    INDEX idx_cert_type (type),
    
    -- Búsqueda de certificados vigentes
    INDEX idx_cert_valid_active (tenant_id, company_id, active, valid_from, valid_to)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Certificados digitales DIAN para firma electrónica';

-- ============================================================================
-- Tabla: dian_resolutions
-- Descripción: Almacena resoluciones de facturación DIAN con rangos autorizados
-- ============================================================================
CREATE TABLE IF NOT EXISTS dian_resolutions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT 'ID del tenant',
    company_id BIGINT NOT NULL COMMENT 'ID de la compañía',
    document_type VARCHAR(50) NOT NULL COMMENT 'Tipo de documento',
    prefix VARCHAR(10) NOT NULL COMMENT 'Prefijo de numeración (ej: FE, NC)',
    number_range_from BIGINT NOT NULL COMMENT 'Número inicial del rango autorizado',
    number_range_to BIGINT NOT NULL COMMENT 'Número final del rango autorizado',
    current_number BIGINT NOT NULL COMMENT 'Número actual (siguiente a usar)',
    technical_key VARCHAR(200) NOT NULL COMMENT 'Clave técnica de la resolución',
    resolution_number VARCHAR(50) DEFAULT NULL COMMENT 'Número de la resolución DIAN',
    valid_from DATE NOT NULL COMMENT 'Fecha inicio de vigencia',
    valid_to DATE NOT NULL COMMENT 'Fecha fin de vigencia',
    active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si la resolución está activa',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_res_tenant_company (tenant_id, company_id),
    INDEX idx_res_doc_type (document_type),
    INDEX idx_res_prefix (prefix),
    INDEX idx_res_active (active),
    INDEX idx_res_validity (valid_from, valid_to),
    
    -- Búsqueda de resolución activa por tipo y prefijo
    INDEX idx_res_lookup (tenant_id, company_id, document_type, prefix, active),
    
    -- Constraint: validaciones
    CHECK (number_range_from > 0),
    CHECK (number_range_to >= number_range_from),
    CHECK (current_number >= number_range_from),
    CHECK (current_number <= number_range_to),
    CHECK (valid_to >= valid_from)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Resoluciones de facturación DIAN con rangos autorizados';

-- ============================================================================
-- Datos de prueba (opcional - solo para desarrollo)
-- ============================================================================

-- Insertar modo de operación de prueba
INSERT INTO dian_operation_modes 
    (tenant_id, company_id, document_type, environment, software_id, pin, test_set_id, certification_process, active)
VALUES 
    (1, 1, 'INVOICE', 'TEST', 'SOFT-TEST-12345', '1234', 'TS-001', true, true);

-- Insertar resolución de prueba
INSERT INTO dian_resolutions 
    (tenant_id, company_id, document_type, prefix, number_range_from, number_range_to, current_number, 
     technical_key, resolution_number, valid_from, valid_to, active)
VALUES 
    (1, 1, 'INVOICE', 'FE', 1, 10000, 1, 'CLAVE-TECNICA-PRUEBA', 'R-2024-001', '2024-01-01', '2025-12-31', true);

-- ============================================================================
-- Verificación de la instalación
-- ============================================================================

-- Verificar que las tablas se crearon
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM 
    information_schema.TABLES 
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('dian_operation_modes', 'dian_certificates', 'dian_resolutions');

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
