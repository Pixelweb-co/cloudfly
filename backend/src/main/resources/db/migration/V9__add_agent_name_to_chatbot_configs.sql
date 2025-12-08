-- Migration V9: Add agent_name column to chatbot_configs table
-- This allows tenants to customize the name their chatbot agent presents itself with

ALTER TABLE chatbot_configs
ADD COLUMN agent_name VARCHAR(255) DEFAULT NULL
AFTER context;

-- Update existing records with a default agent name if needed
UPDATE chatbot_configs
SET agent_name = 'Asistente Virtual'
WHERE agent_name IS NULL;
