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
```

## Despliegue en Producción

El archivo principal para despliegue en producción es `docker-compose-full-vps.yml`.

### Servicios Clave en Producción

1. **db** - MySQL 8.0 (base de datos maestra `cloud_master`)
2. **zookeeper** & **kafka** - Confluent Platform 7.4.0 (bus de eventos)
3. **backend-api** - Servicio backend reactivo (construido desde `./backend_new`)
4. **frontend** - Aplicación Next.js (construida desde `./frontend_new/`)
5. **evolution-api** - Integración WhatsApp Business
6. **chat-socket-service** - Servicio de chat en tiempo real
7. **postgres** - Base de datos para vector/embeddings
8. **qdrant** - Base de datos vectorial para memoria semántica
9. **redis** - Caché y pub/sub
10. **billing-service** - Microservicio de facturación Go
11. **scheduler-service** - Servicio de programación Java
12. **notification-service** - Servicio de notificaciones Java
13. **marketing-worker** - Servicio de ejecución de marketing Java
14. **ai-agent** - Servicio de agentes de IA Python
15. **lead-generator** - Servicio de generación de leads Python
16. **traefik** - Proxy inverso con SSL automático

### Configuración de Red
- Tres redes definidas: `default`, `kafka-net`, `app-net`
- Servicios se comunican mediante nombres de host de Docker
- Puerto expuesto para backend-api: 8080
- Puerto expuesto para frontend: 3000
- Puerto expuesto para evolution-api: 8080

### Variables de Entorno Clave
Definidas en `.env` y sobrescritas por `.env.vps`:
- `JWT_SECRET` - Secreto para firma de tokens JWT
- `EVOLUTION_API_KEY` - Key para API de Evolution (WhatsApp)
- `SPRING_PROFILES_ACTIVE=production` - Perfil de Spring activo
- Zonas horarias: `America/Bogota` para todos los servicios

### Volúmenes Persistentes
- `persistent_master` - Almacenamiento persistente para datos MySQL
- `./uploads:/uploads` - Montaje para archivos subidos

## Patrones Arquitectónicos Notables

### a) Arquitectura de Microservicios Reactivos
- El backend utiliza **Spring WebFlux + R2DBC** para acceso completamente no bloqueante y reactivo a la base de datos MySQL.
- Kafka sirve como columna vertebral de eventos asíncrona conectando todos los microservicios.
- El sistema está diseñado para alta escalabilidad y baja latencia.

### b) Multi-Tenant SaaS (Jerarquía Tenant/Empresa)
- Nivel doble de aislamiento de datos: **Tenant** (cuenta corporativa) y **Company** (sucursal/ubicación).
- Todas las consultas a la base de datos incluyen filtrado por `tenant_id`; opcional `company_id` para acceso a nivel de sucursal.
- Roles: ADMIN/MANAGER ven todas las empresas; USER está restringido a la empresa asignada.
- Persistencia de contexto mediante `localStorage` (`activeTenantId`, `activeCompanyId`).

### c) Diseño Primero con IA
- Agentes de IA autónomos (Ventas, Soporte) potenciados por OpenAI/LLMs con memoria semántica vía Qdrant + pgvector.
- Trabajadores vectoriales para indexación de datos no estructurados.
- Equipo de IA de marketing con orquestación de múltiples agentes (patrón estilo CrewAI).
- Soporte multi-LLM: OpenAI, Groq, OpenRouter (con agrupación/rotación de claves).

### d) Enfoque Primero en WhatsApp
- Integración de Evolution API para mensajería empresarial de WhatsApp.
- Chat en tiempo real vía Socket.IO con pub/sub respaldado por Redis y transmisión de eventos Kafka.
- Chatwoot (Ruby on Rails) para plataforma completa de engagement al cliente.

### e) Estrategia de Frontend Dual
- Dos aplicaciones Next.js 14 en paralelo (`frontend/` y `frontend_new/`), indicando una migración/refactor en progreso.
- La versión más reciente tiene una estructura de vista más modular organizada por dominio de negocio (dashboard, ventas, marketing, administración, automatización).
- Redux Toolkit para gestión de estado en ambas.

### f) Enfoque en el Mercado Colombiano
- Facturación electrónica DIAN (facturación electrónica) integrada como microservicio.
- Nómina electrónica colombiana con módulo de contabilidad completo (libro mayor, libro diario, balance general).
- Códigos tributarios colombianos (códigos DANE) y cumplimiento regulatorio incorporados.

### g) Persistencia Poliglota
- MySQL 8.0 para datos transaccionales maestros.
- PostgreSQL + pgvector para embeddings vectoriales de IA.
- Redis para caché y pub/sub en tiempo real.
- Qdrant para búsqueda vectorial dedicada.

### h) Infraestructura
- Traefik v3.6.7 como router de borde con SSL automático de Let's Encrypt.
- Portainer para gestión de contenedores.
- Prometheus + Grafana para monitoreo.
- Terraform para infraestructura como código.
- Múltiples archivos Docker Compose para diferentes entornos (local, completo, VPS, monitoreo).

### i) Extensa Herramienta de Automatización
- 100+ scripts JavaScript/TypeScript/Python para devops, depuración, despliegue, migraciones de base de datos y pruebas en la raíz del proyecto.
- Servidor de automatización de workflows n8n para construcción visual de workflows.
- Scripts de prueba basados en Selenium y raspadores.

### j) Lógica de Negocio SaaS
- Gestión de suscripciones con planes.
- Integración de pasarela de pago Wompi (pasarela de pago colombiana) mediante el servicio de facturación Go.
- Programador de facturación para facturas recurrentes.

## Puntos de Entrada de la API

### Backend API (puerto 8080)
- `/api/auth` - Endpoints de autenticación
- `/api/users` - Gestión de usuarios
- `/api/companies` - Gestión de empresas/tenants
- `/api/contacts` - Gestión de contactos/leads
- `/api/deals` - Gestión de oportunidades de venta
- `/api/products` - Gestión de productos/inventario
- `/api/orders` - Gestión de órdenes de venta
- `/api/invoices` - Gestión de facturas
- `/api/appointments` - Gestión de citas/calendario
- `/api/marketing` - Endpoints de campañas de marketing
- `/api/webhooks` - Endpoints de webhook externos

### Servicio de Socket Chat (puerto implícito vía Traefik)
- Eventos Socket.IO para mensajería en tiempo real
- Namespaces: `/chat`, `/notifications`, etc.

### Servicio de Facturación Go
- Endpoints para procesamiento de pagos, gestión de suscripciones, integración Wompi

## Consideraciones de Seguridad

### Autenticación y Autorización
- JWT basado para autenticación de API
- Protección de rutas basada en roles (ADMIN, MANAGER, USER)
- Filtrado multi-tenant en todas las consultas de base de datos
- Sesiones seguras con cookies HttpOnly

### Protección de Datos
- Encriptación en reposo para información sensible (configurable)
- Comunicación HTTPS mediante terminación SSL en Traefik
- Validación y sanitización de entradas para prevenir inyección
- Políticas de Seguridad de Contenido (CSP) configurables

### Seguridad de Infraestructura
- Escaneo de imágenes de Docker para vulnerabilidades
- Actualizaciones regulares de dependencias de seguridad
- Configuración de firewall (puertos necesarios solo expuestos)
- Registro y monitoreo de eventos de seguridad

## Escalabilidad y Rendimiento

### Escalabilidad Horizontal
- Servicios diseñados para ejecución de múltiples instancias
- Kafka permite procesamiento distribuido de eventos
- Redis soporta clustering para caché distribuida
- Qdrant soporta clustering para búsqueda vectorial

### Optimización de Rendimiento
- Acceso a base de datos no bloqueante/reactivo (WebFlux + R2DBC)
- Caché de múltiples niveles (Redis, caché de aplicación)
- Procesamiento asíncrono mediante Kafka
- Índices de base de datos optimizados para consultas comunes
- CDN para assets estáticos (configurable)

## Monitoreo y Observabilidad

### Métricas
- Prometheus para recolección de métricas de servicios
- Endpoints `/actuator/prometheus` en servicios Java
- Métricas personalizadas para métricas de negocio (ventas, registros, etc.)

### Registro
- Estructura de registro JSON consistente entre servicios
- Niveles de registro configurables (DEBUG, INFO, WARN, ERROR)
- Agregación de logs mediante stack ELK o similar (configurable)

### Trazabilidad
- Propagación de contexto de trazabilidad entre servicios
- IDs de solicitud únicos para seguimiento de extremo a extremo
- Integración con sistemas de trazabilidad (Jaeger, Zipkin) (configurable)

### Salud y Listo
- Endpoints de salud (`/actuator/health`) para todos los servicios
- Endpoints de listo para orquestación de Kubernetes/Docker Swarm
- Verificaciones de dependencias (DB, Kafka, Redis) en los checks de salud

## Pruebas y Calidad

### Estrategia de Pruebas
- Pruebas unitarias para lógica de negocio
- Pruebas de integración para servicios API
- Pruebas de extremo a extremo para flujos críticos de usuario
- Pruebas de carga para validación de escalabilidad
- Pruebas de seguridad para validación de vulnerabilidades

### Calidad de Código
- Revisión de código mediante pull requests
- Análisis estático de código (SonarQube o similar) (configurable)
- Formateo automático de código (Prettier, Google Java Format)
- Linters para JavaScript/TypeScript/Python/Go/Java

## Plan de Ruta y Futuro Trabajo

### Mejoras Próximas
1. **Migración completa a frontend_new** - Eliminar el frontend heredado
2. **Expansión de capacidades de IA** - Más tipos de agentes, mejor memoria
3. **Mejoras en analítica** - Dashboards avanzados, ML predictivo
4. **Integraciones ampliadas** - Más pasarelas de pago, plataformas CRM
5. **Optimizaciones de rendimiento** - Caché avanzado, indexing de BD
6. **Mejoras de observabilidad** - Trazabilidad distribuida completa
7. **Características de cumplimiento** - Certificaciones adicionales, auditorías

### Escalabilidad del Equipo
- Arquitectura de microservicios permite desarrollo independiente por equipo
- Contratos de API bien definidos entre servicios
- Pipelines de CI/CD para despliegues automatizados
- Pruebas de contrato para asegurar compatibilidad entre servicios

---
*Este documento especifica el estado actual de la plataforma CloudFly AI a partir de julio de 2024. Los componentes específicos, versiones y arquitectura pueden evolucionar con el desarrollo continuo.*