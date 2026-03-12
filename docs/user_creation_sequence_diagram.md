# Diagrama de Secuencia: Creación y Activación de Rol USER (Invitación)

Este diagrama describe el flujo cuando un **ADMIN** crea un nuevo usuario con rol **USER** desde el panel administrativo (/users/form) y el proceso de activación asíncrona.

```mermaid
sequence_diagram
    autonumber
    actor Admin as Administrador
    participant FE as Frontend (Dashboard)
    participant BE as Backend (API)
    participant DB as Base de Datos
    participant K as Kafka (Topic: register-user)
    participant NS as Notification Service
    actor User as Nuevo Usuario (USER)

    Note over Admin, User: Fase 1: Creación Administrativa
    Admin->>FE: Acceder a /users/form
    Admin->>FE: Llenar datos (Nombres, Apellidos, Email, Rol: USER)
    FE->>BE: POST /api/users (Payload con rol USER)
    
    Note right of BE: Validación de Permisos (Solo ADMIN/MANAGER)
    
    BE->>DB: INSERT User (isEnabled=false, verificationToken=UUID)
    BE->>K: Emitir evento "register-user"
    BE-->>FE: HTTP 201 Created
    FE-->>Admin: Mostrar "Usuario creado. Email de activación enviado."

    Note over User, NS: Fase 2: Notificación Asíncrona
    K->>NS: Consumir evento
    NS->>User: Enviar correo con enlace de activación

    Note over User, BE: Fase 3: Activación de Cuenta
    User->>FE: Clic en enlace (/verificate/{token})
    FE->>BE: GET /auth/verify?token={token}
    BE->>DB: UPDATE User SET isEnabled=true
    BE-->>FE: Success Response
    FE-->>User: Mostrar "Cuenta activada. Ahora puedes ingresar."

    Note over User, FE: Fase 4: Primer Login y Redirección
    User->>FE: Login con credenciales
    FE->>BE: POST /auth/login
    BE-->>FE: HTTP 200 OK (JWT + UserDto con rol USER)
    
    Note right of FE: Lógica en LoginV2.tsx
    FE->>FE: Detectar rol USER
    FE-->>User: Redirección directa a /home (Salto de Onboarding)
```

## Características Clave
1. **Restricción**: El rol `USER` no puede registrarse por sí mismo en la página pública; requiere intervención de un administrador.
2. **Asincronismo**: El envío del correo de invitación se gestiona vía Kafka para no bloquear la UI administrativa.
3. **Privilegios**: Al loguearse, el `USER` no pasa por el wizard de configuración de empresa (`account-setup`), asumiendo que ya pertenece a la organización del creador.
