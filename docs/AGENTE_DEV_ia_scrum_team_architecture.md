# AGENTE_DEV_ia_scrum_team_architecture.md

## 🏗️ Arquitectura del Servicio **/ia_scrum_team**

A continuación se muestra el diagrama actualizado (Mermaid) que refleja la estructura actual del micro‑servicio `ia‑scrum‑team` después de la revisión de la sprint.

```mermaid
graph TD
    subgraph "Contenedor IA‑Scrum‑Team"
        A[FastAPI (main.py)] --> B[agents.py]
        A --> C[hand-off.py]
        A --> D[tasks.py]
        B --> E[connector.py]
        C --> E
        D --> E
        E --> F[OpenAI / LLM]
        E --> G[Jira API]
        E --> H[Redis (redis_client.py)]
        E --> I[Kafka Consumer (kafka_consumer.py)]
    end
    subgraph "Infraestructura externa"
        F -->|HTTPS| OpenAI[(OpenAI Cloud)]
        G -->|HTTPS| Jira[(Jira Cloud)]
        H -->|TCP| Redis[(Redis Cluster)]
        I -->|TCP| Kafka[(Kafka Broker)]
    end
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:1px
    style C fill:#bbf,stroke:#333,stroke-width:1px
    style D fill:#bbf,stroke:#333,stroke-width:1px
    style E fill:#ddf,stroke:#333,stroke-width:1px
```

### Componentes clave
| Archivo | Responsabilidad |
|---------|-----------------|
| **main.py** | Punto de entrada FastAPI. Expone `/health` y los endpoints bajo `/ia_scrum_team/*`. Inicia workers de Kafka y Redis. |
| **agents.py** | Definición de los agentes Scrum, prompts y lógica de decisión. |
| **hand‑off.py** | Implementa el flujo **AI_HANDOFF**: valida payload, llama a LLM, decide si escalar a humano o a otro agente, maneja time‑outs y fallback. |
| **tasks.py** | Orquestación de tareas asíncronas, persistencia de estado en Redis. |
| **connector.py** | Wrappers de integración con OpenAI, Jira, Redis y Kafka. |
| **kafka_consumer.py** | Consumidor de eventos de backlog (solo se inicia si `KAFKA_BROKER` está definido). |
| **redis_client.py** | Cliente de Redis para caché y colas de mensajes. |

### Variables de entorno (actualizadas)
```
API_KEY=xxxxxxxxxxxx
OPENAI_API_KEY=sk-...
JIRA_TOKEN=xxxxxxxx
KAFKA_BROKER=kafka:9092
REDIS_URL=redis://redis:6379/0
```

> **Importante:** Si alguna de estas variables falta, el contenedor fallará al iniciar; la guía de instalación (AGENTE_DEV_Installation_Guide.md) incluye los pasos para configurarlas.

---

**✅ Diagrama y descripción completados**

*Generado por el agente técnico de documentación AI – CloudFly*