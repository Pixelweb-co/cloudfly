# 🚀 CLOUDFLY-DIAN-SERVICE

Microservicio completo para procesamiento de documentos electrónicos DIAN Colombia.

## 📋 Descripción

Microservicio independiente que procesa documentos electrónicos (facturas y nómina) para la DIAN. 
Opera como consumidor de eventos Kafka, genera XMLs UBL 2.1, firma digitalmente y envía a los servicios oficiales DIAN.

### Características

- ✅ Arquitectura limpia (Domain, Application, Infrastructure, API)
- ✅ Multi-tenant
- ✅ Event-driven (Kafka)
- ✅ Procesamiento asíncrono
- ✅ Firma digital XML con XAdES-BES
- ✅ Generación XML UBL 2.1 y Nómina 1.0
- ✅ Integración con API DIAN (SOAP)
- ✅ API REST para consultas
- ✅ Docker/Docker Compose
- ✅ Health checks y métricas

---

## 🏗️ Arquitectura

```
cloudfly-dian-service/
├── dian-common/                   # Módulo compartido (eventos, DTOs)
│   └── src/main/java/co/cloudfly/dian/common/
│       ├── enums/                 # Enums (DocumentType, Status, Origin)
│       ├── event/                 # ElectronicDocumentEvent
│       ├── payload/               # Payloads (Invoice, Payroll)
│       └── dto/                   # DTOs compartidos (Party, Line, etc.)
│
└── dian-core/                     # Módulo principal
    └── src/main/java/co/cloudfly/dian/core/
        ├── domain/                # Capa de dominio
        │   ├── entity/            # Entidades JPA
        │   └── repository/        # Repositorios
        ├── application/           # Lógica de negocio
        │   ├── service/           # Servicios
        │   ├── dto/               # DTOs de aplicación
        │   └── processor/         # Procesadores por tipo
        ├── infrastructure/        # Infraestructura
        │   ├── kafka/             # Kafka consumer
        │   ├── client/            # Clientes REST/SOAP
        │   ├── signer/            # Firma digital
        │   └── xml/               # Generadores XML
        └── api/                   # Controladores REST
```

---

## 🔄 Flujo de Procesamiento

1. **ERP envía evento** a Kafka (`dian.electronic-documents`)
2. **Consumer recibe** y guarda con estado `RECEIVED`
3. **Consulta configuración** DIAN al ERP (REST)
4. **Genera XML** UBL 2.1 o Nómina
5. **Firma XML** con certificado .p12
6. **Envía a DIAN** vía SOAP
7. **Guarda respuesta** (CUFE/CUNE, XMLs, estado)
8. **ERP consulta** resultado vía REST

---

## 🚀 Inicio Rápido

### Requisitos

- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- MySQL 8.0
- Kafka 3.x

### 1. Compilar

```bash
cd cloudfly-dian-service
mvn clean install
```

### 2. Ejecutar con Docker Compose

```bash
docker-compose up -d
```

Esto levanta:
- ✅ MySQL (puerto 3307)
- ✅ Zookeeper
- ✅ Kafka (puerto 9092)
- ✅ Microservicio DIAN (puerto 8081)

### 3. Verificar

```bash
# Health check
curl http://localhost:8081/actuator/health

# Métricas
curl http://localhost:8081/actuator/metrics
```

---

## 📡 API REST

### Endpoints Disponibles

#### Listar documentos
```bash
GET /api/dian/documents?tenantId=1&companyId=1
```

Filtros opcionales:
- `documentType`: INVOICE, CREDIT_NOTE, DEBIT_NOTE, PAYROLL
- `status`: RECEIVED, PROCESSING, ACCEPTED, REJECTED, ERROR
- `sourceDocumentId`: ID en el sistema origen

#### Obtener documento por ID
```bash
GET /api/dian/documents/{id}
```

Retorna XMLs firmado y de respuesta en Base64.

#### Obtener por ID de origen
```bash
GET /api/dian/documents/by-source?tenantId=1&companyId=1&sourceDocumentId=INV-001
```

---

## 🔌 Integración con ERP

### Configurar Backend ERP

El microservicio consume estos endpoints del ERP:

```
GET /api/settings/dian/operation-modes/active?tenantId=1&companyId=1&documentType=INVOICE
GET /api/settings/dian/resolutions/active?tenantId=1&companyId=1&documentType=INVOICE&prefix=FE
GET /api/settings/dian/certificates/active?tenantId=1&companyId=1
```

Configurar en `application.yml`:

```yaml
erp:
  api:
    base-url: http://localhost:8080
```

### Publicar Eventos desde el ERP

```java
// Ejemplo en Java (ERP)
@Autowired
private KafkaTemplate<String, ElectronicDocumentEvent> kafkaTemplate;

public void sendInvoiceToDAIN(Invoice invoice) {
    ElectronicDocumentEvent event = ElectronicDocumentEvent.builder()
        .eventId(UUID.randomUUID().toString())
        .documentType(ElectronicDocumentType.INVOICE)
        .origin(ElectronicDocumentOrigin.ERP_INVOICE)
        .tenantId(invoice.getTenantId())
        .companyId(invoice.getCompanyId())
        .sourceSystem("ERP")
        .sourceDocumentId(invoice.getId().toString())
        .environmentHint("TEST")
        .invoice(mapToPayload(invoice))
        .timestamp(LocalDateTime.now())
        .build();

    kafkaTemplate.send("dian.electronic-documents", event);
}
```

---

## 🔐 Configuración de Certificados

### 1. Subir certificado al ERP

Usar el módulo DIAN del ERP para subir certificados .p12/.pfx.

### 2. El microservicio descarga automáticamente

El certificado se obtiene de la configuración DIAN al procesar cada documento.

### 3. Ubicación en Docker

Los certificados se montan en:
```
/opt/cloudfly/certs/
```

Volumen persistente: `dian_certs`

---

## 🧪 Testing

### Enviar evento de prueba a Kafka

```bash
# Desde terminal Kafka
kafka-console-producer --broker-list localhost:9092 --topic dian.electronic-documents

# Pegar JSON:
{
  "eventId": "test-001",
  "documentType": "INVOICE",
  "origin": "ERP_INVOICE",
  "tenantId": 1,
  "companyId": 1,
  "sourceSystem": "ERP",
  "sourceDocumentId": "INV-001",
  "environmentHint": "TEST",
  "timestamp": "2024-12-29T10:00:00",
  "invoice": {
    "externalInvoiceNumber": "FE0001",
    "issueDate": "2024-12-29",
    "issueTime": "10:00:00",
    "currency": "COP",
    "invoiceTypeCode": "01",
    "issuer": { ... },
    "customer": { ... },
    "lines": [ ... ],
    "totals": { ... }
  }
}
```

### Consultar resultado

```bash
curl http://localhost:8081/api/dian/documents/by-source?tenantId=1&companyId=1&sourceDocumentId=INV-001
```

---

## 📊 Monitoreo

### Logs

```bash
# Ver logs del microservicio
docker logs -f dian-service

# Logs guardados en
docker exec dian-service cat logs/dian-service.log
```

### Métricas Prometheus

```bash
curl http://localhost:8081/actuator/prometheus
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/dian_service
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=secret

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# ERP
ERP_API_BASE_URL=http://erp.company.com:8080

# DIAN
DIAN_API_TEST_URL=https://vpfe-hab.dian.gov.co
DIAN_API_PRODUCTION_URL=https://vpfe.dian.gov.co

# JVM
JAVA_OPTS=-Xms512m -Xmx1g
```

---

## 🐛 Troubleshooting

### Error: No se conecta a Kafka

```bash
# Verificar que Kafka esté corriendo
docker ps | grep kafka

# Ver logs de Kafka
docker logs dian-kafka
```

### Error: No encuentra configuración DIAN

Verificar que el ERP tenga configurados:
- Modo de operación activo
- Resolución activa
- Certificado activo

### Error en firma XML

Verificar:
- Certificado existe en `/opt/cloudfly/certs/`
- Contraseña correcta
- Certificado no expirado

---

## 📝 Licencia

Propietario: CloudFly ERP  
Versión: 1.0.0  
Fecha: 2024-12-29

---

## 🤝 Soporte

Para soporte técnico contactar al equipo de desarrollo CloudFly ERP.

**Estado del Proyecto:** ✅ COMPLETO Y FUNCIONAL
