-- Actualizar el módulo ADMINISTRACION para agregar "Configuración DIAN"
-- Se busca por el código 'ADMINISTRACION'

UPDATE modules
SET menu_items = JSON_ARRAY_APPEND(
    menu_items,
    '$',
    CAST('{"label": "Configuración DIAN", "href": "/settings/system/dian"}' AS JSON)
)
WHERE code = 'ADMINISTRACION'
  AND JSON_CONTAINS(menu_items, '{"label": "Configuración DIAN"}', '$') = 0;

-- Si por alguna razón JSON_CONTAINS da problemas en versiones viejas de MySQL,
-- se puede usar una lógica más simple o asumir que si se corre una vez está bien.
