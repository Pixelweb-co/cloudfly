# System Design Document (SDD): Billing & Notifications

## 1. Visión General del Sistema
El sistema de facturación y notificaciones de CloudFly es un flujo automatizado multi-tenant diseñado para gestionar suscripciones SaaS, procesar pagos recurrentes, y despachar notificaciones de cobro a través de múltiples canales (WhatsApp, Email) utilizando arquitecturas basadas en eventos.

## 2. Componentes Principales

### 2.1. Frontend (`frontend_new` - React/Next.js)
El frontend gestiona la captura de métodos de pago durante el Wizard de Onboarding (Paso de Billing):
- **Tarjetas de Crédito/Débito (`CARD`)**: Integración directa con el API REST de Wompi para tokenización segura. El token de la tarjeta (`wompiToken`) se envía al backend.
- **Transferencias Bancolombia (`BANCOLOMBIA_TRANSFER`) y PSE**: (Nuevo flujo) Opciones maquetadas para generar compras recurrentes a través de la API de fuentes de pago bancarias.

### 2.2. Core / Customer API (`backend_new` - Spring Boot)
El endpoint `/customers/account-setup/payment` se encarga de:
- Recibir el token de pago desde el frontend.
- Guardar la información en la tabla `payment_methods` (asociando `tenant_id`, `token`, `brand`, etc.).
- Crear la suscripción inicial (Trial de 14 días) en la tabla `subscriptions`.

### 2.3. Billing Service (`billing-service` - Go)
Microservicio encargado de ejecutar la lógica financiera.
- Consumo del API Privado de Wompi.
- Creación de fuentes de pago (`/payment_sources`).
- Ejecución de transacciones recurrentes automáticas (`/transactions`) usando el `payment_source_id`.
- Validación criptográfica de Webhooks de Wompi (aprobación/rechazo de pagos).

### 2.4. Scheduler Service (`scheduler-service` - Python/Cron)
Orquestador de procesos programados.
- Realiza consultas diarias a la base de datos buscando suscripciones próximas a expirar o que requieran cobro.
- Desencadena el evento de cobro enviando peticiones al `billing-service`.
- Inyecta eventos en Kafka una vez que se emiten facturas o se registran cobros exitosos/fallidos.

### 2.5. Notification Engine (Kafka + Workers)
Sistema de despacho asíncrono.
- Escucha los tópicos de Kafka relacionados con facturación (`billing.events`, `invoice.generated`).
- El servicio de notificaciones procesa los mensajes y despacha alertas:
  - **Email**: Envío de facturas y resúmenes.
  - **WhatsApp**: Alertas inmediatas mediante `chat-socket-service` / Evolution API para notificar cobros exitosos o rechazos en las tarjetas.

---

## 3. Integración Wompi: Compra Recurrente (Nueva Especificación)

Con la nueva actualización del API de Wompi (`compra-recurrente-nuevo`), las suscripciones automáticas de CloudFly ya no están limitadas únicamente a **Tarjetas de Crédito (`CARD`)**. Ahora el sistema soporta **Débitos Automáticos desde Cuentas Bancolombia (`BANCOLOMBIA_TRANSFER`)**.

### Flujo de Suscripción Recurrente con Bancolombia:
1. **Creación de la Fuente de Pago**:
   - En lugar de tokenizar una tarjeta en silencio, el cliente autoriza la vinculación de su cuenta Bancolombia mediante una redirección.
   - Wompi genera un `payment_source_id` para esta cuenta.
   - Si la cuenta es validada y aceptada, el estado del token pasa a `APPROVED`.

2. **Almacenamiento del Método de Pago**:
   - El backend de CloudFly (`backend_new` y `billing-service`) guardan este `payment_source_id` en la tabla `payment_methods` etiquetado como `provider="WOMPI"` y `type="BANCOLOMBIA_TRANSFER"`.

3. **Ejecución del Débito Automático (Cobro Recurrente)**:
   - Al finalizar el periodo Trial o en el ciclo de renovación, el `scheduler-service` desencadena el pago.
   - El `billing-service` (Go) arma el payload del pago apuntando a la fuente bancaria:
     ```json
     {
       "payment_method": {
         "type": "BANCOLOMBIA_TRANSFER",
         "payment_description": "Suscripción CloudFly",
         "ecommerce_url": "https://dashboard.cloudfly.com.co/thankyou"
       },
       "payment_source_id": 123456789
     }
     ```
   - **Resultado**: La transacción se ejecuta de manera *automática*, sin que el cliente tenga que ingresar a su banco o confirmar el pago manualmente.

---

## 4. Próximos Pasos de Implementación
- Actualizar `StepBillingPlan.tsx` para lanzar el flujo de autorización de fuente de pago (`/payment_sources`) cuando el usuario seleccione **Bancolombia** o **PSE**.
- Adaptar el `billing-service` (Go) en `client.go` para que el `payment_method_type` sea dinámico en `CreateRecurringTransaction` (`CARD` o `BANCOLOMBIA_TRANSFER`).
- Modificar el sistema de notificaciones para enviar alertas específicas de WhatsApp cuando una cuenta bancaria rechace el cobro recurrente por falta de fondos.
