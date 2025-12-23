# Refactorización del Flujo de Carga del Menú - MANAGER con Privilegios Especiales

## Fecha: 2025-12-22

## Objetivo Final
Implementar un flujo de carga del menú donde:
- **MANAGER**: Ve TODOS los módulos y sub-items sin restricciones (no requiere suscripción)
- **Otros roles** (SUPERADMIN, ADMIN, usuarios normales):
  1. Obtener la suscripción del customer al que pertenece el usuario
  2. Obtener los módulos asociados a la suscripción
  3. Filtrar los módulos por permisos del rol
  4. Devolver en formato MenuItemDTO para renderizar en frontend

## Cambios Realizados

### 1. `MenuService.java` - Método `getMenuData()`

#### Flujo MANAGER (Privilegios Especiales)
```java
// Identificar si es MANAGER
boolean isManager = userRoles.stream()
        .anyMatch(r -> "MANAGER".equals(r.getCode()));

if (isManager) {
    log.info("Usuario {} es MANAGER - Acceso total a todos los módulos activos", username);
    
    // Obtener TODOS los módulos activos sin filtrar
    List<RbacModule> allModules = moduleRepository.findAllByIsActiveTrueOrderByDisplayOrder();
    List<MenuItemDTO> menuItems = new ArrayList<>();

    for (RbacModule module : allModules) {
        // true = ver todos los sub-items sin filtrar
        MenuItemDTO menuItem = convertToMenuItemDTO(module, userRoles, true);
        if (menuItem != null) {
            menuItems.add(menuItem);
        }
    }

    log.info("MANAGER {} generó menú con {} items (todos los módulos activos)", 
            username, menuItems.size());
    return menuItems;
}
```

#### Flujo Otros Roles (Con Restricciones)
```java
// SUPERADMIN, ADMIN y usuarios normales DEBEN:
// 1. Tener customer asociado
if (user.getCustomer() == null) {
    return new ArrayList<>();
}

// 2. Tener suscripción activa
Optional<Subscription> subscriptionOpt = subscriptionRepository
        .findActiveTenantSubscriptionWithModules(user.getCustomer().getId());

if (!subscriptionOpt.isPresent()) {
    return new ArrayList<>();
}

// 3. Filtrar por módulos de la suscripción
for (RbacModule module : allModules) {
    if (!subscriptionModuleIds.contains(module.getId())) {
        continue; // No está en suscripción
    }
    
    // 4. Filtrar por permisos del rol
    boolean hasAccess = userRoles.stream()
            .anyMatch(role -> role.hasPermission(module.getCode(), "ACCESS"));
    
    if (!hasAccess) {
        continue; // No tiene permiso
    }
    
    // false = filtrar sub-items por permisos
    menuItems.add(convertToMenuItemDTO(module, userRoles, false));
}
```

### 2. `MenuService.java` - Método `convertToMenuItemDTO()`

#### Cambio de Firma
```java
// Antes:
private MenuItemDTO convertToMenuItemDTO(RbacModule module, List<Role> userRoles, boolean isSuperAdmin)

// Después (más claro):
private MenuItemDTO convertToMenuItemDTO(RbacModule module, List<Role> userRoles, boolean showAllSubItems)
```

#### Lógica de Sub-items
```java
for (Map<String, Object> childData : childrenData) {
    String label = (String) childData.get("label");
    
    // Si showAllSubItems es true (MANAGER), mostrar TODOS los sub-items
    boolean hasChildAccess = showAllSubItems;
    
    if (!hasChildAccess) {
        // Usuarios normales necesitan permiso explícito ACCESS_<SUBITEM>
        String actionCode = "ACCESS_" + normalizeLabel(label);
        hasChildAccess = userRoles.stream()
                .anyMatch(role -> role.hasPermission(module.getCode(), actionCode));
        
        if (!hasChildAccess) {
            continue; // No tiene permiso, saltar este sub-item
        }
    }
    
    // Agregar sub-item al menú
    children.add(child);
}
```

## Matriz de Privilegios

| Rol | Requiere Customer | Requiere Suscripción | Filtro por Módulos Suscripción | Filtro por Permisos Rol | Ve Todos los Sub-items |
|-----|-------------------|----------------------|-------------------------------|-------------------------|------------------------|
| **MANAGER** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Sí |
| **SUPERADMIN** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **ADMIN** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **Usuario Normal** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |

## Casos de Uso

### Caso 1: Usuario con rol MANAGER
```
Input:
- Usuario: manager@example.com
- Rol: MANAGER
- Customer: Puede o no tener
- Suscripción: Puede o no tener

Output:
- Menú con TODOS los módulos activos del sistema
- TODOS los sub-items de cada módulo
- Sin validar permisos RBAC
```

### Caso 2: Usuario SUPERADMIN sin suscripción
```
Input:
- Usuario: admin@tenant1.com
- Rol: SUPERADMIN
- Customer: tenant1
- Suscripción: NO EXISTE

Output:
- Menú VACÍO
- Log: "Customer {id} no tiene suscripción activa"
```

### Caso 3: Usuario SUPERADMIN con suscripción
```
Input:
- Usuario: admin@tenant1.com
- Rol: SUPERADMIN
- Customer: tenant1
- Suscripción: ACTIVA con 5 módulos

Output:
- Menú con SOLO los 5 módulos de la suscripción
- Sub-items filtrados por permisos ACCESS_*
- Mismo comportamiento que usuario normal
```

### Caso 4: Usuario normal con suscripción
```
Input:
- Usuario: user@tenant1.com
- Rol: VENDEDOR
- Customer: tenant1
- Suscripción: ACTIVA con 5 módulos
- Permisos: ACCESS a solo 3 módulos

Output:
- Menú con SOLO 3 módulos (intersección de suscripción y permisos)
- Sub-items filtrados por permisos ACCESS_*
```

## Logs del Sistema

### MANAGER
```
INFO: Usuario manager@example.com es MANAGER - Acceso total a todos los módulos activos
INFO: MANAGER manager@example.com generó menú con 15 items (todos los módulos activos)
```

### SUPERADMIN sin suscripción
```
INFO: Customer 123 no tiene suscripción activa. Usuario admin@tenant1.com no verá módulos.
```

### SUPERADMIN con suscripción
```
DEBUG: Usuario admin@tenant1.com tiene 5 módulos custom en suscripción
INFO: Usuario admin@tenant1.com generó menú con 5 items (de 5 módulos en suscripción)
```

### Usuario normal
```
DEBUG: Usuario user@tenant1.com tiene 5 módulos del plan
TRACE: Usuario user@tenant1.com no tiene permiso ACCESS al módulo FACTURACION
TRACE: Usuario user@tenant1.com no tiene permiso ACCESS al módulo INVENTARIO
INFO: Usuario user@tenant1.com generó menú con 3 items (de 5 módulos en suscripción)
```

## Verificación

### Compilación
```bash
mvn clean compile -DskipTests
# ✅ BUILD SUCCESS
# Total time: 22.350 s
```

### Testing Recomendado

#### Test 1: MANAGER ve todo
```java
@Test
public void testManagerSeesTodosLosModulos() {
    // Given: Usuario con rol MANAGER
    UserEntity manager = createUserWithRole("MANAGER");
    
    // When: Se genera el menú
    List<MenuItemDTO> menu = menuService.getMenuData();
    
    // Then: Ve todos los módulos activos
    assertEquals(totalModulesActive, menu.size());
}
```

#### Test 2: SUPERADMIN sin suscripción
```java
@Test
public void testSuperAdminSinSuscripcionNoVeModulos() {
    // Given: SUPERADMIN sin suscripción activa
    UserEntity admin = createUserWithRole("SUPERADMIN");
    admin.getCustomer().setSubscriptions(Collections.emptyList());
    
    // When: Se genera el menú
    List<MenuItemDTO> menu = menuService.getMenuData();
    
    // Then: No ve ningún módulo
    assertTrue(menu.isEmpty());
}
```

#### Test 3: Usuario normal filtrado
```java
@Test
public void testUsuarioNormalFiltradoPorSuscripcionYPermisos() {
    // Given: Usuario con suscripción de 5 módulos pero solo 3 permisos
    UserEntity user = createUserWithRole("VENDEDOR");
    setupSubscriptionWithModules(user.getCustomer(), 5);
    setupPermissions(user, 3); // Solo ACCESS a 3 módulos
    
    // When: Se genera el menú
    List<MenuItemDTO> menu = menuService.getMenuData();
    
    // Then: Solo ve 3 módulos
    assertEquals(3, menu.size());
}
```

## Archivos Modificados

### Backend
- `backend/src/main/java/com/app/starter1/persistence/services/MenuService.java`
  - **Líneas 35-45**: Documentación del flujo actualizada
  - **Líneas 58-84**: Lógica especial para MANAGER
  - **Líneas 85-164**: Flujo normal para otros roles
  - **Línea 167**: Renombrado parámetro `isSuperAdmin` → `showAllSubItems`
  - **Líneas 185-199**: Lógica condicional para filtrado de sub-items

### Documentación
- `.agent/docs/menu-refactoring-manager-privileges.md` (este archivo)

## Próximos Pasos

1. ✅ **Compilación exitosa**
2. 🔄 **Crear usuario con rol MANAGER en base de datos**
3. 🔄 **Reiniciar backend** para aplicar cambios
4. 🔄 **Probar login con MANAGER** y verificar que ve todos los módulos
5. 🔄 **Probar con SUPERADMIN** y verificar que está limitado a suscripción
6. 🔄 **Verificar logs** en la consola del backend

## Comandos Útiles

### Crear usuario MANAGER (SQL)
```sql
-- Crear rol MANAGER si no existe
INSERT INTO role (id, role, created_at, updated_at) 
VALUES (100, 'MANAGER', NOW(), NOW());

-- Asignar rol MANAGER a un usuario
UPDATE user_roles SET role_id = 100 WHERE user_id = <ID_USUARIO>;
```

### Reiniciar Backend
```bash
cd c:\apps\cloudfly\backend
mvn spring-boot:run
```

### Ver Logs en Tiempo Real
```bash
# Windows PowerShell
Get-Content -Path "logs/application.log" -Wait -Tail 50
```

## Resumen de Cambios

### ✅ Implementado
- ✅ MANAGER ve TODOS los módulos sin restricciones
- ✅ MANAGER no requiere suscripción
- ✅ MANAGER ve todos los sub-items
- ✅ SUPERADMIN/ADMIN están sujetos a filtro de suscripción
- ✅ Usuarios normales filtrados por suscripción + permisos
- ✅ Logs detallados para debugging
- ✅ Código compilado exitosamente

### 📋 Pendiente
- ⏳ Testing en ambiente desarrollo
- ⏳ Verificar comportamiento en frontend
- ⏳ Documentar en manual de usuario
- ⏳ Crear roles MANAGER en base de datos de producción
