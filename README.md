# CloudFly ERP Platform

<div align="center">

![CloudFly Logo](https://img.shields.io/badge/CloudFly-ERP%20Platform-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)

**Plataforma ERP Multi-tenant Completa con Inteligencia Artificial**

*Gestión empresarial integral: Ventas, Contabilidad, POS, CRM, Recursos Humanos y Chatbot IA*

[Características](#-características-principales) •
[Tecnologías](#-stack-tecnológico) •
[Instalación](#-instalación) •
[Documentación](#-documentación) •
[Arquitectura](#-arquitectura)

</div>

---

## 📖 Descripción

**CloudFly** es una plataforma ERP (Enterprise Resource Planning) moderna y completa, diseñada para empresas que buscan digitalizar y optimizar sus procesos de negocio. Combina módulos tradicionales de gestión empresarial con tecnologías de vanguardia como chatbots con IA, comunicación omnicanal, gestión de recursos humanos y automatización inteligente.

### ✨ ¿Qué hace CloudFly único?

- 🏢 **Multi-tenant**: Soporta múltiples empresas en una sola instancia
- 🤖 **IA Integrada**: Chatbots inteligentes con RAG (Retrieval Augmented Generation)
- 📱 **Omnicanal**: WhatsApp, Email, SMS, Facebook, Instagram
- 📊 **Contabilidad Completa**: Cumple con principios contables NIIF y normativa colombiana
- 💼 **Nómina Electrónica**: Sistema completo de nómina colombiana con todas las prestaciones sociales
- 🛒 **POS Moderno**: Punto de venta rápido y eficiente
- 🔄 **Automatización**: Flujos de trabajo con N8N y procedimientos almacenados
- 🔐 **Seguro**: Autenticación JWT, roles granulares RBAC, multi-factor

---

## 🚀 Características Principales

### 💼 Módulo de Ventas
- ✅ Cotizaciones con múltiples ítems y estados (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED)
- ✅ Gestión de pedidos con tracking completo (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- ✅ Facturación electrónica con numeración automática
- ✅ Conversión automática: Cotización → Pedido → Factura
- ✅ Generación de PDFs profesionales
- ✅ Envío automático por email
- ✅ Integración contable automática
- ✅ Gestión de descuentos e impuestos
- ✅ Historial de versiones y modificaciones

### 📚 Módulo de Contabilidad
- ✅ Plan de cuentas jerárquico (5 niveles) compatible con PUC Colombia
- ✅ Comprobantes contables (Ingreso, Egreso, Notas Contables, Apertura, Cierre)
- ✅ Centros de costo con jerarquía multinivel
- ✅ Libro Diario completo con filtros avanzados
- ✅ Libro Mayor por cuenta con saldos acumulados
- ✅ Balance de Prueba a cualquier fecha
- ✅ Estado de Resultados (P&L) con comparativos
- ✅ Balance General con clasificación por naturaleza
- ✅ Integración automática con ventas, compras y nómina
- ✅ Validación de cuadre débitos = créditos
- ✅ Estados de comprobantes (DRAFT, POSTED, VOID)
- ✅ Asignación de terceros y centros de costo por línea

### 🛍️ Punto de Venta (POS)
- ✅ Catálogo completo de productos y servicios
- ✅ Gestión de categorías jerárquicas
- ✅ Control de inventario en tiempo real
- ✅ Códigos de barras y SKU únicos
- ✅ Alertas de stock mínimo configurable
- ✅ Múltiples precios y descuentos por producto
- ✅ Imágenes de productos
- ✅ Gestión de impuestos (IVA configurable)
- ✅ Búsqueda rápida por nombre, SKU o código de barras

### 👥 Módulo de Recursos Humanos (Nómina Colombiana)
- ✅ **Gestión de Empleados**
  - Información personal y de contacto
  - Datos de contrato (salario, cargo, fecha de ingreso)
  - Asignación a centros de costo
  - Vinculación con cuentas de usuario
  - Historial laboral completo

- ✅ **Conceptos de Nómina Configurables**
  - Devengos (salario básico, horas extras, comisiones, bonificaciones)
  - Deducciones (salud, pensión, préstamos, embargos)
  - Aportes patronales (salud, pensión, ARL, caja compensación)
  - Provisiones (cesantías, intereses, prima, vacaciones)
  - Configuración de fórmulas de cálculo
  - Tipos: EARNING (devengo), DEDUCTION (deducción), EMPLOYER_CONTRIBUTION (aporte)

- ✅ **Liquidación de Nómina**
  - Períodos de nómina configurables (quincenal, mensual)
  - Cálculo automático de prestaciones sociales
  - Generación de colillas de pago en PDF
  - Estados: DRAFT, LIQUIDATED, PAID, VOID
  - Novedades de nómina (incapacidades, vacaciones, horas extras)
  - Integración contable automática con comprobantes

- ✅ **Provisiones y Prestaciones Sociales**
  - Cesantías (8.33% mensual)
  - Intereses sobre cesantías (1% mensual)
  - Prima de servicios (8.33% mensual)
  - Vacaciones (4.17% mensual)
  - Cálculo y provisión automática

- ✅ **Reportes de Nómina**
  - Colillas de pago individuales en PDF
  - Reporte de costos por centro de costo
  - Resumen de nómina por período
  - Exportación a Excel
  - Dashboard de análisis de costos laborales

- ✅ **Integración Contable**
  - Generación automática de comprobantes contables
  - Asientos por centro de costo
  - Cuentas configurables por concepto de nómina
  - Procedimientos almacenados para optimización
  - Trazabilidad completa

### 👥 CRM (Gestión de Contactos)
- ✅ Clientes, proveedores, empleados
- ✅ Pipeline Kanban (Lead → Potencial → Cliente)
- ✅ Información fiscal completa (NIT, RUC, DNI)
- ✅ Historial de interacciones
- ✅ Integración contable (cuentas por cobrar/pagar)
- ✅ Gestión de direcciones y múltiples contactos
- ✅ Avatar/foto de perfil

### 🤖 Chatbot e Inteligencia Artificial
- ✅ Chatbots especializados por tipo de negocio
  - 📈 Ventas (SALES) - Atención automatizada de ventas
  - 📅 Agendamiento (SCHEDULING) - Reservas y citas
  - 🛠️ Soporte (SUPPORT) - Asistencia técnica
  - ⚙️ Personalizado (CUSTOM) - Flujos personalizados
- ✅ Integración con WhatsApp Business API vía Evolution API
- ✅ RAG con Qdrant (búsqueda semántica en documentación)
- ✅ Automatización con N8N para workflows complejos
- ✅ Respuestas contextuales inteligentes
- ✅ Gestión de instancias de WhatsApp
- ✅ Webhooks configurables por tenant

### 💬 Comunicación Omnicanal
- ✅ WhatsApp Business (vía Evolution API)
- ✅ Email (SMTP configurable)
- ✅ SMS
- ✅ Facebook Messenger
- ✅ Instagram Direct Messages
- ✅ Telegram
- ✅ Centro de atención unificado (Chatwoot)
- ✅ Socket.IO para mensajería en tiempo real
- ✅ Historial completo de conversaciones
- ✅ Estados de mensajes (PENDING, SENT, DELIVERED, READ, FAILED)

### 🔐 Control de Acceso (RBAC)
- ✅ Sistema de roles y permisos granular
- ✅ Roles predefinidos: SUPERADMIN, ADMIN, MANAGER, CONTADOR, USER
- ✅ Permisos por módulo (READ, WRITE, UPDATE, DELETE)
- ✅ Gestión de módulos del sistema
- ✅ Asignación de módulos por rol
- ✅ Menú dinámico basado en permisos
- ✅ Validación de acceso en backend y frontend

### 📊 Dashboard y Reportes
- ✅ KPIs en tiempo real por tenant
- ✅ Gráficos de ventas (diario, mensual, anual)
- ✅ Productos más vendidos
- ✅ Stock crítico y alertas
- ✅ Indicadores contables y financieros
- ✅ Dashboard de consumo por cliente
- ✅ Reportes de nómina y costos laborales
- ✅ Exportación a Excel/PDF
- ✅ Gráficos interactivos con ApexCharts

---

## 🛠️ Stack Tecnológico

### Backend
```
☕ Java 17
🍃 Spring Boot 3.4.0
🗃️ MySQL 8.0
🔐 Spring Security + JWT
📦 JPA/Hibernate
🔄 Apache Kafka
📧 Spring Mail
✅ Flyway (Migraciones)
```

### Frontend
```
⚛️ React 18 + Next.js 14
📘 TypeScript
🎨 Material-UI (MUI)
📡 Axios
🔌 Socket.IO Client
📊 ApexCharts
🎯 React Hook Form
🌐 i18next (Internacionalización)
```

### Infraestructura
```
🐳 Docker + Docker Compose
🔀 Traefik (Reverse Proxy + SSL)
🔓 Let's Encrypt (SSL Automático)
📊 Portainer (Gestión Docker)
🔍 Kafdrop (Monitor Kafka)
```

### Integraciones
```
💬 Evolution API (WhatsApp)
🤖 N8N (Automatización)
🧠 Qdrant (Vector DB para IA)
💬 Chatwoot (Centro de Atención)
🚀 Redis (Cache)
🐘 PostgreSQL (Chatbot)
```

---

## 📦 Instalación

### Prerrequisitos

- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM mínimo
- 50GB espacio en disco

### Instalación Rápida

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-org/cloudfly.git
cd cloudfly
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Iniciar todos los servicios**
```bash
docker-compose up -d
```

4. **Verificar estado**
```bash
docker-compose ps
```

5. **Acceder a la aplicación**
- Frontend: https://dashboard.cloudfly.com.co
- Backend API: https://api.cloudfly.com.co
- N8N: https://autobot.cloudfly.com.co
- Chatwoot: https://chatcenter.cloudfly.com.co
- Evolution API: https://eapi.cloudfly.com.co
- phpMyAdmin: http://localhost:8000
- Portainer: http://localhost:9000
- Kafdrop (Kafka Monitor): http://localhost:9100

### Usuarios por Defecto

**Usuarios del Sistema**:
```
Superadmin:
  Username: juanpepe
  Password: Elian2020*
  Roles: SUPERADMIN, ADMIN, MANAGER
  Acceso: Total al sistema

Admin:
  Username: admin
  Password: admin123
  Roles: ADMIN
  Acceso: Administración del tenant

Contador:
  Username: contador
  Password: contador123
  Roles: CONTADOR
  Acceso: Módulo contable completo
```

**Bases de Datos**:
```
MySQL (Principal):
  Database: cloud_master
  User: root
  Password: widowmaker
  Port: 3306

PostgreSQL (Chatbot/Chatwoot):
  Database: chatbotdb, chatwoot_production
  User: chatbot_user
  Password: chatbot_pass
  Port: 5432

Redis:
  Password: Elian2020#
  Port: 6379
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                       CLOUDFLY PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │  Frontend  │◄───│  Traefik   │───►│  Backend   │        │
│  │  Next.js   │    │   (SSL)    │    │   Spring   │        │
│  └────────────┘    └────────────┘    └────────────┘        │
│         │                                     │              │
│  ┌──────▼────────────────────────────────────▼─────────┐   │
│  │         MySQL (Multi-tenant Database)              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Kafka   │  │  Redis   │  │PostgreSQL│  │  Qdrant  │  │
│  │(Messages)│  │ (Cache)  │  │(Chatbot) │  │(Vectors) │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   N8N    │  │Evolution │  │Chatwoot  │  │  Socket  │  │
│  │(Workflow)│  │(WhatsApp)│  │  (Chat)  │  │ Service  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Documentación

### Documentación Principal
- 📖 [Especificaciones Completas](docs/ESPECIFICACIONES_CLOUDFLY.md) - Documentación técnica detallada
- 🏗️ [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- 🔐 [Seguridad y RBAC](docs/SEGURIDAD.md)

### Módulos Específicos
- 💼 [Sistema POS Completo](SISTEMA_POS_COMPLETO.md) - Punto de venta y gestión de inventario
- 📚 [Módulo de Contabilidad](COMPROBANTES_TERMINADO_100.md) - Sistema contable completo
- 💰 [Centros de Costo](INTEGRACION_NOMINA_CENTRO_COSTOS.md) - Gestión de centros de costo
- 💬 [Sistema de Chat Completo](CHAT_SYSTEM_COMPLETE.md) - Mensajería omnicanal
- 🤖 [Tipos de Chatbot](CHATBOT_TYPES_README.md) - Configuración de bots especializados
- 📋 [Validación del Sistema POS](GUIA_VALIDACION_POS.md) - Guía de pruebas del POS
- 💼 [Integración Nómina y Centros de Costo](INTEGRACION_NOMINA_CENTRO_COSTOS.md) - Nómina colombiana

### Guías Operativas
- ⚙️ [Instrucciones de Reinicio](INSTRUCCIONES_REINICIO.md) - Cómo reiniciar servicios
- 📝 [Instrucciones Finales](INSTRUCCIONES_FINAL.md) - Configuración final del sistema
- 🔧 [Solución Error 401 Contactos](SOLUCION_ERROR_401_CONTACTS.md) - Troubleshooting
- 🚀 [Despliegue del Sistema de Chat](DEPLOYMENT_CHAT.md) - Deployment de comunicaciones

### Scripts de Prueba
El proyecto incluye múltiples scripts PowerShell para validación y pruebas:
- `validate_complete_system.ps1` - Validación completa del sistema
- `test_complete_flow.ps1` - Flujo completo de ventas
- `simulate_payroll.ps1` - Simulación de nómina
- `test_accounting.ps1` - Pruebas del módulo contable
- `test_payroll_flow.ps1` - Flujo completo de nómina

---

## 🔧 Desarrollo

### Estructura del Proyecto

```
cloudfly/
├── backend/                 # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/app/starter1/
│   │   │   │       ├── controllers/     # REST Controllers
│   │   │   │       │   ├── AccountingVoucherController.java
│   │   │   │       │   ├── ContactController.java
│   │   │   │       │   ├── EmployeeController.java
│   │   │   │       │   ├── InvoiceController.java
│   │   │   │       │   ├── MenuController.java
│   │   │   │       │   ├── PayrollController.java
│   │   │   │       │   ├── ProductController.java
│   │   │   │       │   └── ... (35 controllers)
│   │   │   │       ├── services/        # Business Logic
│   │   │   │       │   ├── AccountingVoucherService.java
│   │   │   │       │   ├── EmployeeService.java
│   │   │   │       │   ├── PayrollCalculationService.java
│   │   │   │       │   ├── PayrollLiquidationService.java
│   │   │   │       │   ├── PayrollAccountingService.java
│   │   │   │       │   ├── PayrollPdfService.java
│   │   │   │       │   ├── LibroDiarioService.java
│   │   │   │       │   ├── BalanceGeneralService.java
│   │   │   │       │   └── ... (21 services)
│   │   │   │       ├── persistence/     # Entities & Repos
│   │   │   │       │   ├── entity/
│   │   │   │       │   │   ├── accounting/
│   │   │   │       │   │   ├── hr/      # Entidades de nómina
│   │   │   │       │   │   ├── rbac/    # Roles y permisos
│   │   │   │       │   │   ├── sales/
│   │   │   │       │   │   └── ...
│   │   │   │       │   └── repository/
│   │   │   │       ├── dto/             # Data Transfer Objects
│   │   │   │       │   ├── accounting/
│   │   │   │       │   ├── hr/
│   │   │   │       │   ├── sales/
│   │   │   │       │   └── ...
│   │   │   │       └── config/          # Configuration
│   │   │   └── resources/
│   │   │       ├── db/migration/        # Flyway migrations
│   │   │       │   ├── V1__initial_schema.sql
│   │   │       │   ├── V20__add_hr_tables.sql
│   │   │       │   ├── V24__seed_modules_data.sql
│   │   │       │   └── ... (100+ migrations)
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
├── frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── app/             # App Router (Next.js 14)
│   │   │   ├── (dashboard)/
│   │   │   │   ├── ventas/          # Módulo de ventas
│   │   │   │   ├── contabilidad/    # Módulo contable
│   │   │   │   ├── hr/              # Recursos Humanos
│   │   │   │   │   ├── employees/   # Gestión empleados
│   │   │   │   │   ├── periods/     # Períodos de nómina
│   │   │   │   │   ├── concepts/    # Conceptos de nómina
│   │   │   │   │   ├── receipts/    # Colillas de pago
│   │   │   │   │   └── reports/     # Reportes de nómina
│   │   │   │   ├── productos/       # Catálogo de productos
│   │   │   │   ├── accounts/        # Usuarios y roles
│   │   │   │   ├── settings/        # Configuración
│   │   │   │   ├── comunicaciones/  # Mensajería
│   │   │   │   └── home/            # Dashboard principal
│   │   │   └── login/
│   │   ├── components/      # Reusable Components
│   │   │   ├── accounting/  # Componentes contables
│   │   │   ├── hr/          # Componentes de nómina
│   │   │   ├── sales/       # Componentes de ventas
│   │   │   └── views/       # Vistas de login, etc.
│   │   ├── services/        # API Services
│   │   │   ├── accounting/
│   │   │   ├── hr/
│   │   │   │   ├── employeeService.ts
│   │   │   │   ├── payrollService.ts
│   │   │   │   └── payrollLiquidationService.ts
│   │   │   ├── sales/
│   │   │   └── ...
│   │   ├── types/           # TypeScript Types
│   │   │   ├── accounting/
│   │   │   ├── hr/          # Tipos de nómina
│   │   │   ├── rbac/        # Tipos de RBAC
│   │   │   └── sales/
│   │   └── utils/           # Utilities
│   ├── public/
│   └── package.json
│
├── notifications/           # Notification Service (Spring)
├── chat-socket-service/     # Socket.IO Service (Node.js)
├── n8n/                     # N8N Workflows
├── backup-service/          # Backup Service (PHP)
├── docs/                    # Documentation
├── tests/                   # Test Scripts
├── docker-compose.yml       # Production Compose
└── .env                     # Environment Variables
```

### Comandos Útiles

**Backend (Maven)**
```bash
cd backend
./mvnw clean install          # Build
./mvnw spring-boot:run        # Run local
./mvnw test                   # Tests
```

**Frontend (npm)**
```bash
cd frontend
npm install                   # Install dependencies
npm run dev                   # Development server
npm run build                 # Production build
npm run lint                  # Linting
```

**Docker**
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f api    # View logs
docker-compose restart api    # Restart service
```

---

## 🧪 Testing

### Ejecutar Pruebas Completas

```powershell
# Prueba completa del sistema
.\validate_complete_system.ps1

# Prueba del flujo de ventas
.\test_complete_flow.ps1

# Prueba de módulo contable
.\test_all_accounting.ps1
```

### Pruebas Manuales

```bash
# Test de autenticación
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test de productos
curl -X GET http://localhost:8080/products \
  -H "Authorization: Bearer <token>"
```

---

## 🔐 Seguridad

### Características de Seguridad

- ✅ Autenticación JWT
- ✅ Refresh Tokens
- ✅ Roles y permisos granulares
- ✅ CORS configurado
- ✅ HTTPS obligatorio (producción)
- ✅ Rate limiting
- ✅ SQL Injection protection (JPA)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Passwords hasheados (BCrypt)

### Variables de Entorno Sensibles

```bash
# Nunca commitear estas variables
JWT_SECRET=cambiar-en-produccion
DB_PASSWORD=cambiar-en-produccion
EVOLUTION_API_KEY=cambiar-en-produccion
N8N_SECRET_KEY=cambiar-en-produccion
```

---

## 🚀 Deployment

### Producción

1. **Configurar dominios en DNS**
```
dashboard.cloudfly.com.co  → IP-SERVIDOR
api.cloudfly.com.co       → IP-SERVIDOR
autobot.cloudfly.com.co   → IP-SERVIDOR
```

2. **Actualizar variables de entorno**
```bash
# .env.production
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production
```

3. **Desplegar**
```bash
docker-compose -f docker-compose.yml up -d
```

4. **Verificar SSL**
```bash
# Traefik generará certificados automáticamente
docker-compose logs traefik
```

### Backup

```bash
# Backup de MySQL
docker exec mysql mysqldump -u root -p cloud_master > backup.sql

# Backup de volúmenes
docker run --rm -v persistent_master:/data -v $(pwd):/backup \
  alpine tar czf /backup/mysql-backup.tar.gz /data
```

---

## 📊 Monitoreo

### Herramientas Disponibles

- **Portainer**: `http://localhost:9000` - Gestión de contenedores
- **Kafdrop**: `http://localhost:9100` - Monitor de Kafka
- **phpMyAdmin**: `http://localhost:8000` - Gestión de MySQL
- **Redis Insight**: `http://localhost:8001` - Monitor de Redis
- **Traefik Dashboard**: Configurado en producción

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f backend-api
docker-compose logs -f frontend-react
docker-compose logs -f evolution-api

# Ver logs de todos los servicios
docker-compose logs --tail=100
```

---

## 🤝 Contribuciones

Este es un proyecto privado. Para contribuir:

1. Solicitar acceso al equipo
2. Crear un branch feature/nombre-feature
3. Realizar cambios con commits descriptivos
4. Crear Pull Request
5. Esperar revisión del equipo

### Convenciones de Código

- **Backend**: Seguir convenciones de Spring Boot
- **Frontend**: Seguir guías de React/TypeScript
- **Git**: Commits en español, descriptivos
- **Testing**: Pruebas obligatorias para nuevas features

---

## 📝 Licencia

Copyright © 2024-2025 CloudFly
Todos los derechos reservados.

Este software es propietario y confidencial. El uso no autorizado está prohibido.

---

## 📞 Soporte

- **Email**: soporte@cloudfly.com.co
- **Web**: https://cloudfly.com.co
- **Documentación**: https://docs.cloudfly.com.co

---

## 🙏 Créditos

Desarrollado con ❤️ por el equipo de CloudFly

**Tecnologías principales**:
- Spring Boot
- Next.js
- Docker
- Material-UI
- Evolution API
- N8N
- Chatwoot

---

<div align="center">

**CloudFly ERP Platform** - Ventas 24/7 con Inteligencia Artificial

![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)
![Colombia](https://img.shields.io/badge/🇨🇴-Colombia-yellow?style=for-the-badge)

</div>
