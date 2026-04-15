# 🤖 Arquitectura del AI Agent — Cloudfly

> Documentado con base en el código fuente de `/ai-agent/` verificado en producción.

---

## Diagrama de Arquitectura

```mermaid
graph TB
    %% ─── ENTRADAS ───────────────────────────────────────────────
    subgraph INPUT["📥 Entrada"]
        KIN["Kafka\ntopic: messages.in\ngroup: ai-agents"]
    end

    %% ─── CORE DEL AGENTE ────────────────────────────────────────
    subgraph AGENT["🤖 AI Agent (Python) — `ai_agent`"]
        direction TB

        CONSUMER["kafka_consumer.py\nMessageConsumer\nThreadPoolExecutor (10 workers)"]
        APP["app.py — AIAgentApp\nprocess_message()"]

        subgraph FLOW["Flujo de Procesamiento"]
            direction TB
            F1["1️⃣ Idempotency Check\nRedis: processed:{t}:{c}:{conv}:{ts}\nTTL: 1h"]
            F2["2️⃣ Load Memory\nRedis: chat:{t}:{c}:{conv}\nÚltimos 20 mensajes (LIFO)"]
            F3["3️⃣ Generate Response\nai_service.generate_response()"]
            F4["4️⃣ Save Memory\nRedis LPUSH user + assistant\nTTL: 24h"]
            F5["5️⃣ Publish Response\nKafka messages.out"]

            F1 --> F2 --> F3 --> F4 --> F5
        end

        CONSUMER --> APP --> FLOW
    end

    %% ─── AI SERVICE ─────────────────────────────────────────────
    subgraph AI_SERVICE["🧠 ai_service.py — AIService"]
        direction TB

        PROMPT["System Prompt\n+ Company Context\n+ Historial"]
        LLM["OpenAI GPT-4o\nchat.completions.create()\ntemperature=0.7, timeout=30s"]
        TOOL_ROUTER["Tool Router\nfunction_name dispatch"]

        subgraph TOOLS["🔧 Herramientas (Function Calling)"]
            direction LR
            T1["search_products\n_semantically\n🔍 Qdrant vector DB\nembedding: text-embedding-3-small\nfiltro: tenant_id"]
            T2["check_products\n_stock\n📦 backend-api REST\nGET /productos/stock/multiple"]
            T3["get_contact\n👤 MySQL\nSELECT contacts\npor phone o email"]
            T4["manage_contact\n✏️ MySQL\nINSERT / UPDATE\ncontacts"]
            T5["update_pipeline\n_stage\n🏷️ MySQL\nUPDATE contacts.stage_id\n+ conversation_pipeline_state"]
            T6["generate_pipeline\n_chart\n📊 MySQL → matplotlib\nPNG → /uploads/charts/\nURL pública"]
        end

        PROMPT --> LLM
        LLM -->|"tool_calls?"| TOOL_ROUTER
        TOOL_ROUTER --> T1 & T2 & T3 & T4 & T5 & T6
        T1 & T2 & T3 & T4 & T5 & T6 -->|"function results"| LLM
        LLM -->|"final content"| RESP["Texto de respuesta"]
    end

    %% ─── MEMORIA ─────────────────────────────────────────────────
    subgraph MEMORY["💾 redis_client.py — RedisMemoryClient"]
        R1["chat:{tenant}:{contact}:{conv}\nList (LIFO) — max 20 msgs\nTTL: 24h"]
        R2["processed:{t}:{c}:{conv}:{ts}\nIdempotency flag\nTTL: 1h"]
    end

    %% ─── SERVICIOS EXTERNOS ──────────────────────────────────────
    subgraph EXT["☁️ Servicios Externos"]
        OPENAI["OpenAI API\ngpt-4o\ntext-embedding-3-small"]
        QDRANT["Qdrant\n`qdrant`:6333\nCollection: products"]
        MYSQL["MySQL\n`mysql`:3306\ncloud_master"]
        BACKAPI["backend-api\nhttp://backend-api:8080\n/productos/stock/multiple"]
        UPLOADS["Volumen /app/uploads/charts/\nhttps://api.cloudfly.com.co\n/uploads/charts/*.png"]
    end

    %% ─── SALIDA ──────────────────────────────────────────────────
    subgraph OUTPUT["📤 Salida"]
        KOUT["Kafka\ntopic: messages.out"]
    end

    %% ─── WORKER VECTORIAL ────────────────────────────────────────
    subgraph VECTOR["🗂️ vector_worker.py — `ai_vector_worker`"]
        VW["Sincroniza productos\nMySQL → Qdrant\nGeneración de embeddings\npor tenant"]
    end

    %% ─── CONEXIONES ─────────────────────────────────────────────
    KIN --> CONSUMER
    F3 --> AI_SERVICE
    AI_SERVICE --> RESP

    APP <-->|"get/save memory\nidempotency"| MEMORY
    MEMORY <--> R1
    MEMORY <--> R2
    R1 & R2 <-->|"redis_server:6379"| EXT

    T1 <-->|"vector search"| QDRANT
    T2 <-->|"REST GET"| BACKAPI
    T3 & T4 & T5 & T6 <-->|"mysql.connector"| MYSQL
    T6 -->|"PNG file"| UPLOADS
    LLM <-->|"HTTPS"| OPENAI

    F5 --> KOUT

    MYSQL -.->|"sync periódico"| VECTOR
    VECTOR -.->|"upsert embeddings"| QDRANT

    %% ─── ESTILOS ─────────────────────────────────────────────────
    classDef kafka fill:#ff6b35,stroke:#e55a2b,color:#fff
    classDef redis fill:#dc382d,stroke:#c0281e,color:#fff
    classDef mysql fill:#4479a1,stroke:#336791,color:#fff
    classDef openai fill:#10a37f,stroke:#0d8a6b,color:#fff
    classDef qdrant fill:#7b2d8b,stroke:#6a1f7a,color:#fff
    classDef agent fill:#1e3a5f,stroke:#16304f,color:#fff
    classDef tool fill:#2d6a4f,stroke:#1b5e38,color:#fff
    classDef ext fill:#555,stroke:#444,color:#fff

    class KIN,KOUT kafka
    class R1,R2,MEMORY redis
    class MYSQL,T3,T4,T5,T6 mysql
    class LLM,OPENAI openai
    class QDRANT,T1 qdrant
    class CONSUMER,APP,FLOW,F1,F2,F3,F4,F5 agent
    class T2,BACKAPI ext
```

---

## Flujo Interno Detallado

```mermaid
sequenceDiagram
    autonumber
    participant K_IN as Kafka<br/>messages.in
    participant CONS as MessageConsumer<br/>(ThreadPool x10)
    participant APP as AIAgentApp<br/>process_message()
    participant REDIS as Redis<br/>RedisMemoryClient
    participant AI as AIService<br/>generate_response()
    participant GPT as OpenAI<br/>GPT-4o
    participant TOOLS as Herramientas<br/>(6 funciones)
    participant K_OUT as Kafka<br/>messages.out

    K_IN->>CONS: Mensaje { tenantId, contactId,<br/>conversationId, mensaje }
    CONS->>APP: executor.submit(process_message)

    APP->>REDIS: is_processed(t, c, conv, ts)
    alt Ya procesado
        REDIS-->>APP: True → skip (idempotencia)
    else Nuevo
        REDIS-->>APP: False → continuar

        APP->>REDIS: get_memory(t, c, conv)
        REDIS-->>APP: history[] (últimos 20 msgs)

        APP->>AI: generate_response(t, c, conv, msg, history)

        AI->>AI: get_company_context(t)<br/>@lru_cache(maxsize=128)
        AI->>GPT: chat.completions.create()<br/>model=gpt-4o, tools=[6 funciones]

        alt GPT decide usar herramienta
            GPT-->>AI: tool_calls[]
            loop Por cada tool_call
                AI->>TOOLS: dispatch(function_name, args)
                TOOLS-->>AI: JSON result
            end
            AI->>GPT: Segunda llamada con resultados
            GPT-->>AI: Respuesta final (texto)
        else Respuesta directa
            GPT-->>AI: Respuesta directa (texto)
        end

        AI-->>APP: response_text

        APP->>REDIS: save_message(user, msg)<br/>save_message(assistant, response)
        Note over REDIS: LPUSH → LTRIM(20)<br/>EXPIRE 24h

        APP->>K_OUT: send_response(t, c, conv, response)
    end
```

---

## Resumen de Componentes

| Archivo | Clase | Responsabilidad |
|---|---|---|
| `app.py` | `AIAgentApp` | Orquestador principal. Conecta consumer → proceso → producer |
| `kafka_consumer.py` | `MessageConsumer` | Lee `messages.in`, despacha a ThreadPoolExecutor (10 workers) |
| `kafka_producer.py` | `MessageProducer` | Publica respuesta en `messages.out` |
| `ai_service.py` | `AIService` | Prompt + OpenAI + 6 herramientas de Function Calling |
| `redis_client.py` | `RedisMemoryClient` | Memoria de conversación (lista LIFO) + idempotencia |
| `vector_worker.py` | *(standalone)* | Sincroniza productos MySQL → Qdrant (worker separado `ai_vector_worker`) |

---

## Herramientas — Detalle

| Herramienta | Backend | Input | Output |
|---|---|---|---|
| `search_products_semantically` | Qdrant + OpenAI embeddings | `query: str` | Lista de productos (payload vector) |
| `check_products_stock` | backend-api REST | `product_ids: int[]` | `[{id, stock, manageStock, inventoryStatus}]` |
| `get_contact` | MySQL `contacts` | `identifier: str` (phone/email) | Objeto contacto completo |
| `manage_contact` | MySQL `contacts` | `action: create/update`, campos opcionales | `{success, id/message}` |
| `update_pipeline_stage` | MySQL `contacts` + `conversation_pipeline_state` | `contact_id, stage_id` | `{success, message}` |
| `generate_pipeline_chart` | MySQL `pipeline_stages` → matplotlib | *(ninguno)* | `{success, chart_url}` PNG público |

---

## Memoria Redis — Estructura de Claves

```
chat:{tenant_id}:{contact_id}:{conversation_id}
  → List (LIFO) de JSON {role, content}
  → Max 20 elementos (LTRIM)
  → TTL: 24 horas

processed:{tenant_id}:{contact_id}:{conversation_id}:{timestamp}
  → String "1"
  → TTL: 1 hora (idempotencia)
```

---

## Configuración de Producción

| Variable | Valor Default | Descripción |
|---|---|---|
| `OPENAI_MODEL` | `gpt-4o` | Modelo LLM |
| `MAX_MEMORY_MESSAGES` | `20` | Mensajes en historial Redis |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Broker Kafka |
| `QDRANT_HOST` | `qdrant` | Vector DB host |
| `QDRANT_PORT` | `6333` | Vector DB port |
| `JAVA_API_URL` | `http://backend-api:8080` | REST API Java |
| `DB_NAME` | `cloud_master` | Base de datos MySQL |
