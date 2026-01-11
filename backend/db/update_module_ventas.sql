-- Actualizar el módulo VENTAS con el menú completo incluyendo Notas
-- Se busca por el código 'VENTAS'

UPDATE modules
SET menu_items = CAST('[{"label":"Categorías","href":"/ventas/categorias/list"},{"label":"Productos","href":"/ventas/productos/list"},{"label":"Cotizaciones","href":"/ventas/cotizaciones/list"},{"label":"Pedidos","href":"/ventas/pedidos"},{"label":"Facturas","href":"/ventas/facturas/list"},{"label":"Notas de Crédito","href":"/ventas/notas-credito/list"},{"label":"Notas de Débito","href":"/ventas/notas-debito/list"}]' AS JSON)
WHERE code = 'VENTAS';
