# 📱 Diagrama de Flujo: Mensajes WhatsApp en Cloudfly

## Arquitectura General

```
WhatsApp ↔ Evolution API ↔ chat-socket-service ↔ Frontend (Socket.IO)
                                    ↓ (si chatbot ON)
                              Kafka (messages.in)
                                    ↓
                              AI Agent (Python)
                                    ↓
                              Kafka (messages.out)
                                    ↓
                          chat-socket-service → Evolution API → WhatsApp
```

---

## Diagrama de Secuencia — Mensaje ENTRANTE (Inbound)

```mermaid
sequenceDiagram
    autonumber

    actor User as 📱 Usuario WhatsApp
    participant EvoAPI as Evolution API<br/>(evolution_api)
    participant ChatSocket as Chat Socket Service<br/>(chat_socket)
    participant DB as MySQL DB<br/>(cloudfly_main)
    participant FE as Frontend Next.js<br/>(dashboard.cloudfly.com.co)
    participant Kafka as Kafka<br/>(messages.in)
    participant AIAgent as AI Agent<br/>(Python / ai-agent)

    User->>EvoAPI: Envía mensaje WhatsApp
    EvoAPI->>ChatSocket: POST /webhook/evolution<br/>event: MESSAGES_UPSERT

    Note over ChatSocket: Normaliza evento a MESSAGES_UPSERT

    ChatSocket->>DB: SELECT channels WHERE instance_name = ?
    DB-->>ChatSocket: channel (tenant_id, company_id, channel_id)

    ChatSocket->>DB: SELECT contacts WHERE phone = ?
    alt Contacto existe
        DB-->>ChatSocket: contact existente
    else Contacto nuevo
        ChatSocket->>DB: INSERT INTO contacts (uuid, phone, name...)
        DB-->>ChatSocket: nuevo contact
    end

    ChatSocket->>DB: getOrCreateConversationId()<br/>SELECT/INSERT conversation (30min gap)
    DB-->>ChatSocket: conversation_id (UUID)

    ChatSocket->>DB: INSERT INTO omni_channel_messages<br/>(direction=INBOUND, content, conversation_id)
    DB-->>ChatSocket: message_id

    ChatSocket->>DB: SELECT últimos 10 mensajes
    DB-->>ChatSocket: history[]

    ChatSocket->>FE: io.emit('new-message', payload)<br/>room: tenant_X_contact_PHONE
    Note over FE: Chat UI actualiza en tiempo real

    alt Chatbot habilitado para este contacto
        ChatSocket->>Kafka: publishToKafka(messages.in)<br/>{tenantId, contactId, mensaje, conversationId}
        Note over Kafka: Debounce buffer 3s<br/>concatena mensajes rápidos

        Kafka->>AIAgent: Consume mensaje
        AIAgent->>AIAgent: Procesa con LLM<br/>+ herramientas de BD

        AIAgent->>Kafka: Publica respuesta (messages.out)<br/>{respuesta, tenantId, contactId}

        Kafka->>ChatSocket: Consume respuesta
        ChatSocket->>DB: INSERT omni_channel_messages<br/>(direction=OUTBOUND)
        ChatSocket->>EvoAPI: POST /message/sendText/{instance}<br/>número: phone@s.whatsapp.net
        EvoAPI->>User: Entrega mensaje WhatsApp ✅
        ChatSocket->>FE: io.emit('new-message')<br/>direction=OUTBOUND
    else Chatbot deshabilitado (modo humano)
        Note over ChatSocket: Solo Socket.IO al frontend<br/>Sin Kafka / Sin AI
    end
```

---

## Diagrama de Secuencia — Mensaje SALIENTE (Outbound desde Frontend)

```mermaid
sequenceDiagram
    autonumber

    actor Agent as 👤 Agente Humano (Frontend)
    participant FE as Frontend Next.js<br/>(dashboard.cloudfly.com.co)
    participant ChatSocket as Chat Socket Service<br/>(chat_socket)
    participant DB as MySQL DB
    participant EvoAPI as Evolution API<br/>(evolution_api)
    participant User as 📱 Usuario WhatsApp

    Agent->>FE: Escribe y envía mensaje en Chat UI
    FE->>ChatSocket: Socket.IO emit('send-message')<br/>{tenantId, contactPhone, content}

    ChatSocket->>DB: SELECT channels WHERE tenant_id = ?<br/>platform=WHATSAPP, status=1
    DB-->>ChatSocket: channel (instance_name)

    ChatSocket->>DB: INSERT omni_channel_messages<br/>(direction=OUTBOUND, status=SENT)
    DB-->>ChatSocket: message_id

    ChatSocket->>EvoAPI: POST /message/sendText/{instance}<br/>{number: phone@s.whatsapp.net, text}
    EvoAPI->>User: Entrega mensaje WhatsApp ✅
    EvoAPI-->>ChatSocket: 200 OK

    ChatSocket->>FE: Socket.IO emit('message-sent')<br/>confirmación con message_id
```

---

## Servicios y Dominios

| Servicio | Contenedor | Dominio Público | Puerto Interno |
|----------|------------|------------------|----------------|
| Evolution API | `evolution_api` | `eapi.cloudfly.com.co` | 8080 |
| Chat Socket Service | `chat_socket` | `chat.cloudfly.com.co` | 3001 |
| Frontend Next.js | `frontend_app` | `dashboard.cloudfly.com.co` | 3000 |
| Backend Java API | `backend-api` | `api.cloudfly.com.co` | 8080 |
| AI Agent | `ai-agent` | *(interno)* | — |
| Kafka | `kafka` | *(interno)* | 9092 |
| MySQL | `db` | *(interno)* | 3306 |

---

## Instancias WhatsApp Activas

| Instancia | Estado | Número | Tenant |
|-----------|--------|--------|--------|
| `cloudfly_t1_c1` | ✅ open | 573246285134 (Pixelweb) | tenant_1 |

---

## Tópicos Kafka

| Tópico | Dirección | Publicado por | Consumido por |
|--------|-----------|---------------|---------------|
| `messages.in` | ➡️ | chat-socket-service | ai-agent |
| `messages.out` | ⬅️ | ai-agent | chat-socket-service |

---

## Comandos útiles para diagnóstico en VPS

```bash
# Logs del chat-socket-service (webhook + socket.io + kafka)
docker logs chat_socket -f --tail=100

# Logs del AI Agent (Kafka consumer + LLM)
docker logs ai-agent -f --tail=100

# Logs de Evolution API
docker logs evolution_api -f --tail=50

# Enviar mensaje de prueba a Evolution API
curl -X POST https://eapi.cloudfly.com.co/message/sendText/cloudfly_t1_c1 \
  -H "Content-Type: application/json" \
  -H "apikey: CAMBIA_ESTA_LLAVE_LARGA_Y_UNICA" \
  -d '{"number": "57XXXXXXXXXX@s.whatsapp.net", "text": "🧪 Prueba desde VPS"}'

# Verificar webhook configurado en instancia
curl -X GET https://eapi.cloudfly.com.co/webhook/find/cloudfly_t1_c1 \
  -H "apikey: CAMBIA_ESTA_LLAVE_LARGA_Y_UNICA"

# Simular webhook entrante (prueba del chat-socket-service)
curl -X POST https://chat.cloudfly.com.co/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "cloudfly_t1_c1",
    "data": {
      "key": { "id": "TEST001", "remoteJid": "573000000000@s.whatsapp.net", "fromMe": false },
      "pushName": "Test Usuario",
      "message": { "conversation": "Hola, mensaje de prueba" }
    }
  }'
```
