# Chat Socket Service — Lógica y diagramas de secuencia

Servicio Node.js (`chat_socket`) que recibe webhooks de WhatsApp (Evolution API), persiste mensajes, emite eventos en tiempo real vía Socket.IO, y orquesta el envío hacia el agente de IA vía Kafka.

---

## Componentes principales

| Componente | Rol |
|------------|-----|
| **Evolution API** | WhatsApp: webhooks entrantes y envío de mensajes |
| **chat-socket-service** | Orquestador HTTP + Socket.IO |
| **MySQL** | `channels`, `contacts`, `omni_channel_messages` |
| **Redis** | Caché chatbot gate + buffer debounce (3s) |
| **Kafka** | `messages.in` (→ IA), `messages.out` (← IA), `email-notifications`, `webnotifications` |
| **ai-agent** | Consume `messages.in`, publica `messages.out` |
| **Dashboard (frontend)** | Cliente Socket.IO en salas por tenant/company/contacto |

---

## 1. Mensaje entrante WhatsApp (webhook Evolution)

Flujo principal: `POST /webhook/evolution` → `ChatService.processEvolutionWebhook`.

```mermaid
sequenceDiagram
    autonumber
    participant WA as Cliente WhatsApp
    participant EV as Evolution API
    participant CS as chat-socket-service
    participant DB as MySQL
    participant IO as Socket.IO (Dashboard)
    participant R as Redis
    participant K as Kafka messages.in

    WA->>EV: Mensaje de texto/audio/imagen
    EV->>CS: POST /webhook/evolution (MESSAGES_UPSERT)
    Note over CS: Responde 200 OK de inmediato

    CS->>CS: Filtrar grupos, status@broadcast

    CS->>DB: WEBHOOK_STEP_1 — channels por instance_name
    DB-->>CS: tenant_id, company_id, channel_id

    CS->>DB: WEBHOOK_STEP_2 — getOrCreateContact(remoteJid)
    DB-->>CS: contact (id, phone, assigned_user_ids, ...)

    CS->>DB: WEBHOOK_STEP_3 — conversationService (UUID, gap 30 min)
    DB-->>CS: conversation_id

    CS->>DB: WEBHOOK_STEP_4 — INSERT omni_channel_messages (INBOUND)
    DB-->>CS: internal_message_id

    CS->>IO: WEBHOOK_STEP_6 — emit new-message
    Note right of IO: room tenant_{t}_company_{c}_contact_{phone}
    CS->>IO: WEBHOOK_STEP_6_GLOBAL — emit conversation-updated
    Note right of IO: room tenant_{t}_company_{c}

    CS->>R: WEBHOOK_STEP_7 — chatbotGateService.isChatbotEnabled
    alt chatbot_enabled = false
        CS->>CS: Human-only mode (sin buffer ni Kafka)
    else chatbot_enabled = true
        CS->>EV: setPresence(composing)
        CS->>R: bufferMessage (debounce 3s)
        Note over R: Redis list + ZSET debounce_queue
    end
```

---

## 2. Debounce → publicación a Kafka (hacia ai-agent)

Worker interno cada 500ms; al expirar 3s sin nuevos mensajes, concatena y publica.

```mermaid
sequenceDiagram
    autonumber
    participant R as Redis (buffer)
    participant CS as chat-socket-service
    participant K as Kafka messages.in
    participant AI as ai-agent

    Note over CS: messageBufferService.startDebounceWorker()

    loop Cada buffer expirado (3s inactividad)
        CS->>R: zrangebyscore debounce_queue
        CS->>R: lrange buffer:{tenant}:{contact}:{conv}
        CS->>R: get meta:{bufferKey}
        CS->>R: del buffer + meta

        alt Kafka disponible
            CS->>K: publishToKafka(tenantId, companyId, contactId, conversationId, mensaje)
            K->>AI: Consumer messages.in
            CS->>CS: BUFFER FLUSHED ✅
            opt read receipt
                CS->>EV: markRead(instance, remoteJid)
            end
        else Kafka no disponible
            CS->>CS: DEBOUNCE Kafka unavailable — mensaje descartado ⚠️
        end
    end
```

---

## 3. Respuesta del agente de IA (Kafka messages.out)

El `ai-agent` publica en `messages.out`; `kafkaConsumer` de chat-socket lo consume.

```mermaid
sequenceDiagram
    autonumber
    participant AI as ai-agent
    participant K as Kafka messages.out
    participant CS as chat-socket-service
    participant DB as MySQL
    participant EV as Evolution API
    participant WA as Cliente WhatsApp
    participant IO as Socket.IO (Dashboard)

    AI->>K: send_response (respuesta, isBotHandoff, mediaType, ...)
    K->>CS: kafkaConsumer — topic messages.out

    CS->>DB: SELECT contact + channel activo
    CS->>DB: INSERT omni_channel_messages (OUTBOUND)

    alt mediaType = audio
        CS->>EV: sendWhatsAppAudio
    else texto / imagen en markdown
        CS->>EV: sendMessage o sendMedia
        EV->>WA: Mensaje al cliente
    end

    opt isBotHandoff = true
        CS->>CS: _notifyHandoffToAdvisors (ver diagrama 4)
    end

    CS->>IO: emit new-message (room contacto)
    CS->>IO: emit conversation-updated (room company)
```

---

## 4. Notificación de handoff a asesores (desde chat-socket)

Cuando `messages.out` trae `isBotHandoff: true`, chat-socket notifica por su cuenta (además del flujo CLOUD-158 en `ai-agent` → `whatsapp-notifications`).

```mermaid
sequenceDiagram
    autonumber
    participant CS as chat-socket-service
    participant DB as MySQL
    participant EV as Evolution API
    participant K as Kafka email-notifications
    participant Asesor as Asesor / Admin

    Note over CS: processAiResponse — isBotHandoff = true

    CS->>DB: assigned_user_ids → users + contacts.phone
    alt Sin asesores asignados
        CS->>DB: users ADMIN/MANAGER (customer_id = tenant)
    end

    loop Por cada usuario a notificar
        alt Canal WhatsApp activo + teléfono asesor
            CS->>EV: sendMessage(instance, asesor JID, mensaje transferencia)
            EV->>Asesor: WhatsApp con link al dashboard
        else Sin canal / sin teléfono
            CS->>K: publishToEmailTopic (template whatsapp-handoff)
            K->>Asesor: Email vía notification-service
        end
    end
```

---

## 5. Chatbot Gate (Redis + MySQL)

```mermaid
sequenceDiagram
    autonumber
    participant CS as chat-socket-service
    participant R as Redis
    participant DB as MySQL

  CS->>R: GET chatbot:{tenantId}:{contactId}
    alt Cache HIT
        R-->>CS: "1" o "0"
    else Cache MISS
        CS->>DB: SELECT chatbot_enabled FROM contacts
        DB-->>CS: raw value
        CS->>R: SETEX cache (TTL 5 min)
    end

    Note over CS: POST /api/contacts/:id/chatbot-toggle invalida caché
```

---

## 6. Arranque del servicio (AI-INFRA)

```mermaid
sequenceDiagram
    autonumber
    participant CS as chat-socket-service
    participant R as Redis
    participant KP as Kafka Producer
    participant KC as Kafka Consumer
    participant IO as Socket.IO

    CS->>R: getRedisClient()
    CS->>KP: initKafkaProducer (messages.in, email-notifications)
    CS->>CS: startDebounceWorker (3s → Kafka)
    CS->>KC: initKafkaConsumer (messages.out, webnotifications)
    KC->>IO: Suscripción para emitir respuestas IA

    Note over CS: Si Kafka falla al iniciar: fallback mode (sin buffer efectivo)
```

---

## Salas Socket.IO

| Sala | Uso |
|------|-----|
| `tenant_{tenantId}_company_{companyId}_contact_{phone}` | Chat en vivo del contacto (webhook + respuestas IA) |
| `tenant_{tenantId}_company_{companyId}` | Kanban / lista conversaciones (`conversation-updated`) |
| `tenant_{tenantId}_contact_{phone}` | Emisión alternativa desde kafkaConsumer (respuesta IA) |
| `tenant_{tenantId}` / `tenant_{tenantId}_company_{companyId}` | Notificaciones web (`webnotifications`) |

---

## Mapa de logs → pasos

| Log | Paso |
|-----|------|
| `[WEBHOOK_STEP_1]` | Resolver canal por `instance_name` |
| `[WEBHOOK_STEP_2]` | Resolver/crear contacto |
| `[WEBHOOK_STEP_3]` | UUID de conversación |
| `[WEBHOOK_STEP_4]` | Guardar mensaje INBOUND |
| `[WEBHOOK_STEP_6]` / `[WEBHOOK_STEP_6_OK]` | Socket.IO contacto |
| `[WEBHOOK_STEP_6_GLOBAL]` | Socket.IO company (Kanban) |
| `[WEBHOOK_STEP_7]` | Chatbot gate |
| `[WEBHOOK_GATE]` | Buffer o modo humano |
| `[BUFFER]` / `[DEBOUNCE] BUFFER FLUSHED` | Cola debounce → Kafka |
| `[KAFKA-CONSUMER]` | Respuesta IA desde `messages.out` |
| `[AI-RESPONSE]` | Persistir OUTBOUND + Evolution |
| `[HANDOFF_NOTIFY]` | Notificar asesores (handoff en chat-socket) |

---

## Relación con CLOUD-158 (ai-agent)

El handoff a humano tiene **dos caminos** de notificación a asesores:

1. **ai-agent** (historia CLOUD-158): al detectar `handoff_request`, publica en Kafka `whatsapp-notifications` → `notification-service` → Evolution.
2. **chat-socket** (este documento): si `isBotHandoff` en `messages.out`, ejecuta `_notifyHandoffToAdvisors` directo (Evolution o email).

Ambos pueden coexistir; conviene alinear criterios de destinatarios para evitar duplicados.

---

## Archivos de referencia en código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/index.js` | HTTP, webhooks, Socket.IO, startup AI-INFRA |
| `src/services/chatService.js` | `processEvolutionWebhook`, `processAiResponse`, handoff |
| `src/services/messageBufferService.js` | Debounce 3s → `messages.in` |
| `src/services/kafkaConsumer.js` | Consume `messages.out`, `webnotifications` |
| `src/services/kafkaProducer.js` | Produce `messages.in`, `email-notifications` |
| `src/services/chatbotGateService.js` | Gate Redis/MySQL |
| `src/services/conversationService.js` | UUID conversación (30 min gap) |
