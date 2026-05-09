# 🚀 CloudFly AI: Plataforma de CRM y Automatización

CloudFly es una solución integral "All-in-One" diseñada para la gestión comercial impulsada por Inteligencia Artificial, centralizando la comunicación multicanal, la gestión de pedidos y la automatización de procesos en una infraestructura escalable de microservicios.

## 🏗️ Arquitectura del Sistema

### Núcleo de Aplicación (Core)
*   **Backend API (`Java/Spring Boot`):** Motor reactivo (R2DBC) para lógica de negocio y persistencia.
*   **Frontend Dashboard (`Next.js/React`):** Interfaz de usuario moderna y responsiva.
*   **Scheduler Service (`Spring Boot`):** Gestión de calendarios y citas en tiempo real.
*   **Evolution API:** Integración con WhatsApp.

### Inteligencia Artificial
*   **AI Agent (`Python/OpenAI`):** Agente autónomo para cierre de ventas y atención al cliente.
*   **Qdrant & PGVector:** Bases de datos vectoriales para memoria semántica.

## 🛠️ Infraestructura y Despliegue

La plataforma está diseñada para ser desplegada mediante Docker Compose en entornos VPS.

### Comandos de Despliegue Rápido
```bash
# Sincronizar repositorio
git pull origin main

# Reconstruir servicios principales
docker compose -f docker-compose-full-vps.yml up -d --build backend-api ai-agent
```

## 📋 Ficha Técnica (Resumen de Servicios)

| Servicio | Tecnología | Dominio / Endpoint |
| :--- | :--- | :--- |
| **Dashboard** | Next.js | `dashboard.cloudfly.com.co` |
| **Backend API** | Java 17 | `api.cloudfly.com.co` |
| **WhatsApp API** | Evolution API | `eapi.cloudfly.com.co` |
| **Calendario** | Spring Boot | `calendar.cloudfly.com.co` |
| **Automatización**| n8n | `autobot.cloudfly.com.co` |
| **Chat Sockets** | Node.js | `chat.cloudfly.com.co` |

### Capas de Datos
*   **Transaccional:** MySQL 8.0
*   **Eventos:** Apache Kafka
*   **Caché:** Redis
*   **Vectores:** Qdrant & PostgreSQL (pgvector)

## 📊 Diagrama de Arquitectura Integral

```mermaid
graph TD
    subgraph "External Access & Security"
        Internet((Internet)) --> CF[Cloudflare / DNS]
        CF --> Traefik[Traefik v3.1 Reverse Proxy]
        Traefik -- "SSL/TLS (Let's Encrypt)" --- Auth[NextAuth.js]
    end

    subgraph "Frontend Layer"
        Traefik --> FE_Prod[Next.js Dashboard - Prod]
        Traefik --> FE_Dev[Next.js Dashboard - Dev]
    end

    subgraph "Application Logic (Microservices)"
        Traefik --> API[Backend API - Spring WebFlux]
        Traefik --> Sched[Scheduler Service]
        Traefik --> Socket[Chat Socket Service]
        
        API --> Notif[Notification Service]
        API --> Lead[Lead Generator - Apify]
        API --> Mkt[Marketing Worker]
        API --> DIAN[DIAN Invoicing Service]
    end

    subgraph "AI & Vector Engine"
        API <--> AI_Agent[AI Agent - LLM Logic]
        AI_Agent --> Qdrant[(Qdrant Vector DB)]
        AI_Agent --> Worker[AI Vector Worker]
        Worker --> Postgres[(PostgreSQL + pgvector)]
    end

    subgraph "Integrations & Automation"
        Traefik --> Evo[Evolution API - WhatsApp]
        Traefik --> n8n[n8n Workflows]
        Evo <--> API
    end

    subgraph "Messaging & Data Backbone"
        direction LR
        Kafka{Kafka Message Bus}
        Redis[(Redis Cache / Session)]
        MySQL[(MySQL 8.0 - Master Tenant DB)]
        
        API & Notif & AI_Agent & Mkt <--> Kafka
    end

    subgraph "Observability Stack (Observer)"
        Traefik --> Grafana[Grafana Dashboards]
        Grafana --> Prom[Prometheus Server]
        
        Prom --> cAdv[cAdvisor - Docker Stats]
        Prom --> NodeExp[Node Exporter - Host VPS]
        Prom --> K_Exp[Kafka Exporter]
        Prom --> DB_Exp[DB Exporters - MySQL/PG/Redis]
        Prom --> Actuator[Spring Actuator - JVM Metrics]
    end

    subgraph "Management & DevOps"
        Traefik --> Portainer[Portainer - Container Mgmt]
        Traefik --> PMA[phpMyAdmin]
        Traefik --> Kafdrop[Kafdrop - Kafka UI]
        Traefik --> RedisInsight[Redis Insight]
    end

    %% Key Relationships
    API -- "Multi-Tenant Filter" --> MySQL
    API -- "Event Driven" --> Kafka
    Socket -- "Real-time" --> Redis
```

---
© 2026 CloudFly AI - Soluciones de Automatización Inteligente.
