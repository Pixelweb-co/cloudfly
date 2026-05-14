# 🔌 Flujo de Chat Socket Service

Este documento describe cómo el `chat-socket-service` actúa como el orquestador central entre WhatsApp, el Dashboard administrativo y el Agente de IA.

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant W as WhatsApp (Evolution API)
    participant CS as Chat Socket Service (Node.js)
    participant DB as MySQL DB
    participant FD as Frontend Dashboard (React)
    participant K as Kafka (messages.in)

    Note over W, CS: 1. Entrada de Mensaje (Webhook)
    W->>CS: POST /webhook (MESSAGES_UPSERT)
    
    CS->>DB: getOrCreateContact() & getOrCreateConversationId()
    DB-->>CS: {contactId, conversationId}
    
    CS->>DB: INSERT INTO omni_channel_messages (RECEIVED)
    DB-->>CS: messageId

    Note over CS, FD: 2. Notificación en Tiempo Real (Socket.io)
    rect rgb(240, 255, 240)
        CS->>FD: io.to(room).emit('new-message', payload)
        Note right of FD: El Dashboard muestra el mensaje de inmediato al agente humano.
    end

    Note over CS, K: 3. Compuerta del Chatbot (Logic Gate)
    CS->>CS: chatbotGateService.isChatbotEnabled(contactId)
    
    alt Chatbot Activado (Modo IA)
        CS->>W: setPresence('composing') (Escribiendo...)
        CS->>K: messageBufferService.buffer(messages.in)
        Note right of K: El AI Agent procesa el mensaje<br/>y genera respuesta.
    else Chatbot Desactivado (Modo Humano)
        Note right of CS: El flujo se detiene aquí.<br/>Solo un humano puede responder.
    end
```

## Responsabilidades del Servicio

1.  **Puente de Webhooks**: Convierte los webhooks crudos de Evolution API (WhatsApp) o Facebook Messenger en registros estandarizados de base de datos.
2.  **Gestión de Sesiones**: Crea y mantiene el `conversation_id`, agrupando mensajes en sesiones de 30 minutos de inactividad.
3.  **Sincronización del Dashboard**: Utiliza `Socket.io` para que los administradores vean los chats de WhatsApp sin necesidad de recargar la página.
4.  **Control de Flujo (Chatbot Gate)**: Decide si un mensaje debe ser procesado por la IA o si debe quedarse únicamente para atención humana.
5.  **Indicadores de Presencia**: Activa estados de "Escribiendo..." en WhatsApp para que la interacción con la IA se sienta más natural.

---
*Documentación técnica del sistema de comunicación omnicanal CloudFly.*
