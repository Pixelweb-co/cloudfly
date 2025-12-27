-- ======================================================================
-- TABLA: system_config
-- Descripción: Configuración global del sistema (solo debe haber 1 registro)
-- ======================================================================

CREATE TABLE IF NOT EXISTS system_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Configuración General
    system_name VARCHAR(200),
    system_description VARCHAR(500),
    logo_url VARCHAR(500),
    support_email VARCHAR(100),
    support_phone VARCHAR(50),
    terms_of_service TEXT,
    privacy_policy TEXT,
    
    -- Integración Facebook
    facebook_app_id VARCHAR(100),
    facebook_app_secret TEXT,
    facebook_redirect_uri VARCHAR(500),
    facebook_webhook_verify_token VARCHAR(200),
    facebook_api_version VARCHAR(100) DEFAULT 'v18.0',
    facebook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Integración WhatsApp (Evolution API)
    evolution_api_url VARCHAR(500),
    evolution_api_key TEXT,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Auditoría
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    
    -- Índices
    INDEX idx_facebook_enabled (facebook_enabled),
    INDEX idx_whatsapp_enabled (whatsapp_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración por defecto
INSERT INTO system_config (
    system_name,
    system_description,
    facebook_api_version,
    facebook_enabled,
    whatsapp_enabled
) VALUES (
    'CloudFly ERP',
    'Sistema ERP Multi-tenant con IA',
    'v18.0',
    FALSE,
    FALSE
) ON DUPLICATE KEY UPDATE id = id;
