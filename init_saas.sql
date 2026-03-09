-- Crear Roles y Permisos
INSERT INTO roles (code, name, description) 
VALUES ('SUPERADMIN', 'Super Administrador', 'Acceso total al sistema SaaS') 
ON DUPLICATE KEY UPDATE name='Super Administrador';

INSERT INTO permissions (name) 
VALUES ('ALL_ACCESS') 
ON DUPLICATE KEY UPDATE name='ALL_ACCESS';

-- Asociar Permiso a Rol
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'SUPERADMIN' AND p.name = 'ALL_ACCESS'
ON DUPLICATE KEY UPDATE role_id=r.id;

-- Crear el Tenant Maestro (clientes) con campos obligatorios detectados
INSERT INTO clientes (nombre_cliente, status_cliente, business_type, es_emisor_fe, es_emisor_principal, is_master_tenant, created_at) 
VALUES ('Cloudfly', 1, 'MIXTO', 0, 0, 1, NOW()) 
ON DUPLICATE KEY UPDATE nombre_cliente='Cloudfly';

-- Crear Usuario Manager vinculado al Tenant
INSERT INTO users (username, password, email, nombres, apellidos, is_enabled, account_no_expired, account_no_locked, credential_no_expired, customer_id) 
SELECT 'manager', '$2a$10$Y5baV.Z.R4J5V5B5V5B5V5B5V5B5V5B5V5B5V5B5V5B5V5B5V5B', 'admin@cloudfly.com.co', 'Manager', 'SaaS', 1, 1, 1, 1, c.id
FROM clientes c WHERE c.nombre_cliente = 'Cloudfly'
ON DUPLICATE KEY UPDATE username='manager';

-- Asignar Rol SUPERADMIN al Manager
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'manager' AND r.code = 'SUPERADMIN'
ON DUPLICATE KEY UPDATE user_id=u.id;
