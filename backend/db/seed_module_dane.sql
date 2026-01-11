-- ============================================================================
-- SEED: Register DANE module in modules table
-- Description: Registers the DANE configuration module for Colombian geographic codes
-- Date: 2025-12-29
-- ============================================================================

USE cloudfly_erp;

-- Insert DANE module (if not exists)
INSERT INTO modules (name, description, icon, path, is_core, is_active, category, display_order, created_at, updated_at)
VALUES (
    'DANE',
    'Gestión de Códigos DANE - Departamentos y Ciudades de Colombia para Facturación Electrónica',
    'tabler-map-pin',
    '/settings/dane',
    FALSE,
    TRUE,
    'ADMINISTRACION',
    999,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    icon = VALUES(icon),
    path = VALUES(path),
    updated_at = NOW();

-- Get the module ID for DANE
SET @dane_module_id = (SELECT id FROM modules WHERE name = 'DANE' LIMIT 1);

-- Insert module actions for DANE (if not exists)
INSERT INTO module_actions (module_id, action_code, action_name, description, created_at)
SELECT @dane_module_id, 'READ', 'Ver Códigos DANE', 'Permite ver la lista de códigos DANE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM module_actions WHERE module_id = @dane_module_id AND action_code = 'READ');

INSERT INTO module_actions (module_id, action_code, action_name, description, created_at)
SELECT @dane_module_id, 'CREATE', 'Crear Códigos DANE', 'Permite crear nuevos códigos DANE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM module_actions WHERE module_id = @dane_module_id AND action_code = 'CREATE');

INSERT INTO module_actions (module_id, action_code, action_name, description, created_at)
SELECT @dane_module_id, 'UPDATE', 'Actualizar Códigos DANE', 'Permite modificar códigos DANE existentes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM module_actions WHERE module_id = @dane_module_id AND action_code = 'UPDATE');

INSERT INTO module_actions (module_id, action_code, action_name, description, created_at)
SELECT @dane_module_id, 'DELETE', 'Eliminar Códigos DANE', 'Permite desactivar códigos DANE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM module_actions WHERE module_id = @dane_module_id AND action_code = 'DELETE');

-- Grant permissions to SUPERADMIN role
SET @superadmin_role_id = (SELECT id FROM roles WHERE role = 'ROLE_SUPERADMIN' LIMIT 1);

INSERT INTO role_permissions (role_id, module_id, action_code)
SELECT @superadmin_role_id, @dane_module_id, 'READ'
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = @superadmin_role_id AND module_id = @dane_module_id AND action_code = 'READ'
);

INSERT INTO role_permissions (role_id, module_id, action_code)
SELECT @superadmin_role_id, @dane_module_id, 'CREATE'
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = @superadmin_role_id AND module_id = @dane_module_id AND action_code = 'CREATE'
);

INSERT INTO role_permissions (role_id, module_id, action_code)
SELECT @superadmin_role_id, @dane_module_id, 'UPDATE'
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = @superadmin_role_id AND module_id = @dane_module_id AND action_code = 'UPDATE'
);

INSERT INTO role_permissions (role_id, module_id, action_code)
SELECT @superadmin_role_id, @dane_module_id, 'DELETE'
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_id = @superadmin_role_id AND module_id = @dane_module_id AND action_code = 'DELETE'
);

-- Verification
SELECT 
    m.id,
    m.name,
    m.description,
    m.path,
    m.category,
    m.is_active
FROM modules m
WHERE m.name = 'DANE';

SELECT 
    ma.action_code,
    ma.action_name,
    ma.description
FROM module_actions ma
WHERE ma.module_id = @dane_module_id;

-- ============================================================================
-- END OF SEED
-- ============================================================================
