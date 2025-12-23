-- V20: Add user_id to employees table for system access
-- This migration adds the relationship between Employee and UserEntity

ALTER TABLE employees 
ADD COLUMN user_id BIGINT NULL,
ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Index for faster lookups
CREATE INDEX idx_employee_user_id ON employees(user_id);
