-- =====================================================
-- CloudFly RBAC System Migration (Manual Execution)
-- Version: 3.0.0
-- Date: 2025-12-20
-- Description: Complete Role-Based Access Control System
-- 
-- INSTRUCTIONS: Execute this script manually in MySQL client
-- It handles the case when old tables may or may not exist
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

-- Role Permissions: Links roles to module actions
CREATE TABLE IF NOT EXISTS role_module_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    module_action_id BIGINT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
-- STEP 2: Backup existing roles table if needed
-- Run this only if you have existing data to preserve
-- =====================================================

-- Check if roles table exists and create backup
-- DROP TABLE IF EXISTS roles_backup;
-- CREATE TABLE roles_backup AS SELECT * FROM roles;

-- =====================================================
-- STEP 3: Add new columns to roles table (if exists)
-- Or create new roles table with required structure
-- =====================================================

-- Option A: If you want to modify existing roles table
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS code VARCHAR(50);
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id INT NULL;
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Option B: If you want to create a fresh roles table
-- First check if table has data you need to migrate
-- Then drop and recreate

-- Check current structure
-- DESCRIBE roles;

-- =====================================================
-- STEP 4: Insert Modules (if not exists)
-- =====================================================

INSERT IGNORE INTO modules (code, name, description, icon, menu_path, display_order) VALUES
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
-- STEP 5: Insert Module Actions
-- =====================================================

-- Insert standard CRUD actions for each module
INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT m.id, a.code, a.name, CONCAT(a.name, ' en ', m.name)
FROM modules m
CROSS JOIN (
    SELECT 'read' as code, 'Ver' as name UNION ALL
    SELECT 'create', 'Crear' UNION ALL
    SELECT 'update', 'Editar' UNION ALL
    SELECT 'delete', 'Eliminar'
) a;

-- Add special actions for specific modules
INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'approve', 'Aprobar', 'Aprobar comprobantes contables'
FROM modules WHERE code = 'accounting';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'void', 'Anular', 'Anular comprobantes contables'
FROM modules WHERE code = 'accounting';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'liquidate', 'Liquidar', 'Liquidar nómina'
FROM modules WHERE code = 'payroll';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'pay', 'Pagar', 'Registrar pago de nómina'
FROM modules WHERE code = 'payroll';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'send', 'Enviar', 'Enviar factura'
FROM modules WHERE code = 'invoices';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'cancel', 'Anular', 'Anular factura'
FROM modules WHERE code = 'invoices';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'export', 'Exportar', 'Exportar reportes'
FROM modules WHERE code = 'reports';

INSERT IGNORE INTO module_actions (module_id, code, name, description)
SELECT id, 'process', 'Procesar', 'Procesar venta'
FROM modules WHERE code = 'pos';

-- =====================================================
-- STEP 6: Verification Queries
-- Run these to verify the structure
-- =====================================================

-- View all modules with action count
SELECT m.code, m.name, COUNT(ma.id) as action_count 
FROM modules m 
LEFT JOIN module_actions ma ON m.id = ma.module_id 
GROUP BY m.id
ORDER BY m.display_order;

-- View all module actions
SELECT m.code as module, ma.code as action, ma.name 
FROM modules m 
JOIN module_actions ma ON m.id = ma.module_id 
ORDER BY m.display_order, ma.code;
