CREATE TABLE IF NOT EXISTS token_usage_log (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id         INT NOT NULL,
    conversation_id   VARCHAR(100),
    label             VARCHAR(50),
    prompt_tokens     INT NOT NULL,
    completion_tokens INT NOT NULL,
    total_tokens      INT NOT NULL,
    cost_usd          DECIMAL(12, 8) NOT NULL,
    model             VARCHAR(50),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_date   (tenant_id, created_at),
    INDEX idx_conversation  (conversation_id)
);
