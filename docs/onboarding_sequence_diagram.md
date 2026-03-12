# Flujo de Registro, Verificación y Onboarding

Este diagrama detalla la secuencia de eventos desde que un usuario se registra hasta que su cuenta y compañía por defecto son configuradas automáticamente. Se ha refinado para asegurar que el onboarding solo ocurre si el usuario no tiene un Tenant asignado.

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    participant User as Usuario
    participant FE as Frontend (Next.js)
    participant BE as Backend (Spring Boot Reactive)
    participant Kafka as Kafka (Event Bus)
    participant DB as Base de Datos
    participant Mail as Servidor de Correo
    participant WA as WhatsApp (Evolution API)

    Note over User, FE: Fase 1: Registro y Verificación
    User->>FE: Ingresa datos en /register
    FE->>BE: POST /auth/register
    BE->>DB: Crear Usuario (enabled=false, customerId=null)
    BE->>Kafka: Emitir evento 'register-user'
    Kafka->>Mail: Consumidor envía enlace con token
    BE-->>FE: HTTP 201 Created
    FE-->>User: Mostrar "Verifica tu email"

    User->>Mail: Abre email y clic en enlace
    Mail->>FE: GET /verificate/{token}
    FE->>BE: GET /auth/verify?token={token}
    BE->>DB: Set enabled=true
    BE-->>FE: HTTP 200 OK
    FE-->>User: Mostrar "Cuenta verificada"

    Note over User, FE: Fase 2: Login
    User->>FE: Ingresa credenciales en /login
    FE->>BE: POST /auth/login
    BE->>DB: Validar credenciales
    BE-->>FE: HTTP 200 OK (JWT + UserDto)
    FE->>FE: Guardar JWT en LocalStorage

    alt Si el Usuario es MANAGER / SUPERADMIN
        Note over User, FE: Acceso total inmediato
        FE-->>User: Redirección directa a /home
    else Si el Usuario ya tiene Tenant (customerId != null)
        Note over User, FE: Usuario ya configurado o Invitado
        FE-->>User: Redirección directa a /home
    else Si el Usuario es ADMIN y customerId == null
        Note over User, FE: Fase 3: Account Setup (Onboarding Único)
        User->>FE: Redirección automática a /account-setup
        
        Note over User, FE: Configuración de Negocio
        User->>FE: Completa datos de empresa en /account-setup
        FE->>BE: POST /customers/account-setup
        BE->>DB: Crear Tenant, Company y Suscripción Gratuita
        BE->>DB: Activar Módulos del Plan en la Suscripción
        BE->>DB: Asociar user.customerId = tenant.id
        BE->>Kafka: Emitir evento 'welcome-notifications'
        Kafka->>WA: Consumidor envía bienvenida (Instancia 54DC1F...)
        BE-->>FE: HTTP 200 OK (UserDto actualizado)
        
        FE->>FE: Actualizar userData en LocalStorage (con customerId)
        FE-->>User: Redirección automática a /home
    end

    Note over FE, BE: Carga Dashboard
    FE->>BE: GET /api/rbac/menu
    BE->>DB: Consultar Módulos según Rol y Suscripción (si aplica)
    BE-->>FE: List<MenuItemDto>
    FE-->>User: Renderizar Sidebar dinámico
```

## Detalles del Proceso

1.  **Registro**: El usuario se crea en estado inactivo hasta confirmar su correo. El `customerId` es nulo inicialmente.
2.  **Onboarding Único**: El frontend verifica el campo `customerId` del usuario autenticado. Si es nulo y el rol es `ADMIN`, redirige al wizard. Si ya tiene valor, significa que la empresa ya existe (o el usuario fue invitado a una) y se le permite ir directo al Dashboard.
3.  **Account Setup**: En este paso se crea:
    *   El **Customer** (Tenant principal).
    *   La **Company** principal.
    *   La **Suscripción** al Plan inicial.
    *   Se actualiza el usuario con el ID del Tenant recién creado.
4.  **Menú Dinámico**: El backend usa el `customerId` para filtrar los módulos en la tabla `modules`.
