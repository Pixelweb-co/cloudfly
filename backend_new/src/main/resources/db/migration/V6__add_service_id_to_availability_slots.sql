-- Add missing service_id column to availability_slots
-- Required by the scheduler-service when generating time slots
ALTER TABLE availability_slots
    ADD COLUMN IF NOT EXISTS service_id BIGINT NULL AFTER company_id;
