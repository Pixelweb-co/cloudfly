# Flujo de Registro, Verificación y Onboarding

Este diagrama detalla la secuencia de eventos desde que un usuario se registra hasta que su cuenta y compañía por defecto son configuradas automáticamente. Se ha refinado para asegurar que el onboarding incluya la activación real de la instancia de WhatsApp y el catálogo inicial.

> **Última actualización**: 2026-03-12 — Incluye flujo verificado de 4 pasos con activación de instancia dedicada.

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
        Note over User, FE: Fase 3: Account Setup (Wizard 4 Pasos)
        User->>FE: Redirección automática a /account-setup
        FE->>FE: Cargar activeStep desde LocalStorage
        
        Note over User, FE: Paso 1: Tu Negocio
        User->>FE: Completa datos de empresa
        FE->>BE: POST /customers/account-setup
        BE->>DB: Crear Tenant, Company y Suscripción
        BE-->>FE: HTTP 200 OK (UserDto actualizado)
        FE->>FE: Guardar activeStep=1 y userData en LocalStorage
        
        Note over User, FE: Paso 2: Chatbot IA (QR WhatsApp)
        FE->>BE: GET /api/evolution/status/{instance}
        alt Si estado es "open" (Ya conectado tras F5)
            BE-->>FE: Status OK
            FE->>FE: Auto-skip al siguiente paso
        else Si no está conectado
            FE->>BE: POST /api/evolution/instance/{instance}
            BE->>WA: Crear/Recuperar Instancia
            BE-->>FE: Status OK
            FE->>BE: GET /api/evolution/qr/{instance}
            BE-->>FE: QR Code (Base64)
            FE-->>User: Mostrar QR para vincular
            User->>WA: Escanear QR con teléfono
            WA->>BE: Notificar Conexión (Webhook)
            User->>FE: Clic en "Ya escaneé"
            FE->>BE: GET /api/evolution/status/{instance}
            BE-->>FE: Status: Connected
        end
        FE->>FE: Guardar activeStep=2 en LocalStorage

        Note over User, FE: Paso 3: Categorías y Productos
        User->>FE: Crea categorías y productos iniciales
        FE->>BE: POST /api/products
        BE-->>FE: HTTP 201 Created
        FE->>FE: Guardar activeStep=3 en LocalStorage
        
        FE-->>User: Clic en 'Finalizar' -> Redirección a /home
        FE->>FE: Limpiar LocalStorage (account_setup_step)
    end

    Note over FE, BE: Carga Dashboard
    FE->>BE: GET /api/rbac/menu
    BE->>DB: Consultar Módulos
    BE-->>FE: List<MenuItemDto>
    FE-->>User: Renderizar Sidebar dinámico
```

## Detalles del Proceso

1.  **Registro**: El usuario se crea en estado inactivo hasta confirmar su correo. El `customerId` es nulo inicialmente.
2.  **Onboarding Estándar**: El wizard de 4 pasos asegura que el cliente tenga configurado su negocio, su canal de WhatsApp y al menos un producto antes de entrar al dashboard.
3.  **Activación de WhatsApp**: Al completar el Paso 1 (Negocio), el backend crea automáticamente una instancia dedicada en Evolution API (`cloudfly_{tenantId}`). La notificación de bienvenida se envía a través de esta nueva instancia si es posible.
4.  **Vinculación**: En el Paso 2, el usuario ve el QR de su propia instancia para finalizar la vinculación real.
5.  **Menú Dinámico**: El backend usa el `customerId` para filtrar los módulos.

## Notas Técnicas (Producción)

| Componente | Valor |
|---|---|
| Evolution API Instance Format | `cloudfly_{tenantId}` |
| Fallback Instance | `cloudfly_chatbot1` |
| Evolution API key | `54DC1F63C38C-4F66-BCA6-0EBE8E786C09` |
| Kafka topic notificación bienvenida | `welcome-notifications` |
| Redes Docker `notification-service` | `kafka-net` + `app-net` |

> ⚠️ **Importante**: El proceso de "Omitir" ha sido deshabilitado en favor de una configuración completa y activa desde el primer día.
