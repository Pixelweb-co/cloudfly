# 📋 CloudFly ERP Platform - Resumen de Funcionalidades v1.0

**Fecha:** 20 de Diciembre 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Producción

---

## 📖 Descripción General

**CloudFly** es una plataforma ERP multi-tenant completa diseñada para la gestión empresarial integral. Combina funcionalidades de ventas, contabilidad, punto de venta (POS), recursos humanos, nómina, CRM, y comunicación omnicanal con inteligencia artificial.

### ✨ Características Principales

- 🏢 **Multi-tenant**: Soporte para múltiples empresas en una sola instancia
- 🤖 **IA Integrada**: Chatbots inteligentes con RAG (Retrieval Augmented Generation)
- 📱 **Omnicanal**: WhatsApp, Email, SMS, Facebook, Instagram, Telegram
- 📊 **Contabilidad Completa**: Cumple con principios contables NIIF (Colombia)
- 🛒 **POS Moderno**: Punto de venta rápido y eficiente
- 💰 **Nómina Colombiana**: Sistema completo de liquidación de nómina
- 🔄 **Automatización**: Flujos de trabajo con N8N
- 🔐 **Seguro**: Autenticación JWT, roles granulares, multi-factor

---

## 🏗️ Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Java | 17 | Lenguaje principal |
| Spring Boot | 3.4.0 | Framework backend |
| MySQL | 8.0 | Base de datos principal |
| JPA/Hibernate | - | ORM |
| Spring Security | - | Seguridad + JWT |
| Apache Kafka | - | Mensajería asíncrona |
| Flyway | - | Migraciones de BD |
| Swagger/OpenAPI | - | Documentación API |

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 14 | Framework React |
| React | 18+ | Librería UI |
| TypeScript | - | Lenguaje |
| Material-UI (MUI) | - | Componentes UI |
| Axios | - | Cliente HTTP |
| Socket.IO | - | Tiempo real |
| ApexCharts/Recharts | - | Gráficos |
| React Hook Form | - | Formularios |
| date-fns | - | Manejo de fechas |

### Infraestructura
| Servicio | Versión | Uso |
|----------|---------|-----|
| Docker | 20.10+ | Containerización |
| Docker Compose | 2.0+ | Orquestación |
| Traefik | 3.1 | Proxy inverso + SSL |
| Let's Encrypt | - | Certificados SSL |
| Portainer | - | Gestión Docker |
| Kafdrop | - | Monitor Kafka |

### Integraciones Externas
| Servicio | Uso |
|----------|-----|
| Evolution API | WhatsApp Business |
| N8N | Automatización de flujos |
| Qdrant | Base de datos vectorial (IA/RAG) |
| Chatwoot | Centro de atención al cliente |
| Redis | Cache y sesiones |
| PostgreSQL | BD para chatbot/Chatwoot |

---

## 📦 Módulos Funcionales Implementados

---

### 1. 🔐 Módulo de Autenticación y Usuarios

#### Entidades Backend
- `UserEntity` - Usuarios del sistema
- `RoleEntity` - Roles de usuario
- `PermissionEntity` - Permisos granulares

#### Funcionalidades Implementadas

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Login con JWT | ✅ | Autenticación con tokens seguros |
| Registro de usuarios | ✅ | Registro con validación de datos |
| Gestión de roles | ✅ | SUPERADMIN, ADMIN, CONTADOR, USER, BIOMEDICAL, HR |
| Gestión de permisos | ✅ | READ, WRITE, UPDATE, DELETE |
| Multi-tenant | ✅ | Separación de datos por customerId |
| Refresh tokens | ✅ | Renovación automática de sesión |
| Recuperación contraseña | ✅ | Flujo de recuperación por email |
| Validación username | ✅ | Alfanumérico + underscore, mínimo 8 caracteres |

#### Endpoints API
```
POST   /auth/login                    - Iniciar sesión
POST   /auth/register                 - Registro de usuario
POST   /auth/refresh-token            - Refrescar token
POST   /auth/forgot-password          - Recuperar contraseña
GET    /users                         - Listar usuarios
GET    /users/{id}                    - Obtener usuario por ID
POST   /users                         - Crear usuario
PUT    /users/{id}                    - Actualizar usuario
DELETE /users/{id}                    - Eliminar usuario
GET    /roles                         - Listar roles
POST   /roles                         - Crear rol
```

#### Páginas Frontend
- `/administracion/clientes` - Gestión de clientes/tenants
- `/accounts/users` - Gestión de usuarios del sistema

---

### 2. 💼 Módulo de Ventas

#### Entidades Backend
- `Quote` + `QuoteItem` - Cotizaciones
- `Order` + `OrderItem` - Pedidos
- `Invoice` + `InvoiceItem` - Facturas
- `QuoteStatus` - Estados de cotización
- `InvoiceStatus` - Estados de factura

#### 2.1 Cotizaciones (Quotes)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| CRUD completo | ✅ | Crear, leer, actualizar, eliminar |
| Múltiples ítems | ✅ | Productos con cantidades y precios |
| Estados | ✅ | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED |
| Conversión a pedido | ✅ | Transformar cotización en orden |
| Cálculos automáticos | ✅ | Subtotales, descuentos, IVA (19%) |
| Generación PDF | ✅ | Documento profesional |
| Envío por email | ✅ | Notificación al cliente |
| Numeración automática | ✅ | Consecutivo por tenant |

**Endpoints:**
```
GET    /quotes                        - Listar cotizaciones
GET    /quotes/{id}                   - Obtener cotización
POST   /quotes                        - Crear cotización
PUT    /quotes/{id}                   - Actualizar cotización
DELETE /quotes/{id}                   - Eliminar cotización
POST   /quotes/{id}/send              - Enviar por email
POST   /quotes/{id}/accept            - Aceptar cotización
POST   /quotes/{id}/reject            - Rechazar cotización
POST   /quotes/{id}/convert-to-order  - Convertir a pedido
GET    /quotes/{id}/pdf               - Generar PDF
```

**Páginas Frontend:**
- `/ventas/cotizaciones/list` - Lista de cotizaciones
- `/ventas/cotizaciones/form` - Formulario crear/editar
- `/ventas/cotizaciones/view` - Vista detalle

#### 2.2 Pedidos (Orders)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| CRUD completo | ✅ | Gestión de pedidos |
| Desde cotización | ✅ | Creación automática |
| Estados | ✅ | PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED |
| Gestión de stock | ✅ | Descuento automático de inventario |
| Facturación | ✅ | Generación de factura desde pedido |
| Tracking | ✅ | Seguimiento de estado |
| Integración POS | ✅ | Ventas desde punto de venta |

**Endpoints:**
```
GET    /orders                        - Listar pedidos
GET    /orders/{id}                   - Obtener pedido
POST   /orders                        - Crear pedido
PUT    /orders/{id}                   - Actualizar pedido
DELETE /orders/{id}                   - Cancelar pedido
POST   /orders/{id}/confirm           - Confirmar pedido
POST   /orders/{id}/complete          - Completar pedido
PATCH  /orders/{id}/status            - Cambiar estado
```

**Páginas Frontend:**
- `/ventas/pedidos/list` - Lista de pedidos
- `/ventas/pedidos/form` - Formulario crear/editar
- `/ventas/pedidos/view` - Vista detalle

#### 2.3 Facturas (Invoices)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| CRUD completo | ✅ | Gestión de facturas |
| Desde pedido | ✅ | Generación automática |
| Numeración | ✅ | Consecutivo automático |
| Estados | ✅ | DRAFT, ISSUED, PAID, CANCELLED |
| Cálculo impuestos | ✅ | IVA 19% Colombia |
| PDF profesional | ✅ | Documento listo para imprimir |
| Envío email | ✅ | Notificación al cliente |

**Endpoints:**
```
GET    /invoices                      - Listar facturas
GET    /invoices/{id}                 - Obtener factura
POST   /invoices                      - Crear factura
PUT    /invoices/{id}                 - Actualizar factura
DELETE /invoices/{id}                 - Anular factura
POST   /invoices/{id}/send            - Enviar por email
POST   /invoices/{id}/mark-paid       - Marcar como pagada
GET    /invoices/{id}/pdf             - Generar PDF
```

**Páginas Frontend:**
- `/ventas/facturas/list` - Lista de facturas
- `/ventas/facturas/form` - Formulario crear/editar
- `/ventas/facturas/view` - Vista detalle

---

### 3. 📚 Módulo de Contabilidad

#### Entidades Backend
- `ChartOfAccount` - Plan de cuentas
- `CostCenter` - Centros de costo
- `AccountingVoucher` - Comprobantes contables
- `AccountingEntry` - Líneas de movimiento
- `FiscalPeriod` - Períodos fiscales
- `TaxWithholding` - Retenciones

#### 3.1 Plan de Cuentas (Chart of Accounts)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Estructura jerárquica | ✅ | 5 niveles de profundidad |
| Tipos de cuenta | ✅ | ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO |
| Naturaleza | ✅ | DÉBITO, CRÉDITO |
| Cuentas auxiliares | ✅ | Cuentas de movimiento |
| Cuentas totalizadoras | ✅ | Cuentas resumen |
| PUC Colombia | ✅ | Plan único de cuentas precargado |
| Validación unicidad | ✅ | Códigos únicos por tenant |
| requiresThirdParty | ✅ | Indica si requiere tercero |
| requiresCostCenter | ✅ | Indica si requiere centro de costo |

**Endpoints:**
```
GET    /chart-of-accounts             - Listar cuentas
GET    /chart-of-accounts/{id}        - Obtener cuenta
POST   /chart-of-accounts             - Crear cuenta
PUT    /chart-of-accounts/{id}        - Actualizar cuenta
DELETE /chart-of-accounts/{id}        - Eliminar cuenta
GET    /chart-of-accounts/hierarchy   - Árbol jerárquico
GET    /chart-of-accounts/type/{type} - Filtrar por tipo
```

**Páginas Frontend:**
- `/contabilidad/plan-cuentas` - Gestión del plan de cuentas

#### 3.2 Centros de Costo (Cost Centers)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Estructura jerárquica | ✅ | Relación padre-hijo |
| Códigos únicos | ✅ | Por tenant |
| Estado activo/inactivo | ✅ | Control de disponibilidad |
| Asignación contable | ✅ | En movimientos de comprobantes |
| Integración nómina | ✅ | Asignación a empleados |
| Reportes por centro | ✅ | Costos por departamento |

**Endpoints:**
```
GET    /cost-centers                  - Listar centros
GET    /cost-centers/{id}             - Obtener centro
POST   /cost-centers                  - Crear centro
PUT    /cost-centers/{id}             - Actualizar centro
DELETE /cost-centers/{id}             - Desactivar centro
GET    /cost-centers/root             - Centros raíz
GET    /cost-centers/children/{id}    - Centros hijos
```

**Páginas Frontend:**
- `/contabilidad/centros-costo` - Gestión de centros de costo

#### 3.3 Comprobantes Contables (Accounting Vouchers)

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Tipos | ✅ | INGRESO, EGRESO, NOTA_CONTABLE, APERTURA, CIERRE |
| Estados | ✅ | DRAFT (borrador), POSTED (contabilizado), VOID (anulado) |
| Numeración automática | ✅ | Por tipo de comprobante |
| Validación partida doble | ✅ | Débitos = Créditos |
| Múltiples líneas | ✅ | Entradas de movimiento ilimitadas |
| Terceros | ✅ | Asociación con contactos |
| Centros de costo | ✅ | Por línea de movimiento |
| Control de edición | ✅ | Solo borradores editables |
| Generación automática | ✅ | Desde ventas y nómina |
| Año y período fiscal | ✅ | Control de cierre |

**Endpoints:**
```
GET    /accounting/vouchers           - Listar comprobantes
GET    /accounting/vouchers/{id}      - Obtener comprobante
POST   /accounting/vouchers           - Crear comprobante
PUT    /accounting/vouchers/{id}      - Actualizar borrador
DELETE /accounting/vouchers/{id}      - Eliminar borrador
POST   /accounting/vouchers/{id}/post - Contabilizar (POSTED)
POST   /accounting/vouchers/{id}/void - Anular (VOID)
```

**Páginas Frontend:**
- `/contabilidad/comprobantes` - Gestión de comprobantes

#### 3.4 Reportes Contables

| Reporte | Estado | Descripción |
|---------|--------|-------------|
| Libro Diario | ✅ | Movimientos cronológicos |
| Libro Mayor | ✅ | Movimientos por cuenta |
| Balance de Prueba | ✅ | Saldos de todas las cuentas |
| Estado de Resultados | ✅ | Ingresos vs gastos |
| Balance General | ✅ | Activos, pasivos, patrimonio |

**Endpoints:**
```
GET    /api/accounting/reports/libro-diario      
       ?tenantId&fromDate&toDate&accountCode?

GET    /api/accounting/reports/libro-mayor       
       ?tenantId&accountCode&fromDate&toDate

GET    /api/accounting/reports/balance-prueba    
       ?tenantId&asOfDate

GET    /api/accounting/reports/estado-resultados 
       ?tenantId&fromDate&toDate

GET    /api/accounting/reports/balance-general   
       ?tenantId&asOfDate
```

**Páginas Frontend:**
- `/contabilidad/libro-diario` - Libro diario
- `/contabilidad/libro-mayor` - Libro mayor
- `/contabilidad/balance-prueba` - Balance de prueba
- `/contabilidad/estado-resultados` - Estado de resultados
- `/contabilidad/balance-general` - Balance general

---

### 4. 👥 Módulo de Recursos Humanos (HR) y Nómina

#### Entidades Backend (8)
- `Employee` - Empleados
- `PayrollConcept` - Conceptos de nómina
- `EmployeePayrollConcept` - Conceptos asignados por empleado
- `PayrollConfiguration` - Configuración de nómina
- `PayrollPeriod` - Períodos de nómina
- `PayrollIncidence` / `PayrollNovelty` - Novedades/Incidencias
- `PayrollReceipt` - Recibos de nómina
- `PayrollReceiptDetail` - Detalle de recibos

#### Servicios Backend (12)
- `EmployeeService` - CRUD y gestión de empleados
- `PayrollConceptService` - Conceptos con inicialización
- `PayrollConfigurationService` - Configuración de parámetros
- `PayrollPeriodService` - Gestión de períodos
- `PayrollCalculationService` - Cálculos de nómina colombiana
- `PayrollProcessingService` - Procesamiento end-to-end
- `PayrollLiquidationService` - Liquidación de períodos
- `PayrollAccountingService` - Integración contable (stored procedures)
- `PayrollPdfService` - Generación de PDFs
- `PayrollReceiptPdfService` - PDF de desprendibles
- `PayrollNotificationService` - Notificaciones
- `PayrollCostCenterReportService` - Reportes por centro de costo
- `HRDemoDataService` - Datos de demostración

#### 4.1 Gestión de Empleados

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| CRUD completo | ✅ | Crear, leer, actualizar, desactivar |
| Datos personales | ✅ | Nombre, documento, email, teléfono, dirección |
| Datos laborales | ✅ | Cargo, fecha ingreso, tipo contrato |
| Salario base | ✅ | Salario mensual |
| Centro de costos | ✅ | Asignación a departamento |
| Conceptos fijos | ✅ | Percepciones y deducciones recurrentes |
| Estado activo/inactivo | ✅ | Control de nómina activa |
| Cuenta bancaria | ✅ | Para pagos electrónicos |
| WhatsApp | ✅ | Para notificaciones |

**Endpoints:**
```
GET    /api/hr/employees              - Listar empleados
GET    /api/hr/employees/{id}         - Obtener empleado
POST   /api/hr/employees              - Crear empleado
PUT    /api/hr/employees/{id}         - Actualizar empleado
DELETE /api/hr/employees/{id}         - Desactivar empleado
GET    /api/hr/employees/active       - Solo empleados activos
```

**Páginas Frontend:**
- `/hr/employees` - Lista de empleados
- `/hr/employees/form` - Formulario crear/editar
- `/hr/employees/view` - Vista detalle

#### 4.2 Conceptos de Nómina

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Tipos | ✅ | EARNING (percepción), DEDUCTION (deducción) |
| Recurrentes | ✅ | Se aplican automáticamente cada período |
| Eventuales | ✅ | Se aplican por novedad |
| Cálculo automático | ✅ | Salud, pensión, fondo solidaridad |
| Inicialización | ✅ | Conceptos base colombianos precargados |
| Cuenta contable | ✅ | Para integración contable |

**Conceptos Precargados:**
- Salario básico
- Auxilio de transporte
- Horas extras (diurnas/nocturnas)
- Salud empleado (4%)
- Pensión empleado (4%)
- Fondo de solidaridad pensional (1%)
- Bonificaciones
- Comisiones

**Endpoints:**
```
GET    /api/hr/concepts               - Listar conceptos
GET    /api/hr/concepts/{id}          - Obtener concepto
POST   /api/hr/concepts               - Crear concepto
PUT    /api/hr/concepts/{id}          - Actualizar concepto
POST   /api/hr/concepts/initialize    - Inicializar conceptos base
```

**Páginas Frontend:**
- `/hr/concepts` - Gestión de conceptos

#### 4.3 Configuración de Nómina

| Parámetro | Estado | Descripción |
|-----------|--------|-------------|
| Salario mínimo | ✅ | $1,423,500 COP (2025) |
| Auxilio transporte | ✅ | $200,000 COP (2025) |
| Tope auxilio transporte | ✅ | 2 SMMLV |
| Aporte salud empleado | ✅ | 4% |
| Aporte salud empleador | ✅ | 8.5% |
| Aporte pensión empleado | ✅ | 4% |
| Aporte pensión empleador | ✅ | 12% |
| Aporte ARL | ✅ | Variable por riesgo |
| Parafiscales | ✅ | SENA, ICBF, Caja compensación |
| Retención en la fuente | ✅ | UVT y tabla de retención |
| Primas | ✅ | Cálculo semestral |
| Cesantías | ✅ | Cálculo anual |
| Intereses cesantías | ✅ | 12% anual |
| Vacaciones | ✅ | 15 días hábiles por año |

**Endpoints:**
```
GET    /api/hr/config                 - Obtener configuración
PUT    /api/hr/config                 - Actualizar configuración
```

**Páginas Frontend:**
- `/hr/config` - Configuración de nómina

#### 4.4 Períodos de Nómina

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Tipos de período | ✅ | WEEKLY, BIWEEKLY, MONTHLY |
| Estados | ✅ | OPEN, LIQUIDATED, PARTIALLY_PAID, PAID, CLOSED |
| Fechas | ✅ | Inicio, fin, pago |
| Total nómina | ✅ | Suma automática de recibos |
| Total pagado | ✅ | Tracking de pagos realizados |
| Asignación empleados | ✅ | Selección de empleados a liquidar |

**Endpoints:**
```
GET    /api/hr/periods                - Listar períodos
GET    /api/hr/periods/{id}           - Obtener período
POST   /api/hr/periods                - Crear período
PUT    /api/hr/periods/{id}           - Actualizar período
DELETE /api/hr/periods/{id}           - Eliminar período
```

**Páginas Frontend:**
- `/hr/periods` - Lista de períodos
- `/hr/period/form` - Formulario crear/editar
- `/hr/period/view` - Vista detalle con recibos

#### 4.5 Novedades e Incidencias

| Tipo | Estado | Descripción |
|------|--------|-------------|
| BONUS | ✅ | Bonificaciones |
| COMMISSION | ✅ | Comisiones |
| OVERTIME_DAY | ✅ | Horas extras diurnas (25%) |
| OVERTIME_NIGHT | ✅ | Horas extras nocturnas (75%) |
| OVERTIME_SUNDAY | ✅ | Horas extras dominicales (100%) |
| OVERTIME_HOLIDAY | ✅ | Horas extras festivos (150%) |
| ABSENCE | ✅ | Inasistencia |
| LATE | ✅ | Llegada tarde |
| SICK_LEAVE | ✅ | Incapacidad |
| VACATION | ✅ | Vacaciones |
| LOAN | ✅ | Préstamos |
| ADVANCE | ✅ | Anticipos |

**Endpoints:**
```
GET    /api/hr/novelties              - Listar novedades
POST   /api/hr/novelties              - Crear novedad
PUT    /api/hr/novelties/{id}         - Actualizar novedad
DELETE /api/hr/novelties/{id}         - Eliminar novedad
```

**Páginas Frontend:**
- `/hr/novelties` - Gestión de novedades

#### 4.6 Liquidación y Pago de Nómina

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Cálculo masivo | ✅ | Todos los empleados del período |
| Generación de recibos | ✅ | Un recibo por empleado |
| Aplicación de novedades | ✅ | Automática |
| Pago individual | ✅ | Con referencia de pago |
| Notificación WhatsApp | ✅ | Mensaje con PDF adjunto |
| Notificación Email | ✅ | Complementaria |
| PDF desprendible | ✅ | Documento profesional |
| Auto-actualización estados | ✅ | PARTIALLY_PAID → PAID |
| Comprobante contable | ✅ | Generación automática vía stored procedure |

**Flujo de Estados:**
```
OPEN → LIQUIDATED → PARTIALLY_PAID → PAID → CLOSED
```

**Endpoints:**
```
POST   /api/hr/payroll/periods/{id}/liquidate    - Liquidar período
POST   /api/hr/payroll/periods/{id}/process      - Procesar nómina
POST   /api/hr/payroll/periods/{id}/approve      - Aprobar nómina
POST   /api/hr/payroll/receipts/{id}/pay         - Pagar empleado
GET    /api/hr/payroll/periods/{id}/receipts     - Listar recibos
GET    /api/hr/payroll/receipts/{id}             - Ver recibo
GET    /api/hr/payroll/receipts/{id}/pdf         - Descargar PDF
```

**Páginas Frontend:**
- `/hr/process` - Procesamiento interactivo
- `/hr/receipts` - Consulta de recibos
- `/hr/period/view` - Vista con tabla de recibos y botones de pago

#### 4.7 Reportes de Nómina

| Reporte | Estado | Descripción |
|---------|--------|-------------|
| Costo por Centro de Costos | ✅ | Distribución de nómina por departamento |
| Resumen de período | ✅ | Totales del período |
| Detalle de recibos | ✅ | Conceptos por empleado |
| Histórico de empleado | ✅ | Nóminas anteriores |

**Endpoints:**
```
GET    /api/hr/reports/cost-by-center - Costo por centro de costos
```

**Páginas Frontend:**
- `/hr/reports/cost-by-center` - Reporte costo por centro
- `/hr/dashboard` - Dashboard de HR con métricas

---

### 5. 🛍️ Módulo de Punto de Venta (POS)

#### Entidades Backend
- `Product` - Productos
- `Category` - Categorías

#### 5.1 Productos

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| CRUD completo | ✅ | Gestión de productos |
| SKU único | ✅ | Identificador de producto |
| Categorización | ✅ | Organización jerárquica |
| Precio de venta | ✅ | Con impuesto incluido |
| Costo | ✅ | Para cálculo de margen |
| Stock actual | ✅ | Inventario disponible |
| Stock mínimo | ✅ | Alertas de reposición |
| Código de barras | ✅ | Para escaneo rápido |
| Imágenes | ✅ | Múltiples imágenes |
| Tasa de impuesto | ✅ | IVA configurable |
| Cuenta contable ingreso | ✅ | Para contabilización |
| Cuenta contable costo | ✅ | Para contabilización |
| Estado activo/inactivo | ✅ | Control de disponibilidad |

**Endpoints:**
```
GET    /productos                     - Listar productos
GET    /productos/{id}                - Obtener producto
POST   /productos                     - Crear producto
PUT    /productos/{id}                - Actualizar producto
DELETE /productos/{id}                - Eliminar producto
GET    /productos/categoria/{id}      - Por categoría
GET    /productos/low-stock           - Stock bajo
```

**Páginas Frontend:**
- `/ventas/productos/list` - Lista de productos
- `/ventas/productos/form` - Formulario crear/editar
- `/ventas/productos/view` - Vista detalle

#### 5.2 Categorías

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| CRUD completo | ✅ | Gestión de categorías |
| Jerarquía | ✅ | Categorías padre-hijo |
| Estado activo/inactivo | ✅ | Control de visibilidad |
| Icono | ✅ | Representación visual |

**Endpoints:**
```
GET    /categorias                    - Listar categorías
GET    /categorias/{id}               - Obtener categoría
POST   /categorias                    - Crear categoría
PUT    /categorias/{id}               - Actualizar categoría
DELETE /categorias/{id}               - Eliminar categoría
PATCH  /categorias/{id}               - Actualización parcial
```

**Páginas Frontend:**
- `/ventas/categorias/list` - Lista de categorías
- `/ventas/categorias/form` - Formulario crear/editar

#### 5.3 Interfaz POS

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Selección rápida | ✅ | Grid visual de productos |
| Búsqueda | ✅ | Por nombre, SKU, código de barras |
| Carrito | ✅ | Productos seleccionados |
| Cantidades | ✅ | Ajuste de cantidad |
| Descuentos | ✅ | Por ítem o total |
| Métodos de pago | ✅ | Efectivo, tarjeta, transferencia |
| Impresión ticket | ✅ | Recibo de venta |
| Selección cliente | ✅ | Asociar venta a contacto |

**Páginas Frontend:**
- `/apps/pos` - Interfaz de punto de venta

---

### 6. 👥 Módulo de CRM (Contactos)

#### Entidades Backend
- `Contact` - Contactos (clientes, proveedores, empleados)
- `ContactType` - Tipo de contacto

#### Funcionalidades Implementadas

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Tipos de contacto | ✅ | CUSTOMER, SUPPLIER, EMPLOYEE, OTHER |
| Información personal | ✅ | Nombre, email, teléfono, dirección |
| Información fiscal | ✅ | NIT, CC, tipo documento |
| Pipeline Kanban | ✅ | LEAD, POTENTIAL, CLIENT |
| Cuenta por cobrar | ✅ | Para integración contable |
| Cuenta por pagar | ✅ | Para integración contable |
| Cuenta de anticipos | ✅ | Para integración contable |
| Avatar/foto | ✅ | Imagen de perfil |
| Estado activo/inactivo | ✅ | Control de disponibilidad |

**Endpoints:**
```
GET    /contacts                      - Listar contactos
GET    /contacts/{id}                 - Obtener contacto
POST   /contacts                      - Crear contacto
PUT    /contacts/{id}                 - Actualizar contacto
DELETE /contacts/{id}                 - Eliminar contacto
GET    /contacts/type/{type}          - Filtrar por tipo
GET    /contacts/stage/{stage}        - Filtrar por etapa
```

**Páginas Frontend:**
- `/marketing/contacts/list` - Lista de contactos con Kanban

---

### 7. 🤖 Módulo de Chatbot e IA

#### Entidades Backend
- `ChatbotConfig` - Configuración global
- `ChatbotTypeConfig` - Configuración por tipo
- `ChatbotType` - Tipos de chatbot

#### 7.1 Configuración de Chatbot

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Tipos de chatbot | ✅ | SALES, SCHEDULING, SUPPORT, CUSTOM |
| Configuración por tenant | ✅ | Cada empresa su chatbot |
| Integración WhatsApp | ✅ | Vía Evolution API |
| RAG con Qdrant | ✅ | Búsqueda semántica en documentos |
| Flujos N8N | ✅ | Automatización de respuestas |
| Webhooks | ✅ | Notificaciones personalizadas |
| Prompts personalizados | ✅ | Comportamiento del bot |

**Endpoints:**
```
GET    /chatbot-types                 - Listar configuraciones
GET    /chatbot-types/{id}            - Obtener configuración
POST   /chatbot-types                 - Crear configuración
PUT    /chatbot-types/{id}            - Actualizar configuración
DELETE /chatbot-types/{id}            - Eliminar configuración
POST   /chatbot-types/{id}/activate   - Activar chatbot
POST   /chatbot-types/{id}/deactivate - Desactivar chatbot
```

**Páginas Frontend:**
- `/settings/chatbot` - Configuración de chatbot

#### 7.2 Gestión de Instancias WhatsApp

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Crear instancia | ✅ | Nueva conexión WhatsApp |
| Generar QR | ✅ | Para escanear con teléfono |
| Estado conexión | ✅ | Conectado/Desconectado |
| Desconectar | ✅ | Logout de WhatsApp |
| Reconectar | ✅ | Generar nuevo QR |
| Reiniciar | ✅ | Restart de instancia |
| Eliminar | ✅ | Borrar instancia |

**Endpoints:**
```
GET    /api/chatbot                       - Listar instancias
GET    /api/chatbot/{instanceName}        - Obtener instancia
POST   /api/chatbot                       - Crear instancia
DELETE /api/chatbot/{instanceName}        - Eliminar instancia
POST   /api/chatbot/{instanceName}/logout - Desconectar
POST   /api/chatbot/{instanceName}/restart- Reiniciar
GET    /api/chatbot/{instanceName}/qr     - Obtener QR
```

---

### 8. 💬 Módulo de Comunicación Omnicanal

#### Entidades Backend
- `OmniChannelMessage` - Mensajes omnicanal
- `MessagePlatform` - Plataformas
- `MessageDirection` - Dirección del mensaje
- `MessageStatus` - Estados
- `MessageType` - Tipos de mensaje
- `MessageProvider` - Proveedores
- `Media` - Archivos multimedia

#### Canales Soportados

| Canal | Estado | Proveedor |
|-------|--------|-----------|
| WhatsApp | ✅ | Evolution API |
| Email | ✅ | SMTP |
| SMS | ✅ | Twilio |
| Facebook Messenger | ✅ | Meta API |
| Instagram DM | ✅ | Meta API |
| Telegram | ✅ | Telegram Bot API |

#### Funcionalidades

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Envío de mensajes | ✅ | A cualquier canal |
| Recepción | ✅ | Webhook unificado |
| Estados | ✅ | PENDING, SENT, DELIVERED, READ, FAILED |
| Tipos de mensaje | ✅ | TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT, LOCATION |
| Almacenamiento media | ✅ | Archivos en servidor |
| Historial conversación | ✅ | Por contacto |
| Centro de atención | ✅ | Chatwoot integrado |
| Socket.IO tiempo real | ✅ | Notificaciones instantáneas |

**Endpoints:**
```
GET    /api/chat/messages                 - Listar mensajes
POST   /api/chat/messages/send            - Enviar mensaje
GET    /api/chat/conversations/{contactId}- Conversación
POST   /api/chat/upload-media             - Subir archivo
PATCH  /api/chat/messages/{id}/status     - Actualizar estado
```

**Páginas Frontend:**
- `/comunicaciones/conversaciones` - Bandeja de mensajes

---

### 9. 📊 Módulo de Dashboard

#### Servicios Backend
- `DashboardService` - Métricas y KPIs

#### Funcionalidades

| Métrica | Estado | Descripción |
|---------|--------|-------------|
| Ventas del día | ✅ | Total ventas hoy |
| Ventas del mes | ✅ | Total ventas mes actual |
| Ventas del año | ✅ | Total ventas año actual |
| Productos más vendidos | ✅ | Top 10 productos |
| Pedidos recientes | ✅ | Últimos 10 pedidos |
| Stock crítico | ✅ | Productos bajo mínimo |
| Clientes nuevos | ✅ | Por período |
| Ingresos vs Gastos | ✅ | Resumen contable |
| Gráficos de tendencia | ✅ | Ventas por día/mes |

**Endpoints:**
```
GET    /dashboard/overview            - Resumen general
GET    /dashboard/sales-summary       - Resumen de ventas
GET    /dashboard/top-products        - Productos top
GET    /dashboard/recent-orders       - Pedidos recientes
GET    /dashboard/accounting-summary  - Resumen contable
GET    /dashboard/kpis                - KPIs generales
```

**Páginas Frontend:**
- `/home` - Dashboard principal
- `/dashboards` - Dashboards adicionales

---

### 10. 📁 Módulo de Documentos

#### Servicios Backend
- `DocumentStorageService` - Almacenamiento
- `FileSystemStorageService` - Sistema de archivos
- `MediaService` - Gestión de medios

#### Funcionalidades

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Subida de archivos | ✅ | Múltiples formatos |
| Categorización | ✅ | Por tipo y entidad |
| Metadatos | ✅ | Nombre, tipo, tamaño, fecha |
| Búsqueda | ✅ | Por nombre y tipo |
| Descarga | ✅ | Archivos originales |
| Vista previa | ✅ | Imágenes y PDFs |
| Asociación | ✅ | A solicitudes, empleados, etc. |

**Endpoints:**
```
GET    /document                      - Listar documentos
GET    /document/{id}                 - Obtener documento
POST   /document/upload               - Subir documento
DELETE /document/{id}                 - Eliminar documento
GET    /document/{id}/download        - Descargar
GET    /media                         - Listar medios
POST   /media/upload                  - Subir medio
```

---

### 11. 🔧 Módulos Adicionales

#### 11.1 Solicitudes (para gestión biomédica)

| Funcionalidad | Estado |
|---------------|--------|
| CRUD de solicitudes | ✅ |
| Estados de solicitud | ✅ |
| Asignación a técnicos | ✅ |
| Worklist | ✅ |
| Firmas digitales | ✅ |

**Páginas Frontend:**
- `/solicitudes/list` - Lista de solicitudes
- `/solicitudes/view` - Vista detalle
- `/solicitudes/worklist` - Lista de trabajo

#### 11.2 Tipos de Dispositivo y Servicio

| Funcionalidad | Estado |
|---------------|--------|
| Tipos de dispositivo | ✅ |
| Tipos de servicio | ✅ |
| Plantillas de verificación | ✅ |
| Checklists | ✅ |

**Páginas Frontend:**
- `/administracion/tipodispositivo` - Tipos de dispositivo
- `/administracion/tiposervicio` - Tipos de servicio
- `/administracion/plantillasverificacion` - Plantillas

#### 11.3 Calendario

| Funcionalidad | Estado |
|---------------|--------|
| Vista calendario | ✅ |
| Eventos | ✅ |
| Agendamiento | ✅ |

**Páginas Frontend:**
- `/calendar` - Calendario

#### 11.4 Planes y Suscripciones

| Funcionalidad | Estado |
|---------------|--------|
| Gestión de planes | ✅ |
| Suscripciones por tenant | ✅ |
| Estados de suscripción | ✅ |

---

## 🔐 Seguridad

### Características Implementadas

| Característica | Estado | Descripción |
|----------------|--------|-------------|
| Autenticación JWT | ✅ | Tokens seguros |
| Refresh Tokens | ✅ | Renovación automática |
| Roles granulares | ✅ | SUPERADMIN, ADMIN, CONTADOR, USER, BIOMEDICAL, HR |
| Permisos | ✅ | READ, WRITE, UPDATE, DELETE |
| CORS configurado | ✅ | Orígenes permitidos |
| HTTPS | ✅ | SSL con Let's Encrypt |
| Rate limiting | ✅ | Control de requests |
| SQL Injection protection | ✅ | JPA/Hibernate |
| XSS protection | ✅ | Sanitización |
| CSRF protection | ✅ | Tokens CSRF |
| BCrypt passwords | ✅ | Hash seguro |
| Multi-tenancy | ✅ | customerId en todas las tablas |

### Matriz de Permisos por Endpoint

| Módulo | SUPERADMIN | ADMIN | CONTADOR | USER | BIOMEDICAL | HR |
|--------|------------|-------|----------|------|------------|-----|
| /users | ✅ CRUD | ✅ CRUD | ❌ | ✅ R | ✅ R | ❌ |
| /roles | ✅ CRUD | ✅ R | ❌ | ❌ | ❌ | ❌ |
| /productos | ✅ CRUD | ✅ CRUD | ❌ | ✅ R | ✅ CRUD | ❌ |
| /quotes | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD | ❌ |
| /orders | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD | ❌ |
| /invoices | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD | ❌ |
| /contacts | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD | ❌ |
| /chart-of-accounts | ✅ CRUD | ✅ CRUD | ❌ | ✅ R | ✅ R | ❌ |
| /accounting/vouchers | ✅ CRUD | ✅ CRUD | ✅ R | ❌ | ❌ | ❌ |
| /api/accounting | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| /cost-centers | ✅ CRUD | ✅ CRUD | ❌ | ✅ R | ✅ R | ❌ |
| /api/hr | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| /chatbot-types | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| /api/chatbot | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD | ❌ |
| /dashboard | ✅ R | ✅ R | ❌ | ✅ R | ✅ R | ❌ |

---

## 📊 Métricas del Proyecto

### Backend
| Métrica | Cantidad |
|---------|----------|
| Entidades JPA | 47 |
| Repositorios | 32+ |
| Servicios (persistence) | 25 |
| Servicios (services) | 20 |
| Controllers | 33 |
| DTOs | 68+ |
| Endpoints REST | ~200+ |

### Frontend
| Métrica | Cantidad |
|---------|----------|
| Páginas (App Router) | ~60+ |
| Views | 395+ archivos |
| Componentes | ~100+ |
| Servicios API | ~15 |
| Tipos TypeScript | 29+ |

### Documentación
| Métrica | Cantidad |
|---------|----------|
| Documentos en /docs | 58 |
| Scripts de prueba | 15+ |

---

## 📝 Notas de Versión

### v1.0.0 (20 Diciembre 2025)

#### Nuevas Funcionalidades
- ✅ Sistema completo de nómina colombiana
- ✅ Cálculo de aportes a seguridad social
- ✅ Integración contable automática desde nómina (stored procedures)
- ✅ Reportes de costo por centro de costos
- ✅ Notificaciones WhatsApp para pagos de nómina
- ✅ Generación de PDF de desprendibles
- ✅ Comprobantes contables automáticos desde nómina

#### Mejoras
- ✅ Validación de usuarios con nombres y apellidos
- ✅ Validación de username (alfanumérico + underscore, mínimo 8 caracteres)
- ✅ Mejoras en flujo de autenticación
- ✅ Optimización de consultas SQL
- ✅ Mejoras en interfaz de período de nómina

#### Correcciones
- ✅ Fix error 401 en endpoints de HR
- ✅ Fix carga de empleados activos en formulario de período
- ✅ Fix cálculo de totales de nómina
- ✅ Fix actualización de elapsedPayroll en períodos
- ✅ Fix creación de empleados con centro de costos

---

## 🚀 Deployment

### URLs de Producción
- **Frontend:** https://dashboard.cloudfly.com.co
- **Backend API:** https://api.cloudfly.com.co
- **N8N:** https://autobot.cloudfly.com.co
- **Chatwoot:** https://chatcenter.cloudfly.com.co

### Usuarios por Defecto
```
Superadmin:
  Email: admin@cloudfly.com
  Password: admin123

Contador:
  Email: contador@cloudfly.com
  Password: contador123
```

### Requisitos del Sistema
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM mínimo
- 50GB espacio en disco

---

## 📞 Información de Contacto

- **Email:** soporte@cloudfly.com.co
- **Web:** https://cloudfly.com.co
- **Documentación:** https://docs.cloudfly.com.co

---

**CloudFly ERP Platform** - Gestión Empresarial Integral con Inteligencia Artificial

*Documento generado el: 20 de Diciembre 2025*
*Desarrollado con ❤️ por el equipo de CloudFly - Colombia 🇨🇴*
