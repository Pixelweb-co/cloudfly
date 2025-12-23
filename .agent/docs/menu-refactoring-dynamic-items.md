# Refactorización del Menú Dinámico - Menu Items desde BD

## Objetivo
Modificar el sistema de menús para que se genere dinámicamente desde los `menu_items` almacenados en la tabla `modules` de la base de datos, filtrando por:
1. **Permisos del rol** del usuario
2. **Módulos de la suscripción** activa del tenant

## Estado Actual
- El método `RbacService.generateMenu()` tiene el menú **hard-coded** en Java
- La tabla `modules` tiene un campo `menu_items` (TEXT/JSON) que NO se está usando
- No hay consistencia entre lo que está en BD y lo que muestra el sistema

## Estructura de menu_items en BD
```json
[
  {"label":"Cotizaciones","href":"/ventas/cotizaciones","icon":"tabler-file-invoice"},
  {"label":"Pedidos","href":"/ventas/pedidos","icon":"tabler-shopping-cart"}
]
```

## Cambios a Realizar

### 1. Crear DTO para MenuItem
```java
@Data
@Builder
public class SubMenuItemDTO {
    private String label;
    private String href;
    private String icon;
}
```

### 2. Refactorizar generateMenu()
- Obtener módulos desde BD ordenados por `display_order`
- Para cada módulo:
  - Verificar si el rol tiene al menos un permiso en ese módulo
  - Si tiene permisos, parsear `menu_items` (JSON) y agregarlo al menú
  - Incluir el icono y path del módulo como parent

### 3. Filtrado por Suscripción
- Mantener el método `generateMenu(roleCodes, tenantId)`  
- Aplicar filtro adicional por módulos de la suscripción activa

## Ventajas
✅ Menú 100% dinámico desde BD  
✅ Fácil de mantener y personalizar por cliente  
✅ No requiere recompilar para cambiar el menú  
✅ Consistente con la arquitectura RBAC

## Próximos Pasos
1. Modificar `RbacService.generateMenu()`
2. Parsear el campo `menu_items` (JSON → List<SubMenuItemDTO>)
3. Actualizar tests
4. Verificar con usuario de prueba
