-- =====================================================
-- Agregar facebookLoginConfigId a system_config
-- Config ID global/fallback para Facebook Login for Business
-- =====================================================

ALTER TABLE system_config
ADD COLUMN facebook_login_config_id VARCHAR(100) NULL 
COMMENT 'Configuration ID global de Facebook Login for Business (fallback)';
