# 📋 CloudFly ERP Platform - Resumen de Funcionalidades v1.0

**Fecha:** 20 de Diciembre 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Producción

---

## 📖 Descripción General

**CloudFly** es una plataforma ERP multi-tenant completa diseñada para la gestión empresarial integral. Combina funcionalidades de ventas, contabilidad, punto de venta (POS), recursos humanos, nómina, CRM, y comunicación omnicanal con inteligencia artificial.

---

## 🏗️ Stack Tecnológico

### Backend
- **Lenguaje:** Java 17
- **Framework:** Spring Boot 3.4.0
- **Base de Datos:** MySQL 8.0
- **ORM:** JPA/Hibernate
- **Seguridad:** Spring Security + JWT
- **Mensajería:** Apache Kafka
- **Migraciones:** Flyway

### Frontend
- **Framework:** Next.js 14 (React 18+)
- **Lenguaje:** TypeScript
- **UI Library:** Material-UI (MUI)
- **HTTP Client:** Axios
- **Estado:** React Context + Hooks
- **Formularios:** React Hook Form
- **Charts:** ApexCharts/Recharts

### Infraestructura
- **Containerización:** Docker + Docker Compose
- **Proxy Inverso:** Traefik v3.1
- **SSL:** Let's Encrypt (automático)
- **Monitoreo:** Portainer

### Integraciones
- **WhatsApp:** Evolution API
- **Automatización:** N8N
- **IA/Vectores:** Qdrant
- **Chat Center:** Chatwoot
- **Cache:** Redis

---

## 📦 Módulos Funcionales Implementados

---

### 1. 🔐 Módulo de Autenticación y Usuarios

| Funcionalidad | Estado |
|---------------|--------|
| Login con JWT | ✅ Implementado |
| Registro de usuarios | ✅ Implementado |
| Gestión de roles y permisos | ✅ Implementado |
| Multi-tenant (separación por empresa) | ✅ Implementado |
| Recuperación de contraseña | ✅ Implementado |
| Refresh tokens | ✅ Implementado |

**Roles del Sistema:**
- `SUPERADMIN` - Acceso total
- `ADMIN` - Administrador de tenant
- `CONTADOR` - Acceso contable
- `USER` - Usuario estándar
- `BIOMEDICAL` - Usuario biomédico

**Endpoints:**
```
POST   /auth/login                    - Iniciar sesión
POST   /auth/register                 - Registro de usuario
POST   /auth/refresh-token            - Refrescar token
POST   /auth/forgot-password          - Recuperar contraseña
GET    /users                         - Listar usuarios
POST   /users                         - Crear usuario
PUT    /users/{id}                    - Actualizar usuario
DELETE /users/{id}                    - Eliminar usuario
```

---

### 2. 💼 Módulo de Ventas

#### 2.1 Cotizaciones (Quotes)

| Funcionalidad | Estado |
|---------------|--------|
| CRUD de cotizaciones | ✅ Implementado |
| Múltiples ítems por cotización | ✅ Implementado |
| Estados (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED) | ✅ Implementado |
| Conversión a pedido | ✅ Implementado |
| Cálculos automáticos (subtotales, descuentos, IVA) | ✅ Implementado |
| Generación de PDF | ✅ Implementado |
| Envío por email | ✅ Implementado |

**Endpoints:**
```
GET    /quotes                        - Listar cotizaciones
POST   /quotes                        - Crear cotización
PUT    /quotes/{id}                   - Actualizar cotización
DELETE /quotes/{id}                   - Eliminar cotización
POST   /quotes/{id}/send              - Enviar cotización
POST   /quotes/{id}/accept            - Aceptar cotización
POST   /quotes/{id}/convert-to-order  - Convertir a pedido
GET    /quotes/{id}/pdf               - Generar PDF
```

#### 2.2 Pedidos (Orders)

| Funcionalidad | Estado |
|---------------|--------|
| CRUD de pedidos | ✅ Implementado |
| Creación desde cotización | ✅ Implementado |
| Estados (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED) | ✅ Implementado |
| Gestión de stock automática | ✅ Implementado |
| Facturación desde pedido | ✅ Implementado |

**Endpoints:**
```
GET    /orders                        - Listar pedidos
POST   /orders                        - Crear pedido
PUT    /orders/{id}                   - Actualizar pedido
DELETE /orders/{id}                   - Cancelar pedido
POST   /orders/{id}/confirm           - Confirmar pedido
POST   /orders/{id}/complete          - Completar pedido
POST   /orders/{id}/invoice           - Generar factura
```

#### 2.3 Facturas (Invoices)

| Funcionalidad | Estado |
|---------------|--------|
| CRUD de facturas | ✅ Implementado |
| Creación desde pedido | ✅ Implementado |
| Numeración automática | ✅ Implementado |
| Estados (DRAFT, ISSUED, PAID, CANCELLED) | ✅ Implementado |
| Cálculo de impuestos | ✅ Implementado |
| Generación de PDF | ✅ Implementado |
| Envío por email | ✅ Implementado |

**Endpoints:**
```
GET    /invoices                      - Listar facturas
POST   /invoices                      - Crear factura
PUT    /invoices/{id}                 - Actualizar factura
DELETE /invoices/{id}                 - Anular factura
POST   /invoices/{id}/send            - Enviar factura
POST   /invoices/{id}/mark-paid       - Marcar como pagada
GET    /invoices/{id}/pdf             - Generar PDF
```

---

### 3. 📚 Módulo de Contabilidad

#### 3.1 Plan de Cuentas (Chart of Accounts)

| Funcionalidad | Estado |
|---------------|--------|
| Estructura jerárquica (5 niveles) | ✅ Implementado |
| Tipos de cuenta (ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO) | ✅ Implementado |
| Naturaleza (DÉBITO, CRÉDITO) | ✅ Implementado |
| Cuentas de movimiento y totalizadoras | ✅ Implementado |
| PUC Colombia precargado | ✅ Implementado |

**Endpoints:**
```
GET    /chart-of-accounts             - Listar cuentas
POST   /chart-of-accounts             - Crear cuenta
PUT    /chart-of-accounts/{id}        - Actualizar cuenta
DELETE /chart-of-accounts/{id}        - Eliminar cuenta
GET    /chart-of-accounts/hierarchy   - Obtener árbol jerárquico
GET    /chart-of-accounts/type/{type} - Filtrar por tipo
```

#### 3.2 Centros de Costo (Cost Centers)

| Funcionalidad | Estado |
|---------------|--------|
| Estructura jerárquica (padre-hijo) | ✅ Implementado |
| Códigos únicos por tenant | ✅ Implementado |
| Estado activo/inactivo | ✅ Implementado |
| Asignación a movimientos contables | ✅ Implementado |
| Integración con nómina | ✅ Implementado |

**Endpoints:**
```
GET    /cost-centers                  - Listar centros
POST   /cost-centers                  - Crear centro
PUT    /cost-centers/{id}             - Actualizar centro
DELETE /cost-centers/{id}             - Desactivar centro
GET    /cost-centers/root             - Centros raíz
GET    /cost-centers/children/{id}    - Centros hijos
```

#### 3.3 Comprobantes Contables (Accounting Vouchers)

| Funcionalidad | Estado |
|---------------|--------|
| Tipos (INGRESO, EGRESO, NOTA_CONTABLE, APERTURA, CIERRE) | ✅ Implementado |
| Estados (DRAFT, POSTED, VOID) | ✅ Implementado |
| Numeración automática por tipo | ✅ Implementado |
| Validación débitos = créditos | ✅ Implementado |
| Múltiples líneas de movimiento | ✅ Implementado |
| Integración con terceros | ✅ Implementado |
| Integración con centros de costo | ✅ Implementado |
| Generación automática desde nómina | ✅ Implementado |

**Endpoints:**
```
GET    /accounting/vouchers           - Listar comprobantes
POST   /accounting/vouchers           - Crear comprobante
PUT    /accounting/vouchers/{id}      - Actualizar borrador
DELETE /accounting/vouchers/{id}      - Eliminar borrador
POST   /accounting/vouchers/{id}/post - Contabilizar
POST   /accounting/vouchers/{id}/void - Anular
```

#### 3.4 Reportes Contables

| Reporte | Estado |
|---------|--------|
| Libro Diario | ✅ Implementado |
| Libro Mayor | ✅ Implementado |
| Balance de Prueba | ✅ Implementado |
| Estado de Resultados | ✅ Implementado |
| Balance General | ✅ Implementado |

**Endpoints:**
```
GET    /accounting/reports/libro-diario      - Libro diario
GET    /accounting/reports/libro-mayor       - Libro mayor
GET    /accounting/reports/balance-prueba    - Balance de prueba
GET    /accounting/reports/estado-resultados - Estado de resultados
GET    /accounting/reports/balance-general   - Balance general
```

---

### 4. 👥 Módulo de Recursos Humanos (HR)

#### 4.1 Gestión de Empleados

| Funcionalidad | Estado |
|---------------|--------|
| CRUD completo de empleados | ✅ Implementado |
| Datos personales y laborales | ✅ Implementado |
| Asignación a centro de costos | ✅ Implementado |
| Conceptos de nómina por empleado | ✅ Implementado |
| Estado activo/inactivo | ✅ Implementado |

**Endpoints:**
```
GET    /api/hr/employees              - Listar empleados
POST   /api/hr/employees              - Crear empleado
PUT    /api/hr/employees/{id}         - Actualizar empleado
DELETE /api/hr/employees/{id}         - Desactivar empleado
GET    /api/hr/employees/active       - Empleados activos
```

#### 4.2 Conceptos de Nómina

| Funcionalidad | Estado |
|---------------|--------|
| Tipos (PERCEPCION, DEDUCCION) | ✅ Implementado |
| Conceptos recurrentes/eventuales | ✅ Implementado |
| Cálculo automático (ISR, IMSS) | ✅ Implementado |
| Inicialización de conceptos base | ✅ Implementado |

**Endpoints:**
```
GET    /api/hr/concepts               - Listar conceptos
POST   /api/hr/concepts               - Crear concepto
PUT    /api/hr/concepts/{id}          - Actualizar concepto
POST   /api/hr/concepts/initialize    - Inicializar conceptos base
```

#### 4.3 Período de Nómina

| Funcionalidad | Estado |
|---------------|--------|
| Tipos de período (QUINCENAL, MENSUAL, SEMANAL) | ✅ Implementado |
| Estados (OPEN, LIQUIDATED, PARTIALLY_PAID, PAID, CLOSED) | ✅ Implementado |
| Cálculo de total de nómina | ✅ Implementado |
| Seguimiento de pagos realizados | ✅ Implementado |

**Endpoints:**
```
GET    /api/hr/periods                - Listar períodos
POST   /api/hr/periods                - Crear período
PUT    /api/hr/periods/{id}           - Actualizar período
DELETE /api/hr/periods/{id}           - Eliminar período
```

#### 4.4 Liquidación y Pago de Nómina

| Funcionalidad | Estado |
|---------------|--------|
| Cálculo masivo de empleados | ✅ Implementado |
| Generación automática de recibos | ✅ Implementado |
| Pago individual de empleados | ✅ Implementado |
| Notificación por WhatsApp | ✅ Implementado |
| Notificación por Email | ✅ Implementado |
| Generación de PDF de recibos | ✅ Implementado |
| Auto-actualización de estados | ✅ Implementado |
| Generación de comprobante contable | ✅ Implementado |

**Endpoints:**
```
POST   /api/hr/payroll/periods/{id}/liquidate  - Liquidar período
POST   /api/hr/payroll/receipts/{id}/pay       - Pagar empleado
GET    /api/hr/payroll/periods/{id}/receipts   - Listar recibos
GET    /api/hr/payroll/receipts/{id}           - Ver recibo
GET    /api/hr/payroll/receipts/{id}/pdf       - Descargar PDF
```

#### 4.5 Novedades/Incidencias

| Funcionalidad | Estado |
|---------------|--------|
| Registro de novedades | ✅ Implementado |
| Tipos (BONUS, OVERTIME, ABSENCE, etc.) | ✅ Implementado |
| Procesamiento automático en liquidación | ✅ Implementado |

#### 4.6 Reportes de Nómina

| Reporte | Estado |
|---------|--------|
| Costo por Centro de Costos | ✅ Implementado |
| Resumen de período | ✅ Implementado |
| Detalle de recibos | ✅ Implementado |

**Endpoints:**
```
GET    /api/hr/reports/cost-by-center - Costo por centro de costos
```

---

### 5. 🛍️ Módulo de Punto de Venta (POS)

#### 5.1 Productos

| Funcionalidad | Estado |
|---------------|--------|
| CRUD completo de productos | ✅ Implementado |
| Categorización | ✅ Implementado |
| Gestión de stock | ✅ Implementado |
| Códigos de barras | ✅ Implementado |
| Alertas de stock mínimo | ✅ Implementado |
| Imágenes de productos | ✅ Implementado |
| Impuestos configurables | ✅ Implementado |
| Campos contables (cuenta ingreso/costo) | ✅ Implementado |

**Endpoints:**
```
GET    /products                      - Listar productos
POST   /products                      - Crear producto
PUT    /products/{id}                 - Actualizar producto
DELETE /products/{id}                 - Eliminar producto
GET    /products/category/{id}        - Por categoría
GET    /products/low-stock            - Stock bajo
```

#### 5.2 Categorías

| Funcionalidad | Estado |
|---------------|--------|
| CRUD de categorías | ✅ Implementado |
| Jerarquía padre-hijo | ✅ Implementado |
| Estado activo/inactivo | ✅ Implementado |

**Endpoints:**
```
GET    /categories                    - Listar categorías
POST   /categories                    - Crear categoría
PUT    /categories/{id}               - Actualizar categoría
DELETE /categories/{id}               - Eliminar categoría
```

---

### 6. 👥 Módulo de CRM (Contactos)

| Funcionalidad | Estado |
|---------------|--------|
| Tipos (CUSTOMER, SUPPLIER, EMPLOYEE, OTHER) | ✅ Implementado |
| Información fiscal (NIT, CC) | ✅ Implementado |
| Pipeline Kanban (LEAD, POTENTIAL, CLIENT) | ✅ Implementado |
| Integración contable (cuentas por cobrar/pagar) | ✅ Implementado |
| Avatar/foto de perfil | ✅ Implementado |

**Endpoints:**
```
GET    /contacts                      - Listar contactos
POST   /contacts                      - Crear contacto
PUT    /contacts/{id}                 - Actualizar contacto
DELETE /contacts/{id}                 - Eliminar contacto
GET    /contacts/type/{type}          - Filtrar por tipo
GET    /contacts/stage/{stage}        - Filtrar por etapa
```

---

### 7. 🤖 Módulo de Chatbot e IA

#### 7.1 Configuración de Chatbot

| Funcionalidad | Estado |
|---------------|--------|
| Tipos (SALES, SCHEDULING, SUPPORT, CUSTOM) | ✅ Implementado |
| Configuración por tenant | ✅ Implementado |
| Integración con WhatsApp | ✅ Implementado |
| RAG con Qdrant | ✅ Implementado |
| Flujos de N8N | ✅ Implementado |

**Endpoints:**
```
GET    /chatbot-types                 - Listar configuraciones
POST   /chatbot-types                 - Crear configuración
PUT    /chatbot-types/{id}            - Actualizar configuración
DELETE /chatbot-types/{id}            - Eliminar configuración
POST   /chatbot-types/{id}/activate   - Activar chatbot
POST   /chatbot-types/{id}/deactivate - Desactivar chatbot
```

#### 7.2 Gestión de Instancias WhatsApp

| Funcionalidad | Estado |
|---------------|--------|
| Crear instancia | ✅ Implementado |
| Generar QR para conexión | ✅ Implementado |
| Desconectar/reconectar | ✅ Implementado |
| Restart de instancia | ✅ Implementado |
| Estado de conexión | ✅ Implementado |
| Eliminar instancia | ✅ Implementado |

**Endpoints:**
```
GET    /chatbot                       - Listar instancias
POST   /chatbot                       - Crear instancia
DELETE /chatbot/{instanceName}        - Eliminar instancia
POST   /chatbot/{instanceName}/logout - Desconectar
POST   /chatbot/{instanceName}/restart- Reiniciar
GET    /chatbot/{instanceName}/qr     - Obtener QR
```

---

### 8. 💬 Módulo de Comunicación Omnicanal

| Canal | Estado |
|-------|--------|
| WhatsApp | ✅ Implementado |
| Email | ✅ Implementado |
| SMS | ✅ Implementado |
| Facebook Messenger | ✅ Implementado |
| Instagram DM | ✅ Implementado |
| Telegram | ✅ Implementado |

| Funcionalidad | Estado |
|---------------|--------|
| Estados de mensaje (PENDING, SENT, DELIVERED, READ, FAILED) | ✅ Implementado |
| Direcciones (INBOUND, OUTBOUND) | ✅ Implementado |
| Tipos de mensaje (TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT) | ✅ Implementado |
| Almacenamiento de media | ✅ Implementado |
| Centro de atención (Chatwoot) | ✅ Implementado |

**Endpoints:**
```
GET    /chat/messages                 - Listar mensajes
POST   /chat/messages/send            - Enviar mensaje
GET    /chat/conversations/{contactId}- Conversación
POST   /chat/upload-media             - Subir archivo
```

---

### 9. 📊 Módulo de Dashboard

| Funcionalidad | Estado |
|---------------|--------|
| KPIs en tiempo real | ✅ Implementado |
| Ventas del día/mes/año | ✅ Implementado |
| Productos más vendidos | ✅ Implementado |
| Stock crítico | ✅ Implementado |
| Indicadores contables | ✅ Implementado |
| Gráficos y estadísticas | ✅ Implementado |

**Endpoints:**
```
GET    /dashboard/sales-summary       - Resumen de ventas
GET    /dashboard/top-products        - Productos top
GET    /dashboard/recent-orders       - Pedidos recientes
GET    /dashboard/accounting-summary  - Resumen contable
GET    /dashboard/kpis                - KPIs generales
```

---

### 10. 🔔 Módulo de Notificaciones

| Funcionalidad | Estado |
|---------------|--------|
| Notificaciones push | ✅ Implementado |
| Email notifications | ✅ Implementado |
| WebSocket para tiempo real | ✅ Implementado |
| Estados (PENDING, SENT, READ) | ✅ Implementado |

**Endpoints:**
```
GET    /notifications                 - Listar notificaciones
POST   /notifications                 - Crear notificación
PUT    /notifications/{id}/read       - Marcar como leída
DELETE /notifications/{id}            - Eliminar notificación
```

---

### 11. 📁 Módulo de Documentos

| Funcionalidad | Estado |
|---------------|--------|
| Subida de archivos | ✅ Implementado |
| Categorización | ✅ Implementado |
| Metadatos | ✅ Implementado |
| Búsqueda | ✅ Implementado |
| Descarga | ✅ Implementado |

**Endpoints:**
```
GET    /documents                     - Listar documentos
POST   /documents/upload              - Subir documento
DELETE /documents/{id}                - Eliminar documento
GET    /documents/{id}/download       - Descargar
```

---

## 🔐 Seguridad

| Característica | Estado |
|----------------|--------|
| Autenticación JWT | ✅ Implementado |
| Refresh Tokens | ✅ Implementado |
| Roles y permisos granulares | ✅ Implementado |
| CORS configurado | ✅ Implementado |
| HTTPS obligatorio (producción) | ✅ Implementado |
| Rate limiting | ✅ Implementado |
| SQL Injection protection (JPA) | ✅ Implementado |
| XSS protection | ✅ Implementado |
| CSRF protection | ✅ Implementado |
| Passwords hasheados (BCrypt) | ✅ Implementado |
| Multi-tenancy por tenant_id | ✅ Implementado |

---

## 📱 Frontend - Páginas Implementadas

### Dashboard
- `/home` - Página principal con KPIs

### Ventas
- `/ventas/cotizaciones/list` - Listado de cotizaciones
- `/ventas/cotizaciones/form` - Formulario de cotización
- `/ventas/cotizaciones/view` - Vista detalle
- `/ventas/pedidos/list` - Listado de pedidos
- `/ventas/pedidos/form` - Formulario de pedido
- `/ventas/pedidos/view` - Vista detalle
- `/ventas/facturas/list` - Listado de facturas
- `/ventas/facturas/form` - Formulario de factura
- `/ventas/facturas/view` - Vista detalle
- `/ventas/productos/list` - Listado de productos
- `/ventas/productos/form` - Formulario de producto
- `/ventas/categorias/list` - Listado de categorías

### Contabilidad
- `/contabilidad/plan-cuentas` - Plan de cuentas
- `/contabilidad/centros-costo` - Centros de costo
- `/contabilidad/comprobantes` - Comprobantes contables
- `/contabilidad/libro-diario` - Libro diario
- `/contabilidad/libro-mayor` - Libro mayor
- `/contabilidad/balance-prueba` - Balance de prueba
- `/contabilidad/estado-resultados` - Estado de resultados
- `/contabilidad/balance-general` - Balance general

### Recursos Humanos
- `/hr/employees` - Gestión de empleados
- `/hr/employees/form` - Formulario de empleado
- `/hr/employees/view` - Vista detalle de empleado
- `/hr/concepts` - Conceptos de nómina
- `/hr/periods` - Períodos de nómina
- `/hr/period/form` - Formulario de período
- `/hr/period/view` - Vista detalle de período
- `/hr/process` - Procesamiento de nómina
- `/hr/receipts` - Consulta de recibos
- `/hr/novelties` - Novedades/Incidencias
- `/hr/config` - Configuración
- `/hr/dashboard` - Dashboard de HR
- `/hr/reports/cost-by-center` - Reporte costo por centro

### Marketing/CRM
- `/marketing/contacts/list` - Gestión de contactos

### Configuración
- `/settings/chatbot` - Configuración de chatbot

### Administración
- `/administracion/usuarios` - Gestión de usuarios

---

## 🚀 Integraciones Externas

| Integración | Propósito | Estado |
|-------------|-----------|--------|
| Evolution API | WhatsApp Business | ✅ Implementado |
| N8N | Automatización de flujos | ✅ Implementado |
| Qdrant | Base de datos vectorial (IA) | ✅ Implementado |
| Chatwoot | Centro de atención al cliente | ✅ Implementado |
| Redis | Cache y sesiones | ✅ Implementado |
| Apache Kafka | Mensajería asíncrona | ✅ Implementado |

---

## 📊 Métricas del Proyecto

### Backend
- **Entidades:** ~40+
- **Repositorios:** ~40+
- **Servicios:** ~30+
- **Controllers:** ~25+
- **Endpoints REST:** ~150+

### Frontend
- **Páginas:** ~50+
- **Componentes:** ~80+
- **Services API:** ~20+
- **Types/Interfaces:** ~100+

### Documentación
- **Archivos .md:** 58 documentos

---

## 📝 Notas de Versión

### v1.0.0 (20 Diciembre 2025)

**Nuevas Funcionalidades:**
- Sistema completo de nómina colombiana
- Integración contable automática desde nómina
- Reportes de costo por centro de costos
- Notificaciones WhatsApp para pagos de nómina
- Generación de comprobantes contables desde nómina

**Mejoras:**
- Validación de usuarios con nombres y apellidos
- Validación de username (alfanumérico + underscore, mínimo 8 caracteres)
- Mejoras en flujo de autenticación
- Optimización de consultas SQL

**Correcciones:**
- Fix error 401 en endpoints de HR
- Fix carga de empleados activos en formulario de período
- Fix cálculo de totales de nómina
- Fix actualización de elapsedPayroll en períodos

---

## 📞 Información de Contacto

- **Email:** soporte@cloudfly.com.co
- **Web:** https://cloudfly.com.co
- **Documentación:** https://docs.cloudfly.com.co

---

**CloudFly ERP Platform** - Gestión Empresarial Integral con Inteligencia Artificial

*Documento generado el: 20 de Diciembre 2025*
