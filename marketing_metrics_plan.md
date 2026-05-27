# Plan de Implementación: Métricas de Campaña en Tiempo Real

Para lograr que las métricas de **Entregados** y **Leídos** funcionen, debemos cerrar el ciclo de retroalimentación desde WhatsApp (Evolution API) hacia nuestro sistema.

## 1. Captura de Identificadores (Backend/Worker)
Actualmente, el sistema envía los mensajes pero no guarda el `provider_message_id`.
- **Tarea:** Modificar `EvolutionService` para que retorne el ID del mensaje generado por WhatsApp.
- **Estado:** Pendiente (se requiere ajustar el parseo de la respuesta JSON).

## 2. Infraestructura de Webhooks
Necesitamos un punto de entrada que escuche a Evolution API.
- **Tarea:** Crear un `WebhookController` en el `backend-api` (o un servicio dedicado).
- **Endpoint:** `POST /api/v1/webhooks/whatsapp`
- **Configuración:** Registrar este webhook en el panel de Evolution API o vía API al iniciar la instancia.

## 3. Procesamiento de Eventos
Cuando WhatsApp notifica un cambio de estado:
- **Evento `messages.update`:**
  - Si `status: 2` -> Marcar como **ENTREGADO**.
  - Si `status: 3` -> Marcar como **LEÍDO**.
- **Lógica:**
  1. Buscar el log en `campaign_send_logs` por `provider_message_id`.
  2. Actualizar el estado del log.
  3. Incrementar atómicamente el contador correspondiente (`total_delivered`, `total_read`) en la tabla `campaigns`.

## 4. Visualización en Frontend
El frontend ya tiene los componentes de KPI (Enviados, Entregados, etc.).
- **Tarea:** Asegurar que los componentes de KPI consuman los datos actualizados desde el objeto `campaign`.
- **Tarea:** Implementar un mecanismo de refresco automático (polling corto o WebSockets) en la vista de detalle de campaña.

---
**Próximos pasos inmediatos:**
1. Desplegar el worker corregido para habilitar el **Registro de Envíos**.
2. Modificar el worker para capturar el ID del proveedor.
3. Crear el receptor de webhooks.
