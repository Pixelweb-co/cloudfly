-- Migration V11: Add stage and avatar_url columns to contacts table
-- stage: For organizing contacts in Kanban board (LEAD, POTENTIAL, CLIENT)
-- avatar_url: For displaying contact profile pictures

ALTER TABLE contacts
ADD COLUMN stage VARCHAR(50) DEFAULT 'LEAD' AFTER type;

ALTER TABLE contacts
ADD COLUMN avatar_url VARCHAR(500) AFTER stage;

-- Update existing contacts with default stage
UPDATE contacts
SET stage = 'LEAD'
WHERE stage IS NULL;
