CREATE TABLE chatbots (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id               INT NOT NULL UNIQUE,
    agent_type              VARCHAR(50) NOT NULL DEFAULT 'sales',
    agent_name              VARCHAR(100) NOT NULL DEFAULT 'Asistente',
    language                VARCHAR(10) NOT NULL DEFAULT 'es',
    tone                    VARCHAR(50) NOT NULL DEFAULT 'profesional',
    system_prompt_override  TEXT NULL,
    extra_instructions      TEXT NULL,
    enabled_tools           JSON NOT NULL,
    max_history             INT NOT NULL DEFAULT 10,
    max_tool_loops          INT NOT NULL DEFAULT 5,
    temperature             FLOAT NOT NULL DEFAULT 0.7,
    is_active               TINYINT NOT NULL DEFAULT 1,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP 
                            ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id)
);
