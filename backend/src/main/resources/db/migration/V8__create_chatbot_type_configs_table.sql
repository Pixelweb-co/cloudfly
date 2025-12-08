-- Migration V8: Create chatbot_type_configs table
-- This table stores the available chatbot types and their corresponding webhook URLs
-- These configurations are shared across all tenants

CREATE TABLE IF NOT EXISTS chatbot_type_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    webhook_url TEXT NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_name (type_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default chatbot types with placeholder webhook URLs
-- These should be updated with the actual n8n webhook URLs after deployment
INSERT INTO chatbot_type_configs (type_name, description, webhook_url, status) VALUES
('SALES', 'Chatbot de Ventas - Asistente para e-commerce y consultas de productos', 'https://autobot.cloudfly.com.co/webhook/sales', TRUE),
('SUPPORT', 'Chatbot de Soporte - Asistente para atención al cliente y tickets', 'https://autobot.cloudfly.com.co/webhook/support', TRUE),
('SCHEDULING', 'Chatbot de Agendamiento - Asistente para reservas y citas', 'https://autobot.cloudfly.com.co/webhook/scheduling', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
