# Menú Dinámico con Validación de Permisos por Item

## ✅ Implementación Completada

### Cambios Realizados

#### 1. **Menú Dinámico desde Base de Datos**
- El menú ahora se genera completamente desde los `menu_items` del campo JSON en la tabla `modules`
- NO más menús hard-coded en Java
- Fácil de personalizar por cliente sin recompilar

#### 2. **Filtrado por Permisos a Nivel de Item**
- **Antes:** Se mostraba TODO el módulo si el usuario tenía ALGÚN permiso
- **Ahora:** Cada `menu_item` puede especificar qué acción requiere y se valida individualmente

#### 3. **Estructura del JSON menu_items**

**Formato completo con validación de permisos:**
```json
[
  {
    "label": "Ver Cotizaciones",
    "href": "/ventas/cotizaciones",
    "icon": "tabler-file-invoice",
    "action": "VIEW"
  },
  {
    "label": "Crear Cotización",
    "href": "/ventas/cotizaciones/new",  
    "icon": "tabler-plus",
    "action": "CREATE"
  },
  {
    "label": "Dashboard",
    "href": "/ventas/dashboard",
    "icon": "tabler-chart-bar"
  }
]
```

**Campos:**
- `label`: Texto a mostrar en el menú (requerido)
- `href`: Ruta del enlace (requerido)
- `icon`: Icono Tabler (opcional)
- `action`: Código de la acción requerida (opcional)
  - Si NO se especifica, el item se muestra siempre (útil para dashboards)
  - Si se especifica, solo se muestra si el usuario tiene ese permiso en el módulo

### Cómo Funciona

1. **Backend obtiene módulos accesibles:**
   - Para SUPERADMIN: Todos los módulos activos
   - Para otros roles: Solo módulos donde tienen AL MENOS un permiso

2. **Para cada módulo:**
   - Obtiene los permisos específicos del usuario en ese módulo
   - Parsea el JSON de `menu_items`
   - **Filtra** cada item verificando si:
     - No tiene `action` especificada → ✅ Se muestra
     - Usuario es SUPERADMIN → ✅ Se muestra
     - Usuario tiene el permiso requerido → ✅ Se muestra
     - De lo contrario → ❌ Se oculta

3. **Solo se incluyen módulos con items visibles:**
   - Si después del filtrado un módulo queda sin items, no se muestra

### Métodos Clave

```java
// Obtiene permisos del usuario para un módulo específico
private Set<String> getUserPermissionsForModule(List<String> roleCodes, String moduleCode)

// Parsea y filtra menu_items por permisos
private List<MenuItemDTO> parseMenuItems(
    String menuItemsJson, 
    Set<String> userPermissions, 
    boolean isSuperAdmin
)
```

### Flujo de Validación

```
Usuario hace login
    ↓
Frontend llama /api/rbac/menu?tenantId=X
    ↓
Backend verifica:
    1. Rol del usuario
    2. Módulos de la suscripción activa
    3. Permisos del rol en cada módulo
    ↓
Para cada módulo accesible:
    - Obtener menu_items (JSON)
    - Filtrar por action requerida
    - Solo mostrar items permitidos
    ↓
Retornar menú filtrado
    ↓
Frontend renderiza menú dinámico
```

### Ventajas

✅ **100% Dinámico:** Menú se configura en BD, no en código  
✅ **Seguridad a nivel de item:** Validación granular por acción  
✅ **Multi-tenant:** Respeta módulos de suscripción  
✅ **Flexible:** Mismo módulo puede mostrar diferentes items por rol  
✅ **Mantenible:** No requiere recompilar para cambiar menús  

### Ejemplos de Uso

**Caso 1: Usuario con permiso VIEW pero no CREATE**
```json
// En BD módulo VENTAS tiene:
[
  {"label":"Ver Cotizaciones", "href":"/ventas/cotizaciones", "action":"VIEW"},
  {"label":"Crear Cotización", "href":"/ventas/cotizaciones/new", "action":"CREATE"}
]

// Usuario solo ve:
- "Ver Cotizaciones" ✅
// No ve:
- "Crear Cotización" ❌
```

**Caso 2: Items sin action (siempre visibles)**
```json
[
  {"label":"Dashboard", "href":"/ventas/dashboard"}  // Sin "action"
]

// Todos los usuarios con acceso al módulo ven el dashboard
```

### Testing

Para probar:
1. Crear rol con permisos específicos
2. Asignar ese rol a un usuario
3. Login con ese usuario
4. Verificar que el menú solo muestra items para los que tiene permiso

### Base de Datos

**Tabla afectada:** `modules`  
**Campo usado:** `menu_items` (TEXT/JSON)

Para actualizar un menú:
```sql
UPDATE modules 
SET menu_items = '[
  {"label":"Cotizaciones","href":"/ventas/cotizaciones","icon":"tabler-file","action":"VIEW"},
  {"label":"Pedidos","href":"/ventas/pedidos","icon":"tabler-cart","action":"VIEW"}
]'
WHERE code = 'SALES';
```
