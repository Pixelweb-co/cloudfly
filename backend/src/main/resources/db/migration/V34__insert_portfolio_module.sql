-- V34: Insert Portfolio module into the menu.

INSERT INTO modules (code, name, description, icon, menu_path, display_order, is_active, menu_items, created_at, updated_at) VALUES
('CARTERA', 'Cartera', 'Gestión de cobros y pagos', 'tabler-wallet', NULL, 6, TRUE,
'[
  {"label":"Dashboard","href":"/cartera/dashboard","icon":"tabler-chart-pie"},
  {"label":"Cuentas por Cobrar","href":"/cartera/cuentas-cobrar"},
  {"label":"Cuentas por Pagar","href":"/cartera/cuentas-pagar"},
  {"label":"Recaudos","href":"/cartera/recaudos"},
  {"label":"Pagos","href":"/cartera/pagos"},
  {"label":"Informes","href":"/cartera/informes"}
]',
NOW(), NOW());
