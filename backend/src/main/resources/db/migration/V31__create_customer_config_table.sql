-- ====================================================
-- TABLA: customer_config
-- Configuración de integraciones por tenant/customer
-- ====================================================

CREATE TABLE IF NOT EXISTS customer_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL UNIQUE,
    
    -- Facebook Messenger
    facebook_app_id VARCHAR(100),
    facebook_app_secret TEXT,
    facebook_login_config_id VARCHAR(100) COMMENT 'Config ID de Facebook Login for Business',
    facebook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Instagram Direct
    instagram_app_id VARCHAR(100),
    instagram_login_config_id VARCHAR(100) COMMENT 'Config ID de Instagram Login for Business',
    instagram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- WhatsApp (Evolution API)
    evolution_api_url VARCHAR(500),
    evolution_api_key TEXT,
    evolution_instance_name VARCHAR(100) COMMENT 'Nombre de instancia en Evolution API',
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- TikTok
    tiktok_app_id VARCHAR(100),
    tiktok_app_secret TEXT,
    tiktok_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Custom integrations
    custom_integrations_json TEXT COMMENT 'JSON para integraciones customizadas',
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100) COMMENT 'Email del usuario que actualizó',
    
    -- Foreign Keys
    CONSTRAINT fk_customer_config_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES clientes(id) 
        ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_customer_config_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuración de integraciones por tenant (Facebook, Instagram, WhatsApp, TikTok)';
