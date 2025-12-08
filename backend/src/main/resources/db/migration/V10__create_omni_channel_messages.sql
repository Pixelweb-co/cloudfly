-- Migration V10: Create omni_channel_messages table for multi-platform messaging
-- This table stores messages from WhatsApp, Facebook, Instagram, Telegram, etc.

CREATE TABLE IF NOT EXISTS omni_channel_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Multitenant + Contact
    tenant_id BIGINT NOT NULL,
    contact_id BIGINT,
    internal_conversation_id VARCHAR(100),
    
    -- Integration
    integration_key VARCHAR(150),
    provider VARCHAR(30) NOT NULL,
    platform VARCHAR(40) NOT NULL,
    
    -- External IDs
    external_conversation_id VARCHAR(200),
    external_message_id VARCHAR(200),
    external_quoted_message_id VARCHAR(200),
    
    -- Direction + Participants
    direction VARCHAR(20) NOT NULL,
    external_sender_id VARCHAR(200),
    external_recipient_id VARCHAR(200),
    from_user_id BIGINT,
    
    -- Content
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    body TEXT,
    media_url VARCHAR(500),
    title VARCHAR(255),
    extra_data TEXT,
    display_name VARCHAR(255),
    
    -- Status + Timestamps
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT',
    
    -- Raw Payload
    raw_payload TEXT,
    
    -- Indexes
    INDEX idx_msg_tenant_contact (tenant_id, contact_id),
    INDEX idx_msg_tenant_conv (tenant_id, internal_conversation_id),
    INDEX idx_msg_platform_conv (platform, external_conversation_id),
    INDEX idx_msg_created_at (created_at),
    INDEX idx_external_message_id (external_message_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
