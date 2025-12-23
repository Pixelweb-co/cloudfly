-- =====================================================
-- CloudFly RBAC System Migration
-- Version: 3.0.0
-- Date: 2025-12-20
-- Description: Complete Role-Based Access Control System
-- =====================================================

-- =====================================================
-- STEP 1: Create new RBAC tables
-- =====================================================

-- Modules table: Represents system modules
CREATE TABLE IF NOT EXISTS modules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique code: pos, accounting, hr',
    name VARCHAR(100) NOT NULL COMMENT 'Display name',
    description VARCHAR(255),
    icon VARCHAR(50) COMMENT 'Icon name for menu',
    menu_path VARCHAR(255) COMMENT 'Base route path',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Module Actions: Actions available per module
CREATE TABLE IF NOT EXISTS module_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL COMMENT 'Action code: read, create, update, delete',
    name VARCHAR(100) NOT NULL COMMENT 'Display name',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE KEY uk_module_action (module_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New Roles table (replaces old roles table)
-- First, backup and rename old table
RENAME TABLE roles TO roles_old;

CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Role code: SUPERADMIN, ADMIN, etc.',
    name VARCHAR(100) NOT NULL COMMENT 'Display name',
    description VARCHAR(255),
    is_system BOOLEAN DEFAULT FALSE COMMENT 'System roles cannot be deleted',
    tenant_id INT NULL COMMENT 'NULL for global roles, tenant_id for tenant-specific',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions: Links roles to module actions
CREATE TABLE IF NOT EXISTS role_module_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    module_action_id BIGINT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (module_action_id) REFERENCES module_actions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_module_permission (role_id, module_action_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Access Logs for auditing
CREATE TABLE IF NOT EXISTS access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tenant_id INT,
    module_code VARCHAR(50),
    action_code VARCHAR(50),
    resource_type VARCHAR(100) COMMENT 'Entity type: Order, Invoice, etc.',
    resource_id BIGINT,
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    success BOOLEAN DEFAULT TRUE,
    error_message VARCHAR(500),
    request_data JSON,
    response_status INT,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_access (user_id, created_at),
    INDEX idx_tenant_access (tenant_id, created_at),
    INDEX idx_module_action (module_code, action_code),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STEP 2: Insert Modules
-- =====================================================

INSERT INTO modules (code, name, description, icon, menu_path, display_order) VALUES
('dashboard', 'Dashboard', 'Panel de control y estadísticas', 'tabler-dashboard', '/dashboards', 1),
('pos', 'Punto de Venta', 'Ventas y órdenes', 'tabler-shopping-cart', '/apps/pos', 2),
('products', 'Productos', 'Catálogo de productos', 'tabler-box', '/apps/product', 3),
('customers', 'Clientes', 'Gestión de clientes', 'tabler-users', '/apps/customer', 4),
('contacts', 'Contactos', 'Gestión de contactos', 'tabler-address-book', '/marketing/contacts', 5),
('quotes', 'Cotizaciones', 'Cotizaciones y propuestas', 'tabler-file-text', '/apps/quotes', 6),
('invoices', 'Facturación', 'Facturas electrónicas', 'tabler-file-invoice', '/apps/invoice', 7),
('accounting', 'Contabilidad', 'Plan de cuentas y comprobantes', 'tabler-calculator', '/apps/contabilidad', 8),
('hr', 'Recursos Humanos', 'Gestión de empleados', 'tabler-users-group', '/hr', 9),
('payroll', 'Nómina', 'Períodos y liquidación', 'tabler-currency-dollar', '/hr/periods', 10),
('marketing', 'Marketing', 'Campañas y comunicación', 'tabler-speakerphone', '/marketing', 11),
('chatbot', 'Chatbot', 'Configuración de bots', 'tabler-robot', '/settings/chatbot', 12),
('settings', 'Configuración', 'Ajustes del sistema', 'tabler-settings', '/settings', 13),
('users', 'Usuarios', 'Gestión de usuarios', 'tabler-user-cog', '/apps/user', 14),
('roles', 'Roles y Permisos', 'Gestión de roles', 'tabler-shield-lock', '/settings/roles', 15),
('reports', 'Reportes', 'Reportes del sistema', 'tabler-chart-bar', '/apps/reportes', 16);

-- =====================================================
-- STEP 3: Insert Module Actions
-- =====================================================

-- Insert standard CRUD actions for each module
INSERT INTO module_actions (module_id, code, name, description)
SELECT m.id, a.code, a.name, CONCAT(a.name, ' en ', m.name)
FROM modules m
CROSS JOIN (
    SELECT 'read' as code, 'Ver' as name UNION ALL
    SELECT 'create', 'Crear' UNION ALL
    SELECT 'update', 'Editar' UNION ALL
    SELECT 'delete', 'Eliminar'
) a;

-- Add special actions for specific modules
-- Accounting: approve, void
INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'approve', 'Aprobar', 'Aprobar comprobantes contables'
FROM modules WHERE code = 'accounting';

INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'void', 'Anular', 'Anular comprobantes contables'
FROM modules WHERE code = 'accounting';

-- Payroll: liquidate, pay
INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'liquidate', 'Liquidar', 'Liquidar nómina'
FROM modules WHERE code = 'payroll';

INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'pay', 'Pagar', 'Registrar pago de nómina'
FROM modules WHERE code = 'payroll';

-- Invoices: send, cancel
INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'send', 'Enviar', 'Enviar factura'
FROM modules WHERE code = 'invoices';

INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'cancel', 'Anular', 'Anular factura'
FROM modules WHERE code = 'invoices';

-- Reports: export
INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'export', 'Exportar', 'Exportar reportes'
FROM modules WHERE code = 'reports';

-- POS: process sale
INSERT INTO module_actions (module_id, code, name, description)
SELECT id, 'process', 'Procesar', 'Procesar venta'
FROM modules WHERE code = 'pos';

-- =====================================================
-- STEP 4: Insert System Roles
-- =====================================================

INSERT INTO roles (code, name, description, is_system, tenant_id) VALUES
('SUPERADMIN', 'Super Administrador', 'Dueño de CloudFly - Acceso total a todos los tenants', TRUE, NULL),
('ADMIN', 'Administrador', 'Usuario principal del tenant - Gestiona usuarios y configuración', TRUE, NULL),
('VENDEDOR', 'Vendedor', 'Acceso a POS, cotizaciones, facturas, clientes', TRUE, NULL),
('CONTABILIDAD', 'Contabilidad', 'Acceso al módulo contable completo', TRUE, NULL),
('NOMINA', 'Nómina', 'Acceso a recursos humanos y nómina', TRUE, NULL),
('MARKETING', 'Marketing', 'Acceso a chatbot, contactos, campañas', TRUE, NULL);

-- =====================================================
-- STEP 5: Assign Default Permissions
-- =====================================================

-- SUPERADMIN: All permissions on all modules
INSERT INTO role_module_permissions (role_id, module_action_id, granted)
SELECT r.id, ma.id, TRUE
FROM roles r
CROSS JOIN module_actions ma
WHERE r.code = 'SUPERADMIN';

-- ADMIN: All permissions on all modules
INSERT INTO role_module_permissions (role_id, module_action_id, granted)
SELECT r.id, ma.id, TRUE
FROM roles r
CROSS JOIN module_actions ma
WHERE r.code = 'ADMIN';

-- VENDEDOR: Access to dashboard, pos, products, customers, contacts, quotes, invoices
INSERT INTO role_module_permissions (role_id, module_action_id, granted)
SELECT r.id, ma.id, TRUE
FROM roles r
JOIN module_actions ma ON TRUE
JOIN modules m ON ma.module_id = m.id
WHERE r.code = 'VENDEDOR'
AND m.code IN ('dashboard', 'pos', 'products', 'customers', 'contacts', 'quotes', 'invoices')
AND (
    (m.code = 'dashboard' AND ma.code = 'read')
    OR (m.code = 'products' AND ma.code = 'read')
    OR (m.code IN ('pos', 'customers', 'contacts', 'quotes'))
    OR (m.code = 'invoices' AND ma.code IN ('read', 'create', 'send'))
);

-- CONTABILIDAD: Access to dashboard, accounting, invoices, quotes (read), reports
INSERT INTO role_module_permissions (role_id, module_action_id, granted)
SELECT r.id, ma.id, TRUE
FROM roles r
JOIN module_actions ma ON TRUE
JOIN modules m ON ma.module_id = m.id
WHERE r.code = 'CONTABILIDAD'
AND (
    (m.code = 'dashboard' AND ma.code = 'read')
    OR (m.code IN ('accounting', 'reports'))
    OR (m.code IN ('invoices', 'quotes', 'customers') AND ma.code = 'read')
);

-- NOMINA: Access to dashboard, hr, payroll
INSERT INTO role_module_permissions (role_id, module_action_id, granted)
SELECT r.id, ma.id, TRUE
FROM roles r
JOIN module_actions ma ON TRUE
JOIN modules m ON ma.module_id = m.id
WHERE r.code = 'NOMINA'
AND (
    (m.code = 'dashboard' AND ma.code = 'read')
    OR m.code IN ('hr', 'payroll')
);

-- MARKETING: Access to dashboard, marketing, chatbot, contacts
INSERT INTO role_module_permissions (role_id, module_action_id, granted)
SELECT r.id, ma.id, TRUE
FROM roles r
JOIN module_actions ma ON TRUE
JOIN modules m ON ma.module_id = m.id
WHERE r.code = 'MARKETING'
AND (
    (m.code = 'dashboard' AND ma.code = 'read')
    OR m.code IN ('marketing', 'chatbot', 'contacts')
);

-- =====================================================
-- STEP 6: Update user_roles table to use new roles table
-- =====================================================

-- Create new user_roles relationship table if needed
CREATE TABLE IF NOT EXISTS user_roles_new (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing user-role assignments
-- Map old role names to new roles
INSERT INTO user_roles_new (user_id, role_id)
SELECT DISTINCT ur.user_id, r_new.id
FROM user_roles ur
JOIN roles_old r_old ON ur.role_id = r_old.id
JOIN roles r_new ON (
    CASE 
        WHEN r_old.role_name = 'SUPERADMIN' THEN 'SUPERADMIN'
        WHEN r_old.role_name = 'ADMIN' THEN 'ADMIN'
        WHEN r_old.role_name = 'BIOMEDICAL' THEN 'ADMIN'  -- Migrate BIOMEDICAL to ADMIN
        WHEN r_old.role_name = 'USER' THEN 'VENDEDOR'     -- Migrate USER to VENDEDOR
        ELSE 'VENDEDOR'
    END = r_new.code
)
ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;

-- Drop old user_roles and rename new one
DROP TABLE IF EXISTS user_roles;
RENAME TABLE user_roles_new TO user_roles;

-- =====================================================
-- STEP 7: Cleanup
-- =====================================================

-- Keep old tables for reference, can be dropped later
-- DROP TABLE IF EXISTS role_permissions;  -- old permission junction
-- DROP TABLE IF EXISTS permissions;       -- old permissions table
-- DROP TABLE IF EXISTS roles_old;         -- old roles table

-- =====================================================
-- STEP 8: Create indexes for performance
-- =====================================================

CREATE INDEX idx_module_actions_module ON module_actions(module_id);
CREATE INDEX idx_role_permissions_role ON role_module_permissions(role_id);
CREATE INDEX idx_role_permissions_action ON role_module_permissions(module_action_id);

-- =====================================================
-- Verification queries (for testing)
-- =====================================================

-- View all modules with action count
-- SELECT m.code, m.name, COUNT(ma.id) as action_count 
-- FROM modules m 
-- LEFT JOIN module_actions ma ON m.id = ma.module_id 
-- GROUP BY m.id;

-- View all roles with permission count
-- SELECT r.code, r.name, COUNT(rp.id) as permission_count 
-- FROM roles r 
-- LEFT JOIN role_module_permissions rp ON r.id = rp.role_id 
-- GROUP BY r.id;

-- View user permissions
-- SELECT u.username, r.code as role, m.code as module, ma.code as action
-- FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- JOIN roles r ON ur.role_id = r.id
-- JOIN role_module_permissions rp ON r.id = rp.role_id
-- JOIN module_actions ma ON rp.module_action_id = ma.id
-- JOIN modules m ON ma.module_id = m.id
-- WHERE rp.granted = TRUE;
