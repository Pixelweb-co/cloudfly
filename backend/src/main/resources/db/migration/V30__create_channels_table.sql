-- Crear tabla de canales de comunicación
CREATE TABLE IF NOT EXISTS channels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Configuración específica por tipo
    phone_number VARCHAR(50),
    page_id VARCHAR(100),
    username VARCHAR(100),
    access_token VARCHAR(500),
    instance_name VARCHAR(100),
    webhook_url VARCHAR(500),
    api_key TEXT,
    configuration TEXT,
    
    -- Estado de sincronización
    last_sync TIMESTAMP,
    last_error VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_channel_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT uq_customer_channel_type UNIQUE (customer_id, type),
    
    -- Índices
    INDEX idx_customer_id (customer_id),
    INDEX idx_type (type),
    INDEX idx_is_active (is_active),
    INDEX idx_is_connected (is_connected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios
ALTER TABLE channels COMMENT = 'Canales de comunicación multi-plataforma (WhatsApp, Facebook, Instagram, TikTok)';
