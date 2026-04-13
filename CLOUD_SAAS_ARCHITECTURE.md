# Arquitectura SaaS de CloudFly: Multi-Tenant y Multi-Company

Este documento describe la estructura fundamental de datos y la lógica de aislamiento en CloudFly para asegurar que la información esté correctamente segregada y organizada.

## Jerarquía de Datos

La estructura se basa en una jerarquía de dos niveles para el aislamiento de datos:

1.  **Tenant (Cliente)**: Representa la cuenta raíz del cliente corporativo.
    *   Todo usuario pertenece obligatoriamente a un Tenant.
    *   El aislamiento a nivel de base de datos se realiza mediante la columna `tenant_id`.
2.  **Company (Compañía/Sede)**: Sub-división lógica dentro de un mismo Tenant.
    *   Un Tenant puede tener múltiples compañías (ej: Sede Norte, Sede Sur, Almacén Principal).
    *   La información (Contactos, Productos, Pipelines, etc.) puede ser categorizada o filtrada por compañía mediante la columna `company_id`.

## Reglas de Aislamiento y Visibilidad

### Roles y Acceso

*   **ADMIN / MANAGER**:
    *   Tienen visibilidad sobre **todo el Tenant**.
    *   Pueden ver la información consolidada de todas las compañías del mismo Tenant.
    *   Utilizan un selector en el Dashboard para filtrar la vista por una compañía específica o ver el global del Tenant.
*   **USER (Agente)**:
    *   Normalmente está restringido a la compañía asignada en su perfil.
    *   Solo ve datos pertenecientes a su `tenant_id` y su `company_id`.

### Lógica de Backend

Cualquier consulta a la base de datos **DEBE** incluir el filtro por `tenant_id`.
*   Si se proporciona un `companyId`, se debe agregar el filtro `AND company_id = :companyId`.
*   Si no se proporciona `companyId` (es nulo), se asume que el usuario tiene permisos de nivel Tenant (Admin/Manager) y se devuelven todos los registros del Tenant.

### Lógica de Frontend

1.  **Persistencia del Contexto**: Al seleccionar un Tenant o Compañía, los IDs se guardan en `localStorage` (`activeTenantId`, `activeCompanyId`).
2.  **Navegación**: Al cambiar la compañía, se debe redirigir al usuario a `/home` para refrescar todas las estadísticas y contextos globales del Dashboard.
3.  **Peticiones API**: Los servicios del frontend deben anexar automáticamente estos IDs a las URIs o cabeceras para que el backend aplique los filtros correctamente.

---
*Documento creado bajo requerimiento del usuario para estandarizar la lógica de desarrollo SaaS.*
