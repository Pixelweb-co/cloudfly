# Módulo de Configuración DIAN - Cloudfly ERP

## 📋 Descripción

Módulo completo de configuración DIAN para facturación electrónica en Colombia. 
Permite configurar software propio DIAN, certificados digitales y resoluciones de facturación 
para cada empresa (tenant) del ERP multi-tenant.

---

## 🏗️ Arquitectura

### Backend (Java 17 + Spring Boot 3)

#### Paquetes:
```
co.cloudfly.erp.dian
├── api/
│   ├── DianOperationModeController.java
│   ├── DianCertificateController.java
│   ├── DianResolutionController.java
│   └── dto/
│       ├── DianOperationModeRequest.java
│       ├── DianOperationModeResponse.java
│       ├── DianCertificateRequest.java
│       ├── DianCertificateResponse.java
│       ├── DianResolutionRequest.java
│       └── DianResolutionResponse.java
├── domain/
│   ├── entity/
│   │   ├── DianOperationMode.java
│   │   ├── DianCertificate.java
│   │   └── DianResolution.java
│   ├── enums/
│   │   ├── DianDocumentType.java
│   │   ├── DianEnvironment.java
│   │   └── CertificateType.java
│   └── repository/
│       ├── DianOperationModeRepository.java
│       ├── DianCertificateRepository.java
│       └── DianResolutionRepository.java
├── service/
│   ├── DianOperationModeService.java
│   ├── DianCertificateService.java
│   └── DianResolutionService.java
└── exception/
    ├── DianBusinessException.java
    ├── DianNotFoundException.java
    └── DianGlobalExceptionHandler.java
```

#### Endpoints REST:

**Modos de Operación:**
- `GET    /api/settings/dian/operation-modes?tenantId=1&companyId=1`
- `POST   /api/settings/dian/operation-modes`
- `PUT    /api/settings/dian/operation-modes/{id}`
- `DELETE /api/settings/dian/operation-modes/{id}`

**Certificados:**
- `GET    /api/settings/dian/certificates?tenantId=1&companyId=1`
- `POST   /api/settings/dian/certificates` (multipart/form-data)
- `PATCH  /api/settings/dian/certificates/{id}/activate`
- `PATCH  /api/settings/dian/certificates/{id}/deactivate`
- `DELETE /api/settings/dian/certificates/{id}`

**Resoluciones:**
- `GET    /api/settings/dian/resolutions?tenantId=1&companyId=1`
- `POST   /api/settings/dian/resolutions`
- `PUT    /api/settings/dian/resolutions/{id}`
- `DELETE /api/settings/dian/resolutions/{id}`

---

### Frontend (Next.js 14 + TypeScript + MUI)

#### Estructura:
```
frontend/src/
├── app/(dashboard)/settings/system/dian/
│   └── page.tsx                          # Página principal con tabs
├── components/dian/
│   ├── DianOperationModeList.tsx         # Tabla de modos
│   ├── DianOperationModeForm.tsx         # Formulario de modo
│   ├── DianCertificatesSection.tsx       # Sección certificados
│   └── DianResolutionsSection.tsx        # Sección resoluciones
├── services/dian/
│   ├── operationModeService.ts           # API operations modes
│   ├── certificateService.ts             # API certificates
│   └── resolutionService.ts              # API resolutions
└── types/dian/
    └── index.ts                           # Tipos TypeScript
```

#### Ruta de Acceso:
```
http://localhost:3000/settings/system/dian
```

---

## 🚀 Instalación y Configuración

### 1. Backend

#### Agregar dependencias al pom.xml:

Ver el archivo `backend/pom-dian-dependencies.xml` y agregar las dependencias 
al `pom.xml` principal.

#### Configurar application.properties:

Agregar al archivo `backend/src/main/resources/application.properties`:

```properties
# Ruta de almacenamiento de certificados DIAN
dian.certificates.storage.path=C:/cloudfly/certs

# Tamaño máximo de archivos
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB
```

#### Crear el directorio de certificados:

```bash
mkdir C:/cloudfly/certs
```

O en Linux/Mac:
```bash
mkdir -p /opt/cloudfly/certs
```

#### Ejecutar migraciones de BD:

Crear las tablas en MySQL ejecutando:

```sql
-- Tabla: dian_operation_modes
CREATE TABLE dian_operation_modes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    software_id VARCHAR(100) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    test_set_id VARCHAR(100),
    certification_process BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_tenant_company (tenant_id, company_id),
    INDEX idx_document_type (document_type),
    INDEX idx_active (active)
);

-- Tabla: dian_certificates
CREATE TABLE dian_certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    alias VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    issuer VARCHAR(500),
    subject VARCHAR(500),
    serial_number VARCHAR(100),
    valid_from DATETIME,
    valid_to DATETIME,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_cert_tenant_company (tenant_id, company_id),
    INDEX idx_cert_active (active),
    INDEX idx_cert_validity (valid_from, valid_to)
);

-- Tabla: dian_resolutions
CREATE TABLE dian_resolutions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    number_range_from BIGINT NOT NULL,
    number_range_to BIGINT NOT NULL,
    current_number BIGINT NOT NULL,
    technical_key VARCHAR(200) NOT NULL,
    resolution_number VARCHAR(50),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_res_tenant_company (tenant_id, company_id),
    INDEX idx_res_doc_type (document_type),
    INDEX idx_res_prefix (prefix),
    INDEX idx_res_active (active),
    INDEX idx_res_validity (valid_from, valid_to)
);
```

#### Compilar y ejecutar:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

---

### 2. Frontend

#### Instalar dependencias necesarias:

```bash
cd frontend
npm install axios date-fns react-hook-form
```

#### Configurar variable de entorno:

Crear/editar `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Ejecutar en desarrollo:

```bash
npm run dev
```

Acceder a: `http://localhost:3000/settings/system/dian`

---

## 🔐 Validaciones de Negocio

### Modos de Operación:
- Solo un modo ACTIVO por combinación de (tenant, company, documentType, environment)
- Advertencia al editar modos en PRODUCCIÓN

### Certificados:
- Solo un certificado ACTIVO por (tenant, company)
- Parseo automático de metadatos (issuer, vigencia) para certificados P12
- Almacenamiento seguro con contraseña encriptada (base64 en demo, usar AES en producción)

### Resoluciones:
- Solo una resolución ACTIVA por (tenant, company, documentType, prefix)
- Validación de NO superposición de rangos numéricos
- No permitir eliminar resoluciones que ya generaron números
- No permitir cambiar `numberRangeFrom` si ya se usaron números
- Cálculo automático de números disponibles

---

## 📊 Modelos de Datos

### DianOperationMode
```typescript
{
  id: number
  tenantId: number
  companyId: number
  documentType: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'SUPPORT_DOCUMENT' | 'PAYROLL'
  environment: 'TEST' | 'PRODUCTION'
  softwareId: string
  pin: string
  testSetId?: string
  certificationProcess: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}
```

### DianCertificate
```typescript
{
  id: number
  tenantId: number
  companyId: number
  alias: string
  type: 'P12' | 'PEM'
  issuer: string
  subject: string
  serialNumber: string
  validFrom: string
  validTo: string
  active: boolean
  isValid: boolean  // calculado
  createdAt: string
  updatedAt: string
}
```

### DianResolution
```typescript
{
  id: number
  tenantId: number
  companyId: number
  documentType: DianDocumentType
  prefix: string
  numberRangeFrom: number
  numberRangeTo: number
  currentNumber: number
  technicalKey: string
  resolutionNumber?: string
  validFrom: string (YYYY-MM-DD)
  validTo: string (YYYY-MM-DD)
  active: boolean
  isValid: boolean  // calculado
  remainingNumbers: number  // calculado
  createdAt: string
  updatedAt: string
}
```

---

## 🎨 Características de UI

### Diseño:
- **Material UI (MUI)** con componentes premium
- **Tabs** para organizar las 3 secciones
- **Tablas responsivas** con acciones inline
- **Diálogos modales** para formularios
- **Chips de estado** (Activo/Inactivo, Vigente/Expirado)
- **Progress bars** para visualizar uso de resoluciones

### UX:
- Mensajes de confirmación para acciones destructivas
- Snackbar para feedback de operaciones
- Loading states en todas las operaciones async
- Validación en tiempo real con react-hook-form
- Alertas contextuales con información útil

---

## 🧪 Testing

### Backend:
```bash
# Prueba manual con cURL
curl -X GET "http://localhost:8080/api/settings/dian/operation-modes?tenantId=1"
```

### Frontend:
1. Acceder a `/settings/system/dian`
2. Crear un modo de operación
3. Subir un certificado P12 de prueba
4. Crear una resolución
5. Verificar validaciones (duplicados, rangos, etc.)

---

## 📌 TODOs y Mejoras Futuras

1. **Seguridad:**
   - Implementar encriptación AES para contraseñas de certificados
   - Integrar con Spring Security para validar roles
   - Rate limiting en endpoints de subida de archivos

2. **Funcionalidad:**
   - Alertas automáticas cuando certificados están por vencer
   - Alertas cuando resoluciones están por agotarse
   - Historial de cambios (auditoría)
   - Exportar configuración DIAN como JSON
   - Importar configuración desde JSON

3. **UI/UX:**
   - Búsqueda y filtros en tablas
   - Paginación para listas grandes
   - Vista previa de certificado (sin password)
   - Dashboard con resumen de configuración

4. **Testing:**
   - Unit tests para servicios
   - Integration tests para controladores
   - E2E tests para flujos completos

---

## 🐛 Solución de Problemas

### Error: "Cannot upload file"
- Verificar que el directorio `dian.certificates.storage.path` existe
- Verificar permisos de escritura en el directorio

### Error: "DUPLICATE_ACTIVE_MODE"
- Desactivar el modo existente antes de activar uno nuevo

### Error: "RANGE_OVERLAP"
- Verificar que los rangos de números no se superpongan con resoluciones existentes

### Error: CORS
- Verificar que el frontend está en `http://localhost:3000`
- Revisar configuración `@CrossOrigin` en controladores

---

## 👥 Contacto y Soporte

Para dudas o soporte, contactar al equipo de desarrollo Cloudfly ERP.

**Versión:** 1.0.0  
**Fecha:** Diciembre 2024  
**Autor:** Arquitecto Full-Stack Cloudfly
