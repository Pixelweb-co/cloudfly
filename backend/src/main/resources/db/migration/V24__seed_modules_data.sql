-- Asegurar que la tabla está limpia antes de insertar
DELETE FROM modules;

-- Reiniciar el autoincrement (opcional, depende del motor, útil para IDs consistentes)
ALTER TABLE modules AUTO_INCREMENT = 1;

-- 1. Módulo Comunicaciones (con submenús)
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('COMUNICACIONES', 'Comunicaciones', 'Gestión de WhatsApp y chats', 'tabler-message-circle', NULL, 1, TRUE, 
'[
  {"label":"Chatbot IA WhatsApp","href":"/settings/chatbot"},
  {"label":"Tipos de Chatbot","href":"/settings/chatbot-types/list","excludedRoles":["VENDEDOR","CONTABILIDAD","MARKETING"]},
  {"label":"Conversaciones","href":"/comunicaciones/conversaciones"}
]',
NOW(), NOW());

-- 2. Módulo Marketing
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('MARKETING', 'Marketing', 'Campañas y Contactos', 'tabler-speakerphone', NULL, 2, TRUE,
'[
  {"label":"Campañas","href":"/marketing/campanas"},
  {"label":"Terceros","href":"/marketing/contacts/list"}
]',
NOW(), NOW());

-- 3. Módulo Calendario (Sin submenús, enlace directo)
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('CALENDARIO', 'Calendario', 'Gestión de agenda', 'tabler-calendar', '/calendar', 3, TRUE, NULL, NOW(), NOW());

-- 4. Módulo Usuarios y Roles
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('USUARIOS_ROLES', 'Usuarios y Roles', 'Administración de accesos', 'tabler-users', NULL, 4, TRUE,
'[
  {"label":"Gestión de Usuarios","href":"/accounts/user/list"}
]',
NOW(), NOW());

-- 5. Módulo Ventas
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('VENTAS', 'Ventas', 'Ciclo completo de ventas', 'tabler-shopping-cart', NULL, 5, TRUE,
'[
  {"label":"Categorías","href":"/ventas/categorias/list"},
  {"label":"Productos","href":"/ventas/productos/list"},
  {"label":"Cotizaciones","href":"/ventas/cotizaciones/list"},
  {"label":"Pedidos","href":"/ventas/pedidos"},
  {"label":"Facturas","href":"/ventas/facturas/list"}
]',
NOW(), NOW());

-- 6. Módulo Recursos Humanos
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('RECURSOS_HUMANOS', 'Recursos Humanos', 'Nómina y Empleados', 'tabler-users', NULL, 6, TRUE,
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

-- 7. Módulo Contabilidad
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('CONTABILIDAD', 'Contabilidad', 'Libros y Balances', 'tabler-calculator', NULL, 7, TRUE,
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

-- 8. Módulo Administración
INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('ADMINISTRACION', 'Administración', 'Configuraciones generales', 'tabler-settings', NULL, 8, TRUE,
'[
  {"label":"Clientes","href":"/administracion/clientes/list"},
  {"label":"Tipos de Chatbot","href":"/settings/chatbot-types/list"}
]',
NOW(), NOW());
