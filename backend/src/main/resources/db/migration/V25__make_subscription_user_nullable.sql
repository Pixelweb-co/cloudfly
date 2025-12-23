-- V25: Make user_id nullable in subscriptions table
-- This allows subscriptions to exist without a specific user assigned
-- The subscription belongs to the Customer (organization), not necessarily to a specific user

ALTER TABLE subscriptions 
MODIFY COLUMN user_id BIGINT NULL;
