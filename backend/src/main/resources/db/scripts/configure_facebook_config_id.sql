# ====================================================
# Script de Ejemplo: Configurar Facebook Login Config ID
# ====================================================
# 
# IMPORTANTE: Ejecutar este script DESPUÉS de:
# 1. Crear la configuración en Meta Developers Console
# 2. Obtener el config_id generado por Meta
#
# USO:
# Reemplaza los valores y ejecuta en MySQL/MariaDB
# ====================================================

-- ==========================================
-- PASO 1: Verificar Customer ID
-- ==========================================
-- Encuentra el ID de tu tenant/customer

SELECT id, nombre_cliente, email_cliente, status_cliente
FROM clientes
WHERE nombre_cliente LIKE '%TuEmpresa%';

-- Anota el ID del customer (ejemplo: 1)


-- ==========================================
-- PASO 2: Verificar si existe CustomerConfig
-- ==========================================
-- Si ya existe, usa UPDATE. Si no existe, usa INSERT.

SELECT * FROM customer_config WHERE customer_id = 1;


-- ==========================================
-- CASO A: No existe CustomerConfig (INSERT)
-- ==========================================

INSERT INTO customer_config (
    customer_id,
    facebook_login_config_id,
    facebook_enabled,
    created_at,
    updated_at,
    last_updated_by
) VALUES (
    1,  -- ⬅️ REEMPLAZA con tu customer_id
    '123456789012345',  -- ⬅️ REEMPLAZA con tu config_id de Meta
    TRUE,
    NOW(),
    NOW(),
    'admin@tuempresa.com'  -- ⬅️ Email del administrador
);


-- ==========================================
-- CASO B: Ya existe CustomerConfig (UPDATE)
-- ==========================================

UPDATE customer_config
SET 
    facebook_login_config_id = '123456789012345',  -- ⬅️ REEMPLAZA con tu config_id
    facebook_enabled = TRUE,
    updated_at = NOW(),
    last_updated_by = 'admin@tuempresa.com'  -- ⬅️ Email del administrador
WHERE customer_id = 1;  -- ⬅️ REEMPLAZA con tu customer_id


-- ==========================================
-- PASO 3: Verificar la configuración
-- ==========================================

SELECT 
    cc.id,
    c.nombre_cliente,
    cc.facebook_login_config_id,
    cc.facebook_enabled,
    cc.facebook_app_id,
    CASE 
        WHEN cc.facebook_app_id IS NULL THEN 'Usa SystemConfig (compartido)'
        ELSE 'Usa App propia'
    END as configuracion_app,
    cc.updated_at,
    cc.last_updated_by
FROM customer_config cc
INNER JOIN clientes c ON cc.customer_id = c.id
WHERE cc.customer_id = 1;  -- ⬅️ REEMPLAZA con tu customer_id


-- ==========================================
-- PASO 4: (OPCIONAL) Configurar App propia
-- ==========================================
-- Si este tenant quiere usar su propia Facebook App
-- en lugar de la global (SystemConfig)

UPDATE customer_config
SET 
    facebook_app_id = 'TU_APP_ID_PROPIO',  -- ⬅️ App ID específico del tenant
    facebook_app_secret = 'TU_APP_SECRET_PROPIO',  -- ⬅️ App Secret específico
    updated_at = NOW(),
    last_updated_by = 'admin@tuempresa.com'
WHERE customer_id = 1;


-- ==========================================
-- PASO 5: Habilitar Instagram (OPCIONAL)
-- ==========================================
-- Si también quieres configurar Instagram

UPDATE customer_config
SET 
    instagram_login_config_id = '987654321098765',  -- ⬅️ Config ID de Instagram
    instagram_enabled = TRUE,
    updated_at = NOW(),
    last_updated_by = 'admin@tuempresa.com'
WHERE customer_id = 1;


-- ==========================================
-- CONSULTAS ÚTILES
-- ==========================================

-- Ver todos los tenants con Facebook habilitado
SELECT 
    c.id,
    c.nombre_cliente,
    cc.facebook_login_config_id,
    cc.facebook_enabled,
    cc.instagram_enabled,
    cc.whatsapp_enabled
FROM customer_config cc
INNER JOIN clientes c ON cc.customer_id = c.id
WHERE cc.facebook_enabled = TRUE;


-- Ver configuración completa de un tenant
SELECT * FROM customer_config WHERE customer_id = 1;


-- Deshabilitar Facebook para un tenant
UPDATE customer_config
SET 
    facebook_enabled = FALSE,
    updated_at = NOW(),
    last_updated_by = 'admin@tuempresa.com'
WHERE customer_id = 1;


-- Eliminar configuración completa de un tenant
DELETE FROM customer_config WHERE customer_id = 1;
-- NOTA: Esto también eliminará los canales asociados por CASCADE
