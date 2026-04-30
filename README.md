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

## 📊 Diagrama de Arquitectura

```mermaid
graph TB
    subgraph Clientes ["Capa de Cliente"]
        Browser["🌐 Navegador Web (Next.js)"]
        Mobile["📱 App Móvil (Expo/React Native)"]
        WhatsApp["💬 WhatsApp (Usuario)"]
    end

    subgraph Gateway ["Puerta de Enlace (Traefik)"]
        SSL["🔒 Traefik (Proxy & SSL)"]
    end

    subgraph Services ["Capa de Microservicios"]
        Backend["☕ Backend API (Java/Spring Boot)"]
        Scheduler["📅 Scheduler Service (Calendar)"]
        Socket["🔌 Chat Socket (Node.js)"]
        AI["🤖 AI Agent (Python/OpenAI)"]
        Vector["⚙️ AI Vector Worker"]
        Notif["🔔 Notification Service"]
        Evolution["📞 Evolution API (WhatsApp)"]
    end

    subgraph Messaging ["Mensajería y Eventos"]
        Kafka[("📨 Apache Kafka")]
    end

    subgraph Persistence ["Capa de Datos"]
        MySQL[("🗄️ MySQL 8.0 (CRM/Orders)")]
        Redis[("⚡ Redis (Cache/Sessions)")]
        Qdrant[("🧠 Qdrant (Vector DB)")]
        Postgres[("🐘 PostgreSQL (Vector Storage)")]
    end

    %% Flujos de conexión
    Browser & Mobile <--> SSL
    SSL <--> Backend & Scheduler & Socket & Evolution
    
    %% Comunicación Interna
    Backend & Scheduler & AI & Notif & Vector <--> Kafka
    Socket <--> Redis & Kafka
    
    %% Persistencia
    Backend & Scheduler & Notif <--> MySQL
    Evolution <--> Redis
    AI & Vector <--> Qdrant & Postgres & Backend
    WhatsApp <--> Evolution

    style Kafka fill:#f96,stroke:#333,stroke-width:2px
    style AI fill:#00ff00,stroke:#333,stroke-width:2px
    style Backend fill:#6366F1,stroke:#333,stroke-width:2px
    style SSL fill:#fff,stroke:#333,stroke-dasharray: 5 5
```

---
© 2026 CloudFly AI - Soluciones de Automatización Inteligente.
