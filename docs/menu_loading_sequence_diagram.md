# Diagrama de Carga de Menú Dinámico (DB Driven)

Este diagrama detalla cómo el sistema genera el menú lateral basándose en el rol del usuario y los módulos contratados en su suscripción.

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    participant User as Usuario
    participant FE as Frontend (VerticalMenu.tsx)
    participant BE as Backend (RbacController)
    participant DB as Base de Datos (MySQL)

    User->>FE: Acceso a la aplicación
    FE->>BE: GET /api/rbac/menu (con JWT)
    
    Note over BE, DB: Identificación de Rol y Contexto
    BE->>BE: Extraer Username y Roles del JWT

    alt Rol es MANAGER o SUPERADMIN
        Note over BE, DB: Usuario Global / Administración
        BE->>DB: moduleRepository.findAll()
        DB-->>BE: List<ModuleEntity> (Todos los módulos)
    else Rol es ADMIN o USER
        Note over BE, DB: Usuario de Cliente (Multi-tenant)
        BE->>DB: Obtener CustomerId del Usuario
        BE->>DB: Buscar Suscripción "ACTIVE" para el CustomerId
        BE->>DB: Obtener módulos asociados a la Suscripción
        DB-->>BE: List<ModuleEntity> (Módulos contratados)
    end

    Note over BE, DB: Generación de Estructura de Menú
    BE->>BE: Agregar "Dashboard" (Item fijo inicial)
    loop Para cada ModuleEntity
        BE->>BE: Parsear campo 'menu_items' (JSON string -> List<MenuItemDto>)
        BE->>BE: Mapear atributos (icon, href, displayOrder)
    end
    BE->>BE: Ordenar ítems por 'displayOrder'
    
    BE-->>FE: HTTP 200 OK (List<MenuItemDto>)
    FE->>FE: renderMenuItems(data)
    FE-->>User: Mostrar Sidebar dinámico
```

## Lógica de Decisión

1.  **MANAGER / SUPERADMIN**: Tienen acceso de "plataforma". No requieren una suscripción de cliente porque su función es gestionar a los clientes, planes y módulos globales. Ven todos los registros de la tabla `modules`.
2.  **ADMIN / USER**: Tienen acceso de "negocio". Su menú está estrictamente limitado a los módulos vinculados a la suscripción activa de su `Tenant`.
3.  **Campo `menu_items`**: Cada módulo en la DB almacena sus sub-ítems en formato JSON. Esto permite que el backend sea el único origen de verdad para la navegación, facilitando actualizaciones sin tocar el frontend.

---
*Este documento complementa el [onboarding_sequence_diagram.md](file:///c:/apps/cloudfly/docs/onboarding_sequence_diagram.md).*
