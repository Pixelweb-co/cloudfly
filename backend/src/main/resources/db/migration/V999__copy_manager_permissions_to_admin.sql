-- ================================================================
-- Script para dar al rol ADMIN los mismos permisos que MANAGER
-- ================================================================
-- Este script copia todos los permisos del rol MANAGER al rol ADMIN
-- de manera que ADMIN tenga acceso completo a todos los módulos
-- ================================================================

-- Primero, eliminar permisos existentes de ADMIN para evitar duplicados
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE code = 'ADMIN');

-- Copiar todos los permisos de MANAGER a ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'ADMIN') as role_id,
    permission_id
FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE code = 'MANAGER');

-- Verificar resultado
SELECT 
    r.code as rol,
    COUNT(rp.permission_id) as cantidad_permisos
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.code IN ('ADMIN', 'MANAGER')
GROUP BY r.code;
