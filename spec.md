# CloudFly AI - Especificación Técnica

## Visión General
CloudFly AI es una plataforma SaaS de automatización empresarial todo-en-uno diseñada para empoderar a las empresas con IA-driven automation. Centraliza multi-canal communication, sales pipelines, intelligent customer engagement, y back-office operations en un ecosistema digital unificado.

### Capacidades Principales
- **CRM & Ventas**: Pipelines visuales Kanban, gestión de órdenes, presupuestos, facturación
- **Marketing Automatizado**: Campañas multi-canal (WhatsApp, Facebook Messenger), segmentación inteligente de audiencias, analítica en tiempo real
- **Motor de IA Conversacional**: Chatbots personalizables, agentes de IA autónomos para calificación de leads, cierre de ventas y soporte al cliente
- **Agenda & Calendario**: Reserva de citas en tiempo real y sincronización de calendario
- **SaaS Multi-tenant**: Modelo de aislamiento jerárquico de datos tenant/company
- **POS (Point of Sale)**: Aplicación de escritorio basada en Java
- **Integración DIAN**: Facturación electrónica para la autoridad tributaria colombiana
- **Nómina & Contabilidad**: Nómina electrónica colombiana completa, libro mayor, balance general

## Arquitectura del Sistema

### Stack Tecnológico

#### Backend Principal (API)
| Tecnología | Detalles |
|---|---|
| **Lenguaje** | Java 17 |
| **Framework** | Spring Boot 3.4.0 con **WebFlux** (reactive/no-blocking) |
| **Acceso a BD** | Spring Data R2DBC (reactive) para MySQL |
| **Herramienta de Build** | Maven (pom.xml) |
| **Autenticación** | JWT (custom `JwtProvider`, `JwtAuthenticationFilter`) |
| **Validación** | Spring Boot Starter Validation |
| **Lombok** | Sí (reducción de boilerplate) |

#### Frontend (Dashboard)
| Tecnología | Detalles |
|---|---|
| **Framework** | Next.js 14.2.5 (App Router) |
| **Lenguaje** | TypeScript 5.5.4 |
| **Librería UI** | MUI (Material UI) v6, Emotion styled components |
| **Gestión de Estado** | Redux Toolkit + Redux |
| **Estilos** | TailwindCSS 3.4.6, PostCSS |
| **Gráficos** | ApexCharts, Recharts |
| **Formularios** | React Hook Form, Formik, Yup/Valibot validation |
| **Tablas** | TanStack React Table |
| **Auth** | NextAuth.js 4.24.7 |
| **Tiempo Real** | Socket.IO client |
| **Editor Enriquecido** | Tiptap editor |
| **Calendario** | FullCalendar |
| **Mapas** | Mapbox GL |
| **Drag & Drop** | FormKit drag-and-drop, React DnD |
| **PDF** | jsPDF, html2pdf, react-pdf-tailwind |
| **Gestor de Paquetes** | npm (con pnpm-lock para algunos sub-proyectos) |

#### Mobile App
| Tecnología | Detalles |
|---|---|
| **Framework** | React Native con **Expo** (v54) |
| **Navegación** | Expo Router, React Navigation (tabs, drawer) |
| **Estilos** | NativeWind (Tailwind para React Native) |
| **UI** | React Native Paper (Material Design) |
| **Estado** | Redux Toolkit |
| **Tiempo Real** | Socket.IO client |
| **HTTP** | Axios |

#### IA / Machine Learning
| Componente | Tecnología |
|---|---|
| **Agente de IA** | Python, OpenAI API (`gpt-4o-mini`), Groq, OpenRouter (pool multi-LLM) |
| **Base de Datos Vectorial** | Qdrant + PostgreSQL con pgvector |
| **Memoria Semántica** | Cliente Qdrant, Chroma/HuggingFace |
| **Cola de Mensajes** | Apache Kafka (event bus para comunicación de IA) |
| **Tipos de Agentes IA** | Agente de ventas, agente de soporte, trabajador vectorial |
| **Marketing IA** | Equipo de marketing basado en Python con agentes estilo CrewAI |

#### Comunicación en Tiempo Real
| Componente | Tecnología |
|---|---|
| **Servicio de Socket Chat** | Node.js, Socket.IO, Express, Redis, KafkaJS, MySQL |
| **WhatsApp** | Evolution API (integración empresarial WhatsApp, Node.js/TypeScript) |
| **Chatwoot** | Plataforma completa de engagement al cliente Ruby on Rails (incluido como submódulo) |

#### Infraestructura y DevOps
| Tecnología | Detalles |
|---|---|
| **Containerización** | Docker, Docker Compose (múltiples archivos compose) |
| **Proxy Inverso** | Traefik v3.6.7 (con SSL automático vía Let's Encrypt) |
| **Orquestación** | Docker Compose (despliegue completo VPS con `docker-compose-full-vps.yml`) |
| **Monitoreo** | Prometheus + Grafana (en monitoring/) |
| **Secretos** | Archivos `.env` para configuración |

#### Bases de Datos
| Base de Datos | Propósito |
|---|---|
| **MySQL 8.0** | Base de datos maestra multi-tenant principal (`cloud_master`) |
| **PostgreSQL 15** | Datos de chatbot/vector (con extensión pgvector) |
| **Redis** | Caché, gestión de sesiones, pub/sub en tiempo real |
| **Qdrant** | Base de datos vectorial para memoria semántica de IA |

#### Bus de Eventos
- **Apache Kafka** (Confluent CP 7.4.0) -- espina dorsal de comunicación asíncrona entre microservicios

#### Microservicios Adicionales
| Servicio | Lenguaje/Framework | Propósito |
|---|---|---|
| **Servicio de Facturación** | Go 1.21 (Fiber, Kafka-go) | Procesamiento de pagos con integración Wompi |
| **Servicio de Scheduler** | Java 17 / Spring WebFlux | Calendario & programación de citas |
| **Servicio de Notificaciones** | Java 17 / Spring Boot | Notificaciones por email & push |
| **Marketing Worker** | Java 17 / Spring Boot | Ejecución de campañas de marketing |
| **Servicio de Backup** | PHP (Cliente API de Google) | Operaciones de backup |
| **Servicio DIAN** | Java (Maven multi-módulo) | Facturación electrónica colombiana |
| **Agente de Marketing** | Python | Marketing autónomo de Facebook/Ads |
| **Generador de Leads** | Python | Rasgado automatizado de leads (Apify) |
| **Rasgador de Leads** | Python | Rasgado de leads de Google/negocios locales |
| **Agentes Conversacionales** | Python | Bots de Facebook Messenger |

## Estructura del Proyecto

```
C:\apps\cloudfly\
├── .env                          # Configuración global de entorno
├── .env.local, .env.production, .env.vps  # Sobrescrituras de entorno
├── README.md                     # Documentación principal del proyecto
├── CLOUD_SAAS_ARCHITECTURE.md    # Arquitectura de datos multi-tenant
├── package.json                  # Paquete raíz (utilidades Node.js)
├── docker-compose.yml            # Compose mínimo (scraper)
├── docker-compose-full.yml       # Compose completo de producción
├── docker-compose-full-vps.yml   # Compose para despliegue en VPS (principal)
├── docker-compose-local.yml      # Compose para desarrollo local
├── docker-compose-monitoring.yml # Compose para stack de monitoreo
├── Dockerfile                    # Dockerfile raíz
├── traefik/                      # Configuración del proxy inverso Traefik
│   ├── traefik.yml               # Configuración estática (SSL, entrypoints)
│   └── dynamic_conf.yml
│
├── backend/                      # BACKEND ORIGINAL (Spring Boot 3.4, JPA, servlet)
│   ├── pom.xml                   # Maven con Spring Boot 3.4.0
│   ├── src/main/java/com/app/starter1/
│   └── src/main/java/co/cloudfly/erp/dian/  # DIAN electronic invoicing
│
├── backend_new/                  # BACKEND NUEVO/ACTUAL (Spring Boot 3.4, WebFlux, R2DBC)
│   ├── pom.xml                   # Stack reactivo
│   └── src/main/java/com/app/
│       ├── controllers/          # Controladores REST
│       ├── services/             # Lógica de negocio
│       ├── persistence/services/ # Capa de persistencia de datos
│       ├── config/               # Config Web, R2DBC, Kafka, JWT, CORS
│       ├── events/               # Productores de eventos Kafka
│       ├── util/                 # JWT, etc.
│       └── dto/                  # Objetos de transferencia de datos
│
├── frontend/                     # FRONTEND ORIGINAL (Next.js 14)
│   ├── package.json
│   ├── src/
│   │   ├── app/                  # Páginas del App Router de Next.js
│   │   ├── views/                # Vistas de rutas (apps, dashboards, pages, settings)
│   │   ├── components/           # Componentes reutilizables
│   │   ├── @core/                # Marco de UI central
│   │   ├── @layouts/             # Componentes de layout
│   │   ├── @menu/                # Componentes de menú
│   │   ├── redux-store/          # Gestión de estado Redux
│   │   ├── services/             # Capa de servicio API
│   │   ├── hooks/                # Hooks personalizados
│   │   ├── utils/                # Funciones de utilidad
│   │   ├── configs/              # Configuración de la aplicación
│   │   └── types/                # Tipos de TypeScript
│   └── public/                   # Assets estáticos
│
├── frontend_new/                 # FRONTEND NUEVO/ACTUAL (Next.js 14)
│   ├── package.json
│   └── src/
│       ├── views/                # Organizado por módulo:
│       │   ├── dashboard/        #   Vistas de dashboard
│       │   ├── apps/             #   Módulos de aplicaciones
│       │   ├── ventas/           #   Módulo de ventas
│       │   ├── marketing/        #   Módulo de marketing
│       │   ├── administracion/   #   Módulo de administración
│       │   ├── automation/       #   Módulo de automatización
│       │   └── pages/            #   Páginas estáticas
│       ├── redux/                # Gestión de estado Redux
│       ├── services/             # Capa de servicio API
│       └── ... (similar layout to frontend/)
│
├── mobile/                       # App móvil React Native / Expo
│   ├── app/                      # Páginas de Expo Router
│   └── src/                      # Componentes, hooks, etc.
│
├── ai-agent/                     # Servicio de Agente de IA Python
│   ├── agents/
│   │   ├── sales_agent.py        # IA de ventas y calificación de leads
│   │   └── support_agent.py      # IA de soporte al cliente
│   ├── domain/                   # Modelos de dominio
│   ├── infrastructure/           # Adaptadores de DB, Redis, Kafka
│   ├── application/              # Lógica de aplicación
│   ├── app.py                    # Aplicación principal del agente
│   ├── vector_worker.py          # Trabajador de embeddings vectoriales
│   ├── kafka_consumer.py         # Consumidor de eventos Kafka
│   ├── kafka_producer.py         # Productor de eventos Kafka
│   ├── redis_client.py           # Cliente Redis para caché
│   └── requirements.txt          # Dependencias de Python (OpenAI, Qdrant, Kafka, etc.)
│
├── chat-socket-service/          # Servicio de chat en tiempo real Node.js
│   ├── src/
│   └── package.json              # Socket.IO, Express, KafkaJS, Redis
│
├── billing-service/              # Microservicio de facturación Go
│   ├── cmd/                      # Punto de entrada principal
│   ├── internal/                 # Lógica de negocio
│   ├── pkg/                      # Paquetes compartidos
│   ├── go.mod                    # Go 1.21, Fiber, Kafka, Resty
│   └── Dockerfile
│
├── scheduler_service/            # Servicio Java Spring Boot scheduler
│   ├── pom.xml                   # WebFlux + R2DBC
│   └── src/main/resources/application.yml
│
├── notifications/                # Servicio Java Spring Boot de notificaciones
│   ├── pom.xml                   # Spring Mail, Kafka
│   └── src/
│
├── marketing-worker/             # Servicio Java Spring Boot de marketing worker
│   ├── pom.xml
│   └── src/
│
├── marketing_agent/              # Agente de marketing autónomo Python
│   ├── main.py
│   ├── facebook_client.py        # Integración API de Facebook Ads
│   ├── ai_ad_service.py          # Gestión de anuncios impulsada por IA
│   └── models/
│
├── marketing_team_ai/            # Equipo de marketing multi-agente Python (estilo CrewAI)
│   ├── agents/                   # Agentes de marketing individuales
│   ├── crews/                    # Equipos de agentes
│   ├── flows/                    # Flujos de trabajo
│   ├── kafka/                    # Integración Kafka
│   └── services/                 # Servicios compartidos
│
├── lead-generator/               # Servicio de generación de leads Python
│   ├── app/
│   └── requirements.txt
│
├── lead-scrapper-google/         # Rasgador de leads de Google Python
│   ├── Dockerfile
│   └── ...
│
├── evolution-api/                # WhatsApp Evolution API (Node.js/TypeScript)
│   ├── src/
│   ├── prisma/                   # ORM Prisma (PostgreSQL/MySQL)
│   └── package.json
│
├── chatwoot/                     # Plataforma completa Chatwoot engagement al cliente (Ruby on Rails)
│   ├── app/                      # App de Rails
│   ├── Gemfile                   # Dependencias de Ruby
│   └── ...
│
├── cloudfly-dian-service/        # Servicio DIAN de facturación electrónica colombiana (Java multi-módulo)
│   ├── dian-common/              # Biblioteca DIAN compartida
│   ├── dian-core/                # Servicio DIAN principal
│   └── pom.xml
│
├── cloudfly-landing-repo/        # Página de aterrizaje (Vite + TypeScript)
│   ├── src/
│   ├── vite.config.ts
│   └── wrangler.jsonc            # Configuración de Cloudflare Workers
│
├── POS/                          # Aplicación de escritorio Java POS
│   ├── pom.xml                   # JavaFX
│   └── src/main/resources/fxml/  # Layouts FXML (pantallas de POS)
│
├── pos-python/                   # Alternativa de POS Python
│
├── backup-service/               # Servicio de backup PHP (API de Google)
│   ├── public/
│   └── composer.json             # Dependencias PHP (Cliente API de Google, Guzzle)
│
├── n8n/                          # Configuración de automatización de workflows n8n
├── terraform/                    # Infraestructura como Código
├── monitoring/                   # Stack de monitoreo Prometheus + Grafana
├── scripts/                      # Scripts de utilidad
├── tests/                        # Archivos de prueba
├── docs/                         # Documentación
├── certs/                        # Certificados SSL
└── developmentAI/                # Configuraciones de desarrollo VoIP/IA FreeSWITCH

## Despliegue en Producción

El archivo principal para despliegue en producción es `docker-compose-full-vps.yml`.

### Despliegue en Ambiente Local

Para desarrollo local, se debe crear un archivo `docker-compose-full-local.yml` basado en `docker-compose-full-vps.yml` con las siguientes diferencias:

#### Diferencias clave respecto a la versión VPS:

1. **Sin Traefik**: No se necesita proxy inverso ni SSL en ambiente local. Se elimina completamente el servicio `traefik` y todas sus dependencias (certificados, configuración dinámica, entrypoints SSL).

2. **Acceso directo por puerto**: Cada servicio expone su puerto directamente sin pasar por Traefik:
   - `backend-api` → puerto `8080`
   - `frontend` → puerto `3000`
   - `evolution-api` → puerto `8081`
   - `chat-socket-service` → puerto `3001`
   - `qdrant` → puerto `6333`
   - `redis` → puerto `6379`
   - `postgres` → puerto `5432`
   - `mysql` → puerto `3306`
   - `kafka` → puerto `9092`

3. **Sin redes internas de Traefik**: Se simplifican las redes, eliminando las configuraciones de `traefik-public` y usando solo `default`, `kafka-net` y `app-net`.

4. **Sin volúmenes de certificados**: Se eliminan los montajes de `./certs` y configuración de Let's Encrypt.

5. **Perfiles de Spring en desarrollo**: Los servicios Java usan `SPRING_PROFILES_ACTIVE=development` en lugar de `production`.

6. **Sin restricciones de recursos**: Se eliminan los `deploy.resources.limits` ya que en local no son necesarios.

#### Estructura del archivo:

```yaml
# docker-compose-full-local.yml
# Basado en docker-compose-full-vps.yml
# Diferencias: Sin Traefik, acceso directo por puerto, perfil development

services:
  db:
    # ... (igual que VPS)
    
  backend-api:
    # ... (igual que VPS pero con:)
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=development
    # Sin labels de Traefik
    
  frontend:
    # ... (igual que VPS pero con:)
    ports:
      - "3000:3000"
    # Sin labels de Traefik
    
  evolution-api:
    # ... (igual que VPS pero con:)
    ports:
      - "8081:8080"
    # Sin labels de Traefik
    
  # ... (resto de servicios sin Traefik)
  
  # NO incluir servicio traefik
  # NO incluir volúmenes de certs
  # NO incluir red traefik-public
```

#### Comandos para desarrollo local:

```bash
# Iniciar todo el stack local
docker-compose -f docker-compose-full-local.yml up -d

# Ver logs de un servicio específico
docker-compose -f docker-compose-full-local.yml logs -f backend-api

# Detener todo
docker-compose -f docker-compose-full-local.yml down
```

### Servicios Clave en Producción


````
<userPrompt>
Provide the fully rewritten file, incorporating the suggested code change. You must produce the complete file.
</userPrompt>

