-- Script para migrar el menú de verticalMenuData.ts a la tabla modules
-- Base de datos: MySQL (cloud_master)

DELETE FROM subscription_modules WHERE module_id IN (SELECT id FROM modules);
DELETE FROM modules WHERE code IN ('COMMUNICATIONS', 'MARKETING', 'CALENDAR', 'RBAC', 'SALES', 'ADMINISTRATION', 'ACCOUNTING', 'HR', 'REPORTS');

-- Comunicaciones
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('COMMUNICATIONS', 'Comunicaciones', 'Módulo de comunicaciones y WhatsApp', 'tabler-messages', '#', 1, 1, 
'[{"label": "Chatbot IA WhatsApp", "href": "/settings/chatbot", "icon": "tabler-robot"}, {"label": "Tipos de Chatbot", "href": "/settings/chatbot-types/list", "icon": "tabler-list-details"}, {"label": "Conversaciones", "href": "/comunicaciones/conversaciones", "icon": "tabler-message"}]', 
NOW(), NOW());

-- Marketing
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('MARKETING', 'Marketing', 'Módulo de campañas y contactos', 'tabler-megaphone', '#', 2, 1, 
'[{"label": "Campañas", "href": "/marketing/campanas", "icon": "tabler-speakerphone"}, {"label": "Contactos", "href": "/marketing/contacts/list", "icon": "tabler-users"}]', 
NOW(), NOW());

-- Calendario
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('CALENDAR', 'Calendario', 'Gestión de citas y calendario', 'tabler-calendar', '/calendar', 3, 1, NULL, NOW(), NOW());

-- Usuarios y Roles (RBAC)
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('RBAC', 'Usuarios y Roles', 'Gestión de accesos y seguridad', 'tabler-shield-lock', '#', 4, 1, 
'[{"label": "Gestión de Usuarios", "href": "/accounts/user/list", "icon": "tabler-user"}, {"label": "Roles y Permisos", "href": "/settings/roles/list", "icon": "tabler-lock"}]', 
NOW(), NOW());

-- Ventas
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('SALES', 'Ventas', 'Módulo comercial y facturación', 'tabler-shopping-cart', '#', 5, 1, 
'[{"label": "Categorías", "href": "/ventas/categorias/list", "icon": "tabler-category"}, {"label": "Productos", "href": "/ventas/productos/list", "icon": "tabler-box"}, {"label": "Cotizaciones", "href": "/ventas/cotizaciones/list", "icon": "tabler-file-text"}, {"label": "Pedidos", "href": "/ventas/pedidos", "icon": "tabler-truck-delivery"}, {"label": "Facturas", "href": "/ventas/facturas/list", "icon": "tabler-receipt"}]', 
NOW(), NOW());

-- Contabilidad
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('ACCOUNTING', 'Contabilidad', 'Gestión financiera y contable', 'tabler-calculator', '#', 6, 1, 
'[{"label": "Plan de Cuentas", "href": "/contabilidad/plan-cuentas", "icon": "tabler-list"}, {"label": "Libro Diario", "href": "/contabilidad/libro-diario", "icon": "tabler-book"}, {"label": "Estado Resultados", "href": "/contabilidad/estado-resultados", "icon": "tabler-report-money"}, {"label": "Balance General", "href": "/contabilidad/balance-general", "icon": "tabler-scale-outline"}]', 
NOW(), NOW());

-- Recursos Humanos
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('HR', 'Recursos Humanos', 'Gestión de empleados y nómina', 'tabler-users', '#', 7, 1, 
'[{"label": "Dashboard", "href": "/hr/dashboard", "icon": "tabler-chart-pie"}, {"label": "Empleados", "href": "/hr/employees", "icon": "tabler-user-circle"}, {"label": "Conceptos de Nómina", "href": "/hr/concepts", "icon": "tabler-list-details"}, {"label": "Periodos de Nómina", "href": "/hr/periods", "icon": "tabler-calendar-stats"}]', 
NOW(), NOW());

-- Reportes
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at)
VALUES ('REPORTS', 'Reportes', 'Información estratégica', 'tabler-info-circle', '/reportes', 8, 1, NULL, NOW(), NOW());

-- Asociar todos los módulos al Plan Gratis (ID 1 asumiendo que es el primero) para pruebas
INSERT INTO plan_modules (plan_id, module_id)
SELECT 1, id FROM modules;
