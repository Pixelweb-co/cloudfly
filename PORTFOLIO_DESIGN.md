# Diseño del Módulo de Cartera (Portfolio Module)

## 1. Visión General
El módulo de cartera centralizará la gestión de cuentas por cobrar (CxC) y cuentas por pagar (CxP). Se integrará estrechamente con el "Maestro de Terceros" que en este sistema es la entidad **`Contact`**.

El objetivo es tener una visión 360° del estado financiero con cada tercero (Cliente, Proveedor, o ambos).

## 2. Modelo de Base de Datos (ERD Propuesto)

Se basará en la entidad existente `Contact` (tabla `contacts`) como eje central.

### 2.1. Entidades Principales

#### `PortfolioDocument` (Documento de Cartera)
Registro maestro de cada deuda o derecho de cobro. Unifica CxC y CxP.
- `id`: PK
- `tenant_id`: Para multi-tenancy
- `contact_id`: FK -> `contacts.id` (El Tercero)
- `type`: Enum (RECEIVABLE, PAYABLE) -> CxC (Ventas) o CxP (Compras)
- `document_source`: Enum (INVOICE, PURCHASE_ORDER, MANUAL, NOTE)
- `source_id`: ID del documento origen (ej. `invoices.id`)
- `document_number`: Número fiscal/referencia (ej. FV-1020, OS-5050)
- `issue_date`: Fecha emisión
- `due_date`: Fecha vencimiento
- `total_amount`: Valor total original
- `balance`: Saldo pendiente (se reduce con pagos)
- `status`: Enum (OPEN, PARTIAL, PAID, OVERDUE, ANNULLED)
- `currency`: "COP"
- `created_at`, `updated_at`

#### `PortfolioMovement` (Movimientos / Pagos / Cruces)
Registra cualquier transacción que afecte el saldo de un documento (Pagos, Notas Crédito, Cruces).
- `id`: PK
- `tenant_id`: PK
- `portfolio_document_id`: FK -> `PortfolioDocument.id`
- `movement_date`: Fecha
- `amount`: Valor aplicado (positivo reduce deuda, negativo aumenta o ajusta)
- `movement_type`: Enum (PAYMENT, CREDIT_NOTE, DEBIT_NOTE, ADJUSTMENT)
- `reference`: Referencia externa (ej. Recibo de Caja #555)
- `payment_method`: (Si es pago) CASH, TRANSFER, etc.
- `created_at`

#### `ContactBalance` (Resumen/Cache - Opcional)
Puede usarse la columna existente `Contact.current_balance`, pero se recomienda una tabla o vista materializada para desglose por antigüedad.
- (En principio usaremos `Contact.currentBalance` actualizado por eventos).

## 3. Integración con Entidades Existentes

### 3.1. Contact (Terceros)
Ya existe en `com.app.starter1.persistence.entity.Contact`.
- Tiene `type` (CUSTOMER, SUPPLIER, etc.).
- Tiene `currentBalance`.
- **Acción requerida**: Si Facturación usa `Customer` (tabla `clientes`) y Cartera usa `Contact` (tabla `contacts`), se debe asegurar que al facturar se identifique el `Contact` correcto.
    - *Estrategia*: Crear/Buscar el `Contact` correspondiente al `Customer` al momento de generar la cartera.

### 3.2. Invoice (Facturación)
- Al finalizar una factura (`InvoiceStatus.SENT`), se disparará un evento.
- El módulo de cartera capturará el evento, buscará el `Contact` asociado al `Invoice.customerId`, y creará el `PortfolioDocument` tipo `RECEIVABLE`.

## 4. Flujo Contable (Integración)

### 4.1. Cuentas por Cobrar (Receivable)
- **Origen**: Factura de Venta.
- **Contabilidad**: Dr 1305 (Clientes) vs Cr 4135 (Ingresos).
- **Cartera**: Crea `PortfolioDocument` (Balance positivo).

### 4.2. Recaudo (Payment)
- **Origen**: Ingreso de dinero (Recibo de Caja).
- **Contabilidad**: Dr 1105 (Caja) vs Cr 1305 (Clientes).
- **Cartera**: Crea `PortfolioMovement` (Reduce balance).

## 5. Implementación Spring Boot

### 5.1. Paquete `com.app.starter1.modules.portfolio` (Nuevo módulo sugerido o dentro de `persistence`)
Estructura propuesta:
- `domain/entity`: `PortfolioDocument`, `PortfolioMovement`.
- `repository`: `PortfolioDocumentRepository`.
- `service`: `PortfolioService`.
- `controller`: `PortfolioController`.

### 5.2. Lógica de Servicio (`PortfolioService`)
- `registerReceivable(Invoice invoice)`: Convierte Factura -> Documento Cartera.
- `registerPayment(PaymentDTO payment)`: Aplica pago a uno o varios documentos.
    - Soporte para "Mata-saldo": Aplicar pago a factura más antigua primero.
- `getAgingReport(Long contactId)`: Calcula edades de cartera (0-30, 31-60, etc.).

## 6. API Endpoints
- `GET /api/v1/portfolio/documents?contactId=X&status=OPEN`
- `POST /api/v1/portfolio/payments` (Registrar recaudo)
- `GET /api/v1/portfolio/dashboard` (Resumen general vencido vs corriente)

## 7. Plan de Trabajo Inmediato
1.  **DB Migration**: Crear tablas `portfolio_documents` y `portfolio_movements`.
2.  **Entidades JPA**: Implementar clases Java.
3.  **Listener**: Conectar con `InvoiceService` vía eventos.
4.  **Endpoint**: Listar cartera pendiente.
5.  **Frontend**: Vista de "Cuentas por Cobrar".
