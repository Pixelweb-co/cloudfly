-- Insertar módulos del sistema en formato compatible con verticalMenuData
-- Estos módulos se renderizan dinámicamente en el frontend

-- Limpiar módulos existentes
DELETE FROM modules;

-- Módulo: Comunicaciones
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('COMUNICACIONES', 'Comunicaciones', 'Gestión de comunicaciones omnicanal', 'tabler-message-circle', NULL, 1, TRUE, 
'[
  {"label":"Chatbot IA WhatsApp","href":"/settings/chatbot"},
  {"label":"Tipos de Chatbot","href":"/settings/chatbot-types/list","excludedRoles":["VENDEDOR","CONTABILIDAD","MARKETING"]},
  {"label":"Conversaciones","href":"/comunicaciones/conversaciones"}
]',
NOW(), NOW());

-- Módulo: Marketing
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('MARKETING', 'Marketing', 'Gestión de campañas y contactos', 'tabler-speakerphone', NULL, 2, TRUE,
'[
  {"label":"Campañas","href":"/marketing/campanas"},
  {"label":"Terceros","href":"/marketing/contacts/list"}
]',
NOW(), NOW());

-- Módulo: Calendario
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('CALENDARIO', 'Calendario', 'Calendario de actividades y eventos', 'tabler-calendar', '/calendar', 3, TRUE, NULL, NOW(), NOW());

-- Módulo: Usuarios y Roles
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('USUARIOS_ROLES', 'Usuarios y Roles', 'Gestión de usuarios y roles del sistema', 'tabler-users', NULL, 4, TRUE,
'[
  {"label":"Gestión de Usuarios","href":"/accounts/user/list"}
]',
NOW(), NOW());

-- Módulo: Ventas
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('VENTAS', 'Ventas', 'Gestión de ventas y facturación', 'tabler-shopping-cart', NULL, 5, TRUE,
'[
  {"label":"Categorías","href":"/ventas/categorias/list"},
  {"label":"Productos","href":"/ventas/productos/list"},
  {"label":"Cotizaciones","href":"/ventas/cotizaciones/list"},
  {"label":"Pedidos","href":"/ventas/pedidos"},
  {"label":"Facturas","href":"/ventas/facturas/list"}
]',
NOW(), NOW());

-- Módulo: Recursos Humanos
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('RECURSOS_HUMANOS', 'Recursos Humanos', 'Gestión de nómina y empleados', 'tabler-users', NULL, 6, TRUE,
'[
  {"label":"Dashboard","href":"/hr/dashboard","icon":"tabler-chart-pie"},
  {"label":"Empleados","href":"/hr/employees"},
  {"label":"Conceptos de Nómina","href":"/hr/concepts"},
  {"label":"Novedades","href":"/hr/novelties"},
  {"label":"Periodos","href":"/hr/periods"},
  {"label":"Procesar Nómina","href":"/hr/process"},
  {"label":"Recibos","href":"/hr/receipts"},
  {"label":"Configuración","href":"/hr/config","excludedRoles":["HR"]}
]',
NOW(), NOW());

-- Módulo: Contabilidad
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('CONTABILIDAD', 'Contabilidad', 'Gestión contable y financiera', 'tabler-calculator', NULL, 7, TRUE,
'[
  {"label":"Plan de Cuentas","href":"/contabilidad/plan-cuentas"},
  {"label":"Comprobantes","href":"/contabilidad/comprobantes"},
  {"label":"Terceros","href":"/contabilidad/terceros"},
  {"label":"Centros de Costo","href":"/contabilidad/centros-costo"},
  {"label":"Balance de Prueba","href":"/contabilidad/balance-prueba"},
  {"label":"Libro Diario","href":"/contabilidad/libro-diario"},
  {"label":"Libro Mayor","href":"/contabilidad/libro-mayor"},
  {"label":"Estado de Resultados","href":"/contabilidad/estado-resultados"},
  {"label":"Balance General","href":"/contabilidad/balance-general"}
]',
NOW(), NOW());

-- Módulo: Administración
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('ADMINISTRACION', 'Administración', 'Administración del sistema', 'tabler-settings', NULL, 8, TRUE,
'[
  {"label":"Clientes","href":"/administracion/clientes/list"},
  {"label":"Tipos de Chatbot","href":"/settings/chatbot-types/list"}
]',
NOW(), NOW());
