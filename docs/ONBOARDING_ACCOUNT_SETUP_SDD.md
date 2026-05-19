# System Design Document (SDD): Multi-Tenant Onboarding & Account Setup Flow

## 1. Visión General del Sistema
El flujo de Registro, Verificación y Onboarding (Wizard Account Setup) de CloudFly es la puerta de entrada de nuevos clientes corporativos (Tenants). Ha sido diseñado bajo un estricto principio de **responsabilidad única por paso** y aislamiento de datos multi-tenant para garantizar que cada fase inicialice únicamente la infraestructura y los datos que le corresponden, sin solapamientos.

## 2. Diagrama Maestro de Secuencia (Onboarding & Setup)

El siguiente diagrama define el contrato formal de comunicación entre el usuario, la interfaz de Next.js, el backend reactivo de Spring Boot, la base de datos y los servicios periféricos (Evolution API, Kafka).

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant FE as Frontend (Wizard)
    participant LS as LocalStorage
    participant BE as Backend (Spring Boot)
    participant DB as Base de Datos
    participant WA as Evolution API (WhatsApp)

    Note over Usuario, BE: Fase 1: Registro y Verificación de Cuenta
    Usuario->>FE: Registro (/register)
    FE->>BE: POST /auth/register
    BE->>DB: Crear Usuario (enabled=false, customerId=null)
    BE-->>FE: HTTP 201 Created (Enviar email de confirmación)
    
    Usuario->>BE: GET /auth/verify?token={token} (Enlace email)
    BE->>DB: Activar Usuario (enabled=true)
    BE-->>FE: HTTP 200 OK (Redirección a /login)

    Note over Usuario, BE: Fase 2: Autenticación e Inicialización de Contexto
    Usuario->>FE: Login (/login)
    FE->>BE: POST /auth/login
    BE->>DB: Validar credenciales y obtener UserDto
    BE-->>FE: HTTP 200 OK (JWT + UserDto)
    FE->>LS: Guardar JWT, activeStep=0, userData

    alt Si es ADMIN y customerId == null (Primer ingreso)
        FE->>Usuario: Redirección automática a /account-setup
    else Ya completó onboarding (customerId != null)
        FE->>Usuario: Redirección directa a /home
    end

    Note over Usuario, BE: Fase 3: Wizard de Onboarding (Responsabilidad Única)

    Note over FE, BE: Paso 1: Tu Negocio (Creación del Tenant y Compañía)
    Usuario->>FE: Envía Datos de Empresa
    FE->>BE: POST /customers/account-setup
    BE->>DB: Crear Tenant, Company Principal
    BE->>DB: Crear Contacto Principal (Asociado a la cuenta del ADMIN)
    BE->>DB: Inicializar Pipeline de Ventas por Defecto ("Atención a Clientes")
    Note over BE, DB: Estados del Pipeline: Nuevos, Calificados, En Proceso, Cerrados (Ganado), Cerrados (Perdido)
    BE->>DB: Crear Categoría por Defecto ("General")
    BE-->>FE: HTTP 200 OK (UserDto actualizado con customerId y companyId)
    FE->>LS: Guardar activeStep=1, actualizar userData

    Note over FE, BE: Paso 2: Chatbot IA (Vinculación QR WhatsApp)
    FE->>BE: GET /api/evolution/status/{instance}
    alt Si estado es "open" (Conexión activa)
        BE-->>FE: Status OK (Connected)
        FE->>LS: Guardar activeStep=2
    else Desconectado
        FE->>BE: POST /api/evolution/instance/cloudfly_{tenantId}
        BE->>WA: Inicializar instancia dedicada
        BE-->>FE: Status OK
        FE->>BE: GET /api/evolution/qr/cloudfly_{tenantId}
        BE-->>FE: QR Code (Base64)
        FE-->>Usuario: Mostrar código QR
        Usuario->>WA: Escanea QR con smartphone
        WA->>BE: Notificación de Conexión (Webhook)
        FE->>LS: Guardar activeStep=2
    end

    Note over FE, BE: Paso 3: Catálogo (Creación de Productos Iniciales)
    Usuario->>FE: Envía primer catálogo de productos
    FE->>BE: POST /api/v1/products (Headers: X-Tenant-Id, X-Company-Id)
    BE->>DB: Guardar productos asociados al Tenant/Company
    BE-->>FE: HTTP 201 Created
    FE->>LS: Guardar activeStep=3

    Note over FE, BE: Paso 4: Plan y Pago (Activación de Trial Gratuito)
    Usuario->>FE: Selecciona Plan y envía datos de pago
    Note over FE: Validación estricta con Yup (Card o Nequi)
    FE->>BE: Tokenización directa con Wompi (Tarjeta de Crédito)
    FE->>BE: POST /customers/account-setup/payment
    BE->>DB: Guardar PaymentMethodEntity (Tokenizado)
    BE->>DB: Activar Suscripción Trial (14 días gratis, auto-renovación activa)
    BE-->>FE: HTTP 200 OK (Trial Activado)
    FE->>LS: Remover activeStep (Completado)
    FE->>Usuario: Redirección final a /home (Dashboard activo con permisos de menú)
```

---

## 3. Desglose Técnico por Paso (Wizard Contract)

### Paso 1: Tu Negocio (Empresa y Pipeline de Ventas)
* **Objetivo:** Registrar la entidad legal (Tenant) y su sede principal (Company).
* **Operaciones en Base de Datos:**
  - Registra el emisor en `tenants`.
  - Registra la primera sucursal en `companies`.
  - Crea el contacto inicial en `contacts`.
  - **Pipeline por Defecto:** Llama a `PipelineService.createDefaultPipeline` para generar el embudo de ventas prediseñado:
    * **Nuevos** (Posición 0, estado inicial).
    * **Calificados** (Posición 1).
    * **En Proceso** (Posición 2).
    * **Cerrados (Ganado)** (Posición 3, estado final exitoso).
    * **Cerrados (Perdido)** (Posición 4, estado final fallido).
  - **Categoría por Defecto:** Crea la categoría base `"General"` para catalogar productos.

### Paso 2: Vinculación del Chatbot
* **Objetivo:** Provisionar el canal de comunicación en tiempo real.
* **Operaciones:**
  - Llama a `EvolutionService` para instanciar un contenedor/servicio dedicado con formato de nombre `cloudfly_{tenantId}`.
  - Presenta el QR Code temporal al cliente.
  - Registra el canal en la base de datos una vez que se detecta el estado `open` a través de webhooks.

### Paso 3: Productos Iniciales
* **Objetivo:** Forzar al cliente a poblar su catálogo para que el chatbot de IA sea funcional inmediatamente después de iniciar sesión.
* **Aislamiento Multi-Tenant:**
  - Cada inserción viaja con las cabeceras `X-Tenant-Id` y `X-Company-Id`.
  - El backend valida que el usuario autenticado pertenezca a dicho `tenantId` antes de escribir en la tabla `products`.

### Paso 4: Activación de Suscripción (Billing)
* **Objetivo:** Registrar el método de cobro recurrente automático (Wompi) y activar los permisos completos de los módulos contratados.
* **Validación Yup:**
  - Formulario protegido del lado del cliente para verificar estructuras de tarjeta de crédito (longitud de 13 a 19 dígitos numéricos en `cardNumber`, expiración `MM/YY` y `CVC` de 3 a 4 dígitos) o teléfonos Nequi válidos de 10 dígitos.
* **Activación:**
  - Inserta el registro en `subscriptions` con estado `TRIAL`.
  - Copia los módulos activos del plan a `subscription_modules` para desbloquear el Sidebar del Dashboard de forma dinámica.

---

## 4. Resiliencia de Sesión (Control F5)
Para evitar que una recarga accidental de página (`F5`) reinicie el progreso del usuario:
1. El frontend almacena `account_setup_step` en el `localStorage` en cada transición exitosa.
2. Al cargar el componente `/account-setup`, se valida el estado local:
   - Si `userData.customerId` es nulo, se restaura la vista en el paso indicado en `account_setup_step`.
   - Si se detecta que el backend ya guardó el negocio pero el estado local se perdió, se hace una consulta rápida al backend para sincronizar y restaurar el paso correcto.
