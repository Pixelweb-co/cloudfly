# Refactorización del Flujo de Carga del Menú

## Fecha: 2025-12-22

## Objetivo
Implementar un flujo de carga del menú basado estrictamente en:
1. **Obtener la suscripción del customer** al que pertenece el usuario
2. **Obtener los módulos asociados** a la suscripción
3. **Filtrar los módulos** por permisos del rol
4. **Devolver en formato MenuItemDTO** para renderizar en frontend

## Cambios Realizados

### 1. `MenuService.java` - Método `getMenuData()`

#### ❌ Comportamiento Anterior
- Solo los usuarios NO-SuperAdmin pasaban por filtro de suscripción
- SuperAdmin/Admin/Manager veían TODOS los módulos sin restricciones
- La suscripción era opcional para usuarios privilegiados

#### ✅ Nuevo Comportamiento
- **TODOS los usuarios** (incluyendo SuperAdmin/Admin/Manager) deben tener:
  1. Un **customer** asociado
  2. Una **suscripción activa**
  3. **Módulos** en la suscripción (custom o del plan)
  
- Si falta alguno de estos elementos → **menú vacío**
- Los módulos se filtran en **dos niveles**:
  1. **Filtro de Suscripción**: El módulo debe estar en la suscripción del customer
  2. **Filtro de Rol**: El usuario debe tener permiso `ACCESS` al módulo

#### Código Clave
```java
// PASO 1: Obtener suscripción (OBLIGATORIO)
if (user.getCustomer() == null) {
    log.warn("Usuario {} no tiene customer asociado. No se puede generar menú.", username);
    return new ArrayList<>();
}

Optional<Subscription> subscriptionOpt = subscriptionRepository
        .findActiveTenantSubscriptionWithModules(user.getCustomer().getId());

if (!subscriptionOpt.isPresent()) {
    log.info("Customer {} no tiene suscripción activa. Usuario {} no verá módulos.", 
            user.getCustomer().getId(), username);
    return new ArrayList<>();
}

// PASO 2: Obtener módulos de la suscripción
Set<Long> subscriptionModuleIds = new HashSet<>();
// Prioridad: Módulos custom, Fallback: Módulos del plan

// PASO 3: Filtrar por suscripción Y rol
for (RbacModule module : allModules) {
    // Filtro 1: Debe estar en la suscripción
    if (!subscriptionModuleIds.contains(module.getId())) {
        continue;
    }
    
    // Filtro 2: El rol debe tener permiso ACCESS
    boolean hasAccess = userRoles.stream()
            .anyMatch(role -> role.hasPermission(module.getCode(), "ACCESS"));
    
    if (!hasAccess) {
        continue;
    }
    
    menuItems.add(convertToMenuItemDTO(module, userRoles, isSuperAdmin));
}
```

### 2. `MenuService.java` - Método `convertToMenuItemDTO()`

#### ❌ Comportamiento Anterior
- SuperAdmin/Admin/Manager veían TODOS los sub-items automáticamente
- El parámetro `isSuperAdmin` daba acceso directo sin validar permisos

#### ✅ Nuevo Comportamiento
- **TODOS los usuarios** necesitan permiso explícito `ACCESS_<SUBITEM>` para ver sub-items
- El parámetro `isSuperAdmin` se mantiene por compatibilidad pero **no** da acceso automático

#### Código Clave
```java
// Verificar acceso al subitem - TODOS los usuarios necesitan permiso explícito
String actionCode = "ACCESS_" + normalizeLabel(label);
boolean hasChildAccess = userRoles.stream()
        .anyMatch(role -> role.hasPermission(module.getCode(), actionCode));

if (!hasChildAccess) {
    log.trace("Usuario no tiene permiso {} para sub-item '{}' del módulo {}", 
            actionCode, label, module.getCode());
    continue;
}
```

## Impacto

### ✅ Ventajas
1. **Seguridad mejorada**: Todos los usuarios ven solo lo que su suscripción permite
2. **Multi-tenancy real**: Incluso SuperAdmin está limitado a su tenant
3. **Flujo consistente**: No hay casos especiales ni excepciones
4. **Trazabilidad**: Logs detallados para debugging

### ⚠️ Consideraciones
1. **SuperAdmin ya no ve TODO**: Solo ve módulos de su suscripción
2. **Suscripción obligatoria**: Usuarios sin suscripción activa no verán menú
3. **Permisos explícitos**: Se requiere configurar permisos ACCESS en RBAC

## Verificación

### Compilación
```bash
mvn clean compile -DskipTests
# ✅ BUILD SUCCESS
```

### Logs Agregados
- `Usuario {} no tiene customer asociado`
- `Customer {} no tiene suscripción activa`
- `Usuario {} tiene {} módulos custom en suscripción`
- `Módulo {} no está en suscripción de usuario {}`
- `Usuario {} no tiene permiso ACCESS al módulo {}`
- `Usuario {} generó menú con {} items (de {} módulos en suscripción)`

## Próximos Pasos

### Frontend
El frontend (`VerticalMenu.tsx`) ya funciona correctamente con estos cambios, ya que:
- Consume `/api/menu` que ahora retorna el menú filtrado correctamente
- Mantiene items hardcodeados para compatibilidad (Usuarios, Roles, etc.)
- El filtro `excludedRoles` sigue funcionando

### Testing Recomendado
1. **Usuario sin customer**: Verificar menú vacío
2. **Usuario sin suscripción**: Verificar menú vacío
3. **Usuario con suscripción**: Verificar solo ve módulos de su plan
4. **SuperAdmin**: Verificar está limitado a su suscripción
5. **Permisos RBAC**: Verificar filtrado por rol funciona

### Base de Datos
Asegurarse de que:
- Todos los usuarios tengan `customer_id` válido
- Los customers tengan suscripciones activas
- Los planes tengan módulos configurados
- Los roles tengan permisos `ACCESS` a los módulos necesarios

## Archivos Modificados
- `backend/src/main/java/com/app/starter1/persistence/services/MenuService.java`
  - Método `getMenuData()` - Refactorizado completamente
  - Método `convertToMenuItemDTO()` - Eliminado bypass de SuperAdmin
