# 📱 Flujo de Mensajes WhatsApp — Cloudfly

> Diagrama verificado en producción el 2026-04-14 via pruebas E2E en VPS.

---

## Arquitectura General

```
WhatsApp ↔ Evolution API ──webhook──► chat-socket-service ──Socket.IO──► Frontend (Next.js)
                                              │
                                    (chatbot_enabled=true)
                                              │
                                       Kafka messages.in
                                              │
                                         AI Agent (Python)
                                              │ OpenAI API
                                       Kafka messages.out
                                              │
                                    chat-socket-service
                                         ├─ Evolution API ──► WhatsApp
                                         └─ Socket.IO ──────► Frontend
```

---

## Diagrama de Secuencia — Mensaje ENTRANTE (Inbound)

```mermaid
sequenceDiagram
    autonumber

    actor User as 📱 Usuario WhatsApp
    participant EvoAPI as Evolution API<br/>`evolution_api`<br/>eapi.cloudfly.com.co
    participant ChatSocket as Chat Socket Service<br/>`chat_socket`<br/>chat.cloudfly.com.co:3001
    participant DB as MySQL<br/>`mysql`<br/>cloud_master
    participant FE as Frontend Next.js<br/>`frontend-react`<br/>dashboard.cloudfly.com.co
    participant Kafka as Kafka<br/>`kafka:9092`<br/>topic: messages.in
    participant AIAgent as AI Agent<br/>`ai_agent` (Python)
    participant OpenAI as OpenAI API

    User->>EvoAPI: Envía mensaje WhatsApp

    Note over EvoAPI,ChatSocket: Webhook configurado en Evolution API:<br/>POST https://chat.cloudfly.com.co/webhook/evolution

    EvoAPI->>ChatSocket: POST /webhook/evolution<br/>{ event: "messages.upsert",<br/>  instance: "cloudfly_t1_c1",<br/>  data: { key, pushName, message } }

    ChatSocket-->>EvoAPI: 200 OK (responde inmediato,<br/>procesa en background)

    Note over ChatSocket: Normaliza evento → MESSAGES_UPSERT<br/>Ignora CONNECTION_UPDATE, etc.

    ChatSocket->>DB: SELECT id, tenant_id, company_id<br/>FROM channels<br/>WHERE instance_name = 'cloudfly_t1_c1'
    DB-->>ChatSocket: channel { id:1, tenant_id:1, company_id:1 }

    ChatSocket->>DB: SELECT * FROM contacts<br/>WHERE phone = '573246285134'<br/>AND tenant_id = 1
    alt Contacto existe
        DB-->>ChatSocket: contact { id:19, uuid, name, phone }
    else Contacto nuevo
        ChatSocket->>DB: INSERT INTO contacts<br/>(uuid, name, phone, type='LEAD',<br/> stage='LEAD', tenant_id, company_id)
        DB-->>ChatSocket: nuevo contact con UUID
    end

    ChatSocket->>DB: getOrCreateConversationId()<br/>Busca conversación activa < 30 min<br/>Si no, crea nueva (UUID)
    DB-->>ChatSocket: conversation_id (UUID)

    ChatSocket->>DB: INSERT INTO omni_channel_messages<br/>(tenant_id, channel_id, contact_id,<br/> direction='INBOUND', content,<br/> status='RECEIVED', conversation_id)
    DB-->>ChatSocket: message_id (ej: 149)

    ChatSocket->>DB: SELECT últimos 10 mensajes<br/>del contacto (para history)
    DB-->>ChatSocket: history[]

    ChatSocket->>FE: io.emit('new-message', payload)<br/>room: tenant_1_contact_573246285134
    Note over FE: 🖥️ Chat UI actualiza en tiempo real<br/>via Socket.IO

    ChatSocket->>DB: SELECT chatbot_enabled<br/>FROM contacts WHERE id = 19
    DB-->>ChatSocket: chatbot_enabled = true

    alt chatbot_enabled = true
        Note over ChatSocket: Buffer de 1s (debounce)<br/>concatena mensajes rápidos del usuario

        ChatSocket->>Kafka: publishToKafka(messages.in)<br/>key: "1:19:3bdd151e-..."<br/>{ tenantId:1, companyId:1, contactId:19,<br/>  conversationId, mensaje, timestamp }

        Kafka->>AIAgent: Consume mensaje del topic messages.in

        AIAgent->>DB: Consulta historial, contexto,<br/>productos, contactos (tools)
        AIAgent->>OpenAI: POST /v1/chat/completions
        OpenAI-->>AIAgent: HTTP 200 — respuesta generada

        AIAgent->>Kafka: Publica en messages.out<br/>{ tenantId, contactId,<br/>  conversationId, respuesta }

        Kafka->>ChatSocket: Consume respuesta del topic messages.out

        ChatSocket->>DB: INSERT INTO omni_channel_messages<br/>(direction='OUTBOUND', content=respuesta,<br/> status='SENT', conversation_id)

        ChatSocket->>EvoAPI: POST /message/sendText/cloudfly_t1_c1<br/>{ number: "573246285134@s.whatsapp.net",<br/>  text: respuesta,<br/>  options: { delay:1200, presence:'composing' } }
        EvoAPI->>User: ✅ Respuesta entregada por WhatsApp

        ChatSocket->>FE: io.emit('new-message')<br/>{ direction:'OUTBOUND', content, conversationId }

    else chatbot_enabled = false (modo humano)
        Note over ChatSocket: ⏸️ Solo Socket.IO al frontend<br/>Sin Kafka ni AI Agent<br/>Agente humano responde manualmente
    end
```

---

## Diagrama de Secuencia — Mensaje SALIENTE (Outbound humano)

```mermaid
sequenceDiagram
    autonumber

    actor Agent as 👤 Agente Humano
    participant FE as Frontend Next.js<br/>dashboard.cloudfly.com.co
    participant ChatSocket as Chat Socket Service<br/>`chat_socket`:3001
    participant DB as MySQL `mysql`<br/>cloud_master
    participant EvoAPI as Evolution API<br/>`evolution_api`
    participant User as 📱 Usuario WhatsApp

    Agent->>FE: Escribe mensaje en Chat UI y envía
    FE->>ChatSocket: Socket.IO emit('send-message')<br/>{ tenantId, contactPhone, content }

    ChatSocket->>DB: SELECT * FROM channels<br/>WHERE tenant_id=1 AND platform='WHATSAPP'<br/>AND status=1 LIMIT 1
    DB-->>ChatSocket: channel { instance_name: 'cloudfly_t1_c1' }

    ChatSocket->>DB: INSERT INTO omni_channel_messages<br/>(direction='OUTBOUND', status='SENT')
    DB-->>ChatSocket: message_id

    ChatSocket->>EvoAPI: POST /message/sendText/cloudfly_t1_c1<br/>{ number: "573XXXXXXXXX@s.whatsapp.net", text }
    EvoAPI->>User: ✅ Mensaje entregado por WhatsApp
    EvoAPI-->>ChatSocket: 200 OK

    ChatSocket->>FE: Socket.IO emit('message-sent')<br/>{ message_id, status: 'SENT' }
```

---

## Infraestructura — Contenedores y Redes

| Contenedor | Imagen | Dominio Público | Red(es) Docker |
|---|---|---|---|
| `evolution_api` | evoapicloud/evolution-api | `eapi.cloudfly.com.co` | `cloudfly_app-net` |
| `chat_socket` | cloudfly-chat-socket-service | `chat.cloudfly.com.co` | `cloudfly_app-net` + `cloudfly_kafka-net` |
| `frontend-react` | cloudfly-frontend | `dashboard.cloudfly.com.co` | `cloudfly_app-net` |
| `backend-api` | cloudfly-backend-api | `api.cloudfly.com.co` | `cloudfly_app-net` + `cloudfly_kafka-net` |
| `ai_agent` | cloudfly-ai-agent | *(interno)* | `cloudfly_app-net` + `cloudfly_kafka-net` |
| `kafka` | confluentinc/cp-kafka:7.4.0 | *(interno)* | `cloudfly_kafka-net` |
| `mysql` | mysql:8.0 | *(interno)* | `cloudfly_app-net` + `cloudfly_kafka-net` |
| `redis_server` | redis:latest | *(interno)* | `cloudfly_app-net` |
| `qdrant` | qdrant/qdrant | *(interno)*:6333 | `cloudfly_app-net` |
| `traefik` | traefik:v2.11 | *(proxy inverso)* | `cloudfly_app-net` |

---

## Tópicos Kafka

| Tópico | Dirección | Publicado por | Consumido por |
|---|---|---|---|
| `messages.in` | ➡️ Entrada al AI | `chat_socket` (kafkajs) | `ai_agent` (confluent-kafka Python) |
| `messages.out` | ⬅️ Salida del AI | `ai_agent` | `chat_socket` |

---

## Instancias WhatsApp Activas

| Instancia Evolution | Estado | Número | Tenant/Company |
|---|---|---|---|
| `cloudfly_t1_c1` | ✅ open | 573246285134 (Pixelweb) | tenant_id=1, company_id=1 |

> ⚠️ La tabla `channels` en `cloud_master` debe tener `instance_name = 'cloudfly_t1_c1'`
> para que el webhook sea procesado correctamente.

---

## Base de Datos — Tablas Involucradas (cloud_master)

```sql
-- Canal WhatsApp del tenant
channels (id, tenant_id, company_id, instance_name, platform, status)

-- Contactos
contacts (id, uuid, name, phone, type, stage, chatbot_enabled,
          tenant_id, company_id, created_at)

-- Mensajes del canal omnicanal
omni_channel_messages (id, tenant_id, channel_id, contact_id,
                        direction, content, status,
                        conversation_id, external_msg_id, created_at)
```

---

## Orden de Arranque (docker-compose-full.yml)

```
zookeeper → kafka → [mysql, redis] → chat_socket
                                   → ai_agent
                                   → ai_vector_worker
                                   → backend-api
```

> `chat_socket` tiene `depends_on: [kafka, redis, db]` para evitar fallos
> de conexión a Kafka en cold start.

---

## Comandos de Diagnóstico en VPS

```bash
# --- Logs en tiempo real ---
docker logs chat_socket -f --tail=50       # Webhook + Socket.IO + Kafka producer
docker logs ai_agent -f --tail=50          # Kafka consumer + LLM + respuesta
docker logs evolution_api -f --tail=30     # Conexión WhatsApp

# --- Prueba de mensaje entrante (simula Evolution API) ---
cat > /tmp/test_webhook.py << 'EOF'
import urllib.request, json
payload = json.dumps({
    'event': 'messages.upsert',
    'instance': 'cloudfly_t1_c1',
    'data': {
        'key': {'id': 'TEST_001', 'remoteJid': '573XXXXXXXXX@s.whatsapp.net', 'fromMe': False},
        'pushName': 'Test Usuario',
        'message': {'conversation': 'Hola, mensaje de prueba'}
    }
}).encode()
req = urllib.request.Request(
    'http://172.18.0.2:3001/webhook/evolution',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
r = urllib.request.urlopen(req, timeout=5)
print('STATUS:', r.status, r.read())
EOF
python3 /tmp/test_webhook.py

# --- Verificar canal en DB ---
docker exec mysql mysql -uroot -pwidowmaker cloud_master \
  -e "SELECT id, tenant_id, instance_name, status FROM channels;"

# --- Verificar mensajes recientes ---
docker exec mysql mysql -uroot -pwidowmaker cloud_master \
  -e "SELECT id, direction, content, created_at FROM omni_channel_messages ORDER BY id DESC LIMIT 10;"
```

---

## Issues Encontrados y Resueltos (2026-04-14)

| Issue | Causa | Solución |
|---|---|---|
| `No channel found for instance: cloudfly_t1_c1` | `channels.instance_name` tenía valor `cloudfly_manager` | UPDATE a `cloudfly_t1_c1` en `cloud_master` |
| `[KAFKA] ECONNREFUSED` al arrancar | `chat_socket` iniciaba antes que Kafka | `depends_on: [kafka, redis, db]` en `docker-compose-full.yml` |
| `chat_socket` en red incorrecta | Solo estaba en `app-net` en `docker-compose.apps.yml` | Corregido en `docker-compose-full.yml` que ya tenía ambas redes |
