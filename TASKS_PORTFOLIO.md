# Lista de Tareas - Módulo de Cartera

## Configuración y Base de Datos
- [x] Crear Migración V33 (Tablas: portfolio_documents, portfolio_payments, portfolio_applications)
- [x] Crear Migración V34 (Insertar módulo en menú lateral)
- [ ] Configurar application.properties con credenciales (Usuario debe verificar si no tengo acceso)

## Backend (Spring Boot)
### Entidades
- [x] PortfolioDocument
- [x] PortfolioPayment
- [x] PortfolioApplication
- [x] Enums (Type, Status, PaymentType)

### Repositorios
- [x] PortfolioDocumentRepository
- [x] PortfolioPaymentRepository
- [x] PortfolioApplicationRepository

### DTOs
- [x] PortfolioDocumentDTO
- [x] PortfolioPaymentDTO (& PaymentRequestDTO)
- [x] PortfolioSummaryDTO (Implemented logical summary in service)

### Servicios
- [x] PortfolioService (Lógica principal)
    - [x] `createReceivableFromInvoice`
    - [x] `registerPayment`
    - [x] `getBalances`
- [x] EventListener (InvoiceCreated -> Create PortfolioDocument)

### Controladores
- [x] PortfolioController (Endpoints REST)

## Frontend (Next.js)
### Vistas
- [ ] Dashboard Cartera (/cartera/dashboard)
- [ ] Lista Cuentas por Cobrar (/cartera/cuentas-cobrar)
- [ ] Detalle Documento
- [ ] Formulario Recaudo (Modal o Página)

### Integración
- [ ] Cliente HTTP (Axios services)
- [ ] Hooks (usePortfolio)
