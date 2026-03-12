# Flujo de Registro, Verificación y Onboarding

Este diagrama detalla la secuencia de eventos desde que un usuario se registra hasta que su cuenta y compañía por defecto son configuradas automáticamente. Se ha refinado para asegurar que el onboarding solo ocurre si el usuario no tiene un Tenant asignado.

> **Última actualización**: 2026-03-12 — Incluye flujo verificado de notificación WhatsApp vía Evolution API

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
    participant NS as notification-service
    participant WA as WhatsApp (Evolution API)

    Note over User, FE: Fase 1: Registro y Verificación
    User->>FE: Ingresa datos en /register
    FE->>BE: POST /auth/register
    BE->>DB: Crear Usuario (enabled=false, customerId=null)
    BE->>Kafka: Emitir evento 'register-user'
    Kafka->>NS: Consumidor envía email de verificación
    NS->>Mail: Enviar email con enlace de activación
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
        Note over Kafka,WA: notification-service en kafka-net + app-net
        Kafka->>NS: Consumidor KafkaConsumerListener recibe mensaje
        NS->>WA: POST /message/sendText/cloudfly_chatbot1
        Note over NS,WA: apikey: 54DC1F63C38C-4F66-BCA6-0EBE8E786C09
        WA-->>NS: HTTP 201 - Mensaje enviado ✅
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
5.  **WhatsApp de Bienvenida**: Al completar el Account Setup, el backend publica en el tópico `welcome-notifications`. El `notification-service` consume el evento y llama a `POST /message/sendText/cloudfly_chatbot1` en la Evolution API con el mensaje de bienvenida al número registrado.

## Notas Técnicas (Producción)

| Componente | Valor |
|---|---|
| Evolution API instance | `cloudfly_chatbot1` |
| Evolution API key | `54DC1F63C38C-4F66-BCA6-0EBE8E786C09` |
| Kafka topic notificación bienvenida | `welcome-notifications` |
| Kafka topic registro | `register-user` |
| Redes Docker `notification-service` | `kafka-net` + `app-net` (requerido para alcanzar `evolution_api`) |

> ⚠️ **Importante**: El `notification-service` **debe estar en ambas redes** (`kafka-net` para consumir Kafka y `app-net` para alcanzar el contenedor `evolution_api`). Sin `app-net`, el servicio falla silenciosamente al intentar enviar la notificación.
