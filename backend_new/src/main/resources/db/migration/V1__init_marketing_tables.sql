-- Initial Marketing Module Migration for backend_new
-- Created to fix Table 'global_agents' doesn't exist error

-- 1. Table for Global Agent Templates
CREATE TABLE IF NOT EXISTS `global_agents` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `base_prompt` TEXT NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table for Tenant/Company Agent Personalization
CREATE TABLE IF NOT EXISTS `tenant_agent_configs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT NOT NULL,
    `global_agent_id` BIGINT NOT NULL,
    `display_name` VARCHAR(255),
    `company_specific_context` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tenant_agent_global` FOREIGN KEY (`global_agent_id`) REFERENCES `global_agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table for Channels (Migration from V34)
CREATE TABLE IF NOT EXISTS `channels` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT NOT NULL,
    `company_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20),
    `instance_name` VARCHAR(100),
    `platform` ENUM('WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'WEB') NOT NULL,
    `provider` ENUM('EVOLUTION_API', 'META_API', 'TWILIO', 'CUSTOM') NOT NULL,
    `bot_integration_id` BIGINT,
    `status` BOOLEAN DEFAULT TRUE,
    `settings_json` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_channels_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `clientes` (`id`),
    CONSTRAINT `fk_channels_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table for Marketing Campaigns (Migration from V34)
CREATE TABLE IF NOT EXISTS `marketing_campaigns` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT NOT NULL,
    `company_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED') DEFAULT 'DRAFT',
    `start_date` DATETIME,
    `end_date` DATETIME,
    `budget` DECIMAL(19, 4),
    `target_pipeline_id` BIGINT,
    `target_stage_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_campaigns_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `clientes` (`id`),
    CONSTRAINT `fk_campaigns_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
