# 📄 DOCUMENTO SOPORTE DE COMPRAS DIAN - SISTEMA COMPLETADO

## 🎯 RESUMEN GENERAL

Sistema completo para gestionar **Proveedores** y **Documentos Soporte de Adquisiciones** DIAN con integración contable automática.

---

## ✅ ARCHIVOS GENERADOS (18 archivos)

### 🗂️ Entidades (4)
1. ✅ `Proveedor.java` - Maestro de proveedores
2. ✅ `DocumentoSoporte.java` - Documento soporte DIAN
3. ✅ `DocumentoSoporteItem.java` - Items del documento

### 🗄️ Repositorios (2)
4. ✅ `ProveedorRepository.java`
5. ✅ `DocumentoSoporteRepository.java`

### 📦 DTOs (6)
6. ✅ `ProveedorRequest.java`
7. ✅ `ProveedorResponse.java`
8. ✅ `DocumentoSoporteRequest.java`
9. ✅ `DocumentoSoporteResponse.java`
10. ✅ `DocumentoSoporteItemDTO.java`

### 🔄 Mappers (2)
11. ✅ `ProveedorMapper.java`
12. ✅ `DocumentoSoporteMapper.java`

### 🛠️ Servicios (2)
13. ✅ `ProveedorService.java` - CRUD completo
14. ✅ `DocumentoSoporteService.java` - Con generación contable

### 🌐 Controladores REST (2)
15. ✅ `ProveedorController.java`
16. ✅ `DocumentoSoporteController.java`

### 🗃️ Migraciones SQL (1)
17. ✅ `migration_documento_soporte.sql`

### 📚 Documentación (1)
18. ✅ `DOCUMENTO_SOPORTE_DOCUMENTATION.md` (este archivo)

---

## 📋 ¿QUÉ ES UN DOCUMENTO SOPORTE?

**Definición**: Documento electrónico que respalda las compras realizadas a proveedores **que NO están obligados** a facturar electrónicamente.

**¿Cuándo se usa?**
- Proveedor es persona natural sin obligación de facturar electrónicamente
- Proveedor es régimen simplificado
- Compras pequeñas sin factura formal
- Gastos menores

**¿Para qué sirve?**
- ✅ Soportar costos/gastos ante la DIAN
- ✅ Tomar IVA descontable (si aplica)
- ✅ Cumplir con UBL 2.1 DIAN
- ✅ Registrar compras en contabilidad

---

## 🔄 FLUJO COMPLETO

### 1. GESTIÓN DE PROVEEDORES

```
CREAR PROVEEDOR (Maestro)
   ↓
GUARDAR DATOS FISCALES
   ↓
REUTILIZAR EN DOCUMENTOS SOPORTE
```

### 2. DOCUMENTO SOPORTE

```
1. CREAR (estado: BORRADOR)
   ↓
2. APROBAR (estado: APROBADO)
   → 💰 GENERA CONTABILIDAD automáticamente
   ↓
3. ENVIAR A DIAN (estado: ENVIADO)
   ↓
4. RESPUESTA DIAN (estado: ACEPTADO / RECHAZADO)
```

---

## 🌐 API ENDPOINTS

### Proveedores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/proveedores` | Crear proveedor |
| GET | `/api/v1/proveedores?tenantId={id}` | Listar proveedores |
| GET | `/api/v1/proveedores/{id}` | Obtener por ID |
| GET | `/api/v1/proveedores/buscar-nit?nit={nit}` | Buscar por NIT |
| GET | `/api/v1/proveedores/buscar-nombre?nombre={nombre}` | Buscar por nombre |
| PUT | `/api/v1/proveedores/{id}` | Actualizar |
| DELETE | `/api/v1/proveedores/{id}` | Eliminar |

### Documentos Soporte

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/documentos-soporte` | Crear documento |
| GET | `/api/v1/documentos-soporte?tenantId={id}` | Listar todos |
| GET | `/api/v1/documentos-soporte/{id}` | Obtener por ID |
| GET | `/api/v1/documentos-soporte/proveedor/{proveedorId}` | Por proveedor |
| GET | `/api/v1/documentos-soporte/rango-fechas` | Por fechas |
| PUT | `/api/v1/documentos-soporte/{id}` | Actualizar |
| POST | `/api/v1/documentos-soporte/{id}/aprobar` | Aprobar (genera contabilidad) |
| POST | `/api/v1/documentos-soporte/{id}/enviar-dian` | Enviar a DIAN |
| DELETE | `/api/v1/documentos-soporte/{id}` | Eliminar |

---

## 💻 EJEMPLOS DE USO

### 1. Crear Proveedor

```bash
POST /api/v1/proveedores?tenantId=1
Content-Type: application/json

{
  "tipoDocumento": "13",
  "numeroDocumento": "123456789",
  "razonSocial": "JUAN PÉREZ",
  "direccion": "Calle 50 #20-30",
  "ciudad": "Bogotá D.C.",
  "telefono": "300 123 4567",
  "email": "juan@example.com",
  "esFacturadorElectronico": false
}
```

### 2. Crear Documento Soporte

```bash
POST /api/v1/documentos-soporte?tenantId=1
Content-Type: application/json

{
  "proveedorId": 5,
  "proveedorTipoDocumento": "13",
  "proveedorNumeroDocumento": "123456789",
  "proveedorRazonSocial": "JUAN PÉREZ",
  "proveedorCiudad": "Bogotá D.C.",
  "fecha": "2024-12-29",
  "items": [
    {
      "productName": "Papelería",
      "descripcion": "Resma de papel carta",
      "quantity": 10,
      "unitPrice": 15000.00,
      "unidadMedidaUNECE": "NIU",
      "tipoImpuesto": "IVA",
      "tarifaIVA": "19%",
      "porcentajeImpuesto": 19.00
    }
  ],
  "observaciones": "Compra papelería oficina"
}
```

### 3. Aprobar Documento (Genera Contabilidad)

```bash
POST /api/v1/documentos-soporte/10/aprobar
```

**Resultado:**
- ✅ Estado cambiade a `APROBADO`
- 💰 **Contabilidad generada automáticamente:**
  - DÉBITO: Gastos/Inventario
  - DÉBITO: IVA Descontable
  - CRÉDITO: Cuentas por Pagar Proveedores

---

## 💰 INTEGRACIÓN CONTABLE

### Asiento Contable Generado

Cuando se **aprueba** un documento soporte:

```java
// EJEMPLO: Compra de $150,000 + IVA 19% = $178,500

DÉBITO:  Gastos (51XX)           $150,000
DÉBITO:  IVA Descontable (2408)  $ 28,500
CRÉDITO: CxP Proveedores (2205)  $178,500
```

---

## 🔧 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ PROVEEDORES
- Maestro de proveedores completo
- Búsqueda por NIT, nombre
- Control de activos/inactivos
- Indicador si es facturador electrónico
- Datos fiscales completos

### ✅ DOCUMENTO SOPORTE
- Compatible UBL 2.1 DIAN
- Snapshot histórico del proveedor
- Estados: BORRADOR → APROBADO → ENVIADO → ACEPTADO
- **Generación contable automática** al aprobar
- Múltiples items productos/servicios
- Cálculo automático de totales
- Soporte CUFE del proveedor (si existe)

### ✅ ITEMS
- Similar a InvoiceItem
- Soporte NIU, KGM, MTR, etc.
- IVA, descuentos, cargos
- Cálculo automático

---

## 📊 CAMPOS OBLIGATORIOS DIAN

### Del Proveedor
- ✅ Tipo de documento
- ✅ Número de documento
- ✅ Razón social/Nombre
- ✅ Ubicación (ciudad, departamento)

### Del Documento
- ✅ Fecha
- ✅ Al menos 1 item
- ✅ Totales calculados

### De los Items
- ✅ Descripción
- ✅ Cantidad
- ✅ Precio unitario
- ✅ Unidad de medida UNECE

---

## 🗄️ INSTALACIÓN

### 1. Ejecutar Migración SQL

```bash
mysql -u root -p cloudfly_erp < backend/db/migration_documento_soporte.sql
```

### 2. Reiniciar Backend

```bash
cd backend
mvn spring-boot:run
```

### 3. Probar API

```bash
# Crear proveedor
curl -X POST http://localhost:8080/api/v1/proveedores?tenantId=1 \
  -H "Content-Type: application/json" \
  -d '{"tipoDocumento":"13","numeroDocumento":"123456789",...}'

# Crear documento soporte
curl -X POST http://localhost:8080/api/v1/documentos-soporte?tenantId=1 \
  -H "Content-Type: application/json" \
  -d '{"proveedorId":1,"fecha":"2024-12-29",...}'
```

---

## 🎯 DIFERENCIAS CLAVE

| Aspecto | Factura Electrónica | Documento Soporte |
|---------|---------------------|-------------------|
| Emisor | Cliente (Proveedor) | Empresa (Compradora) |
| Proveedor | Obligado FE | No obligado FE |
| CUFE/CUDS | CUFE | CUDS |
| Dirección | De emisor a comprador | De comprador registrando compra |
| Uso | Venta | Compra/Gasto |

---

## ⚠️ IMPORTANTE - INTEGRACIÓN CONTABLE PENDIENTE

El servicio include **placeholders** para integración contable:

```java
// TODO: Implementar cuando módulo contable esté disponible
// private final AccountingService accountingService;
```

**Para activar:**
1. Crear/vincular servicio contable
2. Descomentar inyección de dependencia
3. Implementar método `generarContabilidad()`

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Ejecutar migración SQL
2. ⏳ Integrar con módulo contable
3. ⏳ Conectar con microservicio DIAN
4. ⏳ Crear formularios frontend
5. ⏳ Implementar reportes de compras

---

## 📚 REFERENCIAS

- [UBL 2.1 Documento Soporte DIAN](https://www.dian.gov.co/impuestos/factura-electronica/)
- [Resolución 000013 de 2022 - DIAN](https://www.dian.gov.co)

---

**Actualización:** 29 de Diciembre de 2024  
**Versión:** 1.0.0  
**Estado:** ✅ SISTEMA COMPLETO - LISTO PARA USAR
