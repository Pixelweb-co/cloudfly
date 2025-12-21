-- V21: Add business_type and business_description to clientes table
-- This migration adds fields to identify the type of business and its description

ALTER TABLE clientes 
ADD COLUMN business_type VARCHAR(30) NULL,
ADD COLUMN business_description TEXT NULL;

-- Comment on the columns
-- business_type: VENTAS (sales), AGENDAMIENTO (scheduling), SUSCRIPCION (subscription), MIXTO (mixed)
-- business_description: Detailed description of the business / corporate purpose
