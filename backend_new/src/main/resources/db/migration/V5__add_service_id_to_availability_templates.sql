-- Add missing columns to availability_templates
-- service_id: links template to a specific product/service
-- exceptions: JSON field to store date-based schedule exceptions
ALTER TABLE availability_templates
    ADD COLUMN IF NOT EXISTS service_id BIGINT NULL AFTER company_id,
    ADD COLUMN IF NOT EXISTS exceptions JSON NULL AFTER allow_weekends;
