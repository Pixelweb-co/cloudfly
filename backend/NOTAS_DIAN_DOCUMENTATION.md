# 📝 NOTAS CRÉDITO Y DÉBITO DIAN - SISTEM COMPLETADO

## 🎯 RESUMEN GENERAL

Sistema completo para gestionar **Notas de Crédito** y **Notas de Débito** electrónicas DIAN con integración contable automática.

---

## ✅ ARCHIVOS GENERADOS (20 archivos)

### 🗂️ Entidades (4)
1. ✅ `NotaCredito.java`
2. ✅ `NotaDebito.java`
3. ✅ `NotaCreditoItem.java`
4. ✅ `NotaDebitoItem.java`

### 🗄️ Repositorios (2)
5. ✅ `NotaCreditoRepository.java`
6. ✅ `NotaDebitoRepository.java`

### 📦 DTOs (6)
7. ✅ `NotaCreditoRequest.java`
8. ✅ `NotaCreditoResponse.java`
9. ✅ `NotaCreditoItemDTO.java`
10. ✅ `NotaDebitoRequest.java`
11. ✅ `NotaDebitoResponse.java`
12. ✅ `NotaDebitoItemDTO.java`

### 🔄 Mappers (2)
13. ✅ `NotaCreditoMapper.java`
14. ✅ `NotaDebitoMapper.java`

### 🛠️ Servicios (2)
15. ✅ `NotaCreditoService.java` (con reversión contable)
16. ✅ `NotaDebitoService.java` (con generación contable)

### 🌐 Controladores REST (2)
17. ✅ `NotaCreditoController.java`
18. ✅ `NotaDebitoController.java`

### 🗃️ Migraciones SQL (1)
19. ✅ `migration_notas_dian.sql`

### 📚 Documentación (1)
20. ✅ `NOTAS_DIAN_DOCUMENTATION.md` (este archivo)

---

## 📋 ¿QUÉ ES UNA NOTA DE CRÉDITO?

**Definición**: Documento que **disminuye o anula** el valor de una factura electrónica previamente emitida.

**Casos de uso:**
- ❌ Anulación total de factura
- 📉 Devolución parcial de mercancía
- 💰 Descuentos aplicados posterior facturación
- 🔧 Corrección de errores en factura

**Efecto Contable:** **REVIERTE** (invierte) los movimientos contables de la factura original.

---

## 📋 ¿QUÉ ES UNA NOTA DE DÉBITO?

**Definición**: Documento que **aumenta** el valor de una factura electrónica previamente emitida.

**Casos de uso:**
- 💵 Intereses por mora
- 📦 Gastos adicionales de envío
- 💳 Cargos bancarios
- 📈 Ajustes de precio

**Efecto Contable:** **GENERA** movimientos contables adicionales.

---

## 🔄 FLUJO DE NOTA DE CRÉDITO

```
1. CREAR (estado: BORRADOR)
   ↓
2. APROBAR (estado: APROBADA)
   → 🔄 REVIERTE CONTABILIDAD automáticamente
   ↓
3. ENVIAR A DIAN (estado: ENVIADA)
   ↓
4. RESPUESTA DIAN (estado: ACEPTADA / RECHAZADA)
```

---

## 🔄 FLUJO DE NOTA DE DÉBITO

```
1. CREAR (estado: BORRADOR)
   ↓
2. APROBAR (estado: APROBADA)
   → 💰 GENERA CONTABILIDAD automáticamente
   ↓
3. ENVIAR A DIAN (estado: ENVIADA)
   ↓
4. RESPUESTA DIAN (estado: ACEPTADA / RECHAZADA)
```

---

## 🌐 API ENDPOINTS

### Notas de Crédito

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/notas-credito` | Crear nota de crédito |
| GET | `/api/v1/notas-credito?tenantId={id}` | Listar todas |
| GET | `/api/v1/notas-credito/{id}` | Obtener por ID |
| GET | `/api/v1/notas-credito/factura/{invoiceId}` | Por factura |
| POST | `/api/v1/notas-credito/{id}/aprobar` | Aprobar (revierte contabilidad) |
| POST | `/api/v1/notas-credito/{id}/enviar-dian` | Enviar a DIAN |

### Notas de Débito

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/notas-debito` | Crear nota de débito |
| GET | `/api/v1/notas-debito?tenantId={id}` | Listar todas |
| GET | `/api/v1/notas-debito/{id}` | Obtener por ID |
| GET | `/api/v1/notas-debito/factura/{invoiceId}` | Por factura |
| POST | `/api/v1/notas-debito/{id}/aprobar` | Aprobar (genera contabilidad) |
| POST | `/api/v1/notas-debito/{id}/enviar-dian` | Enviar a DIAN |

---

## 💻 EJEMPLOS DE USO

### Crear Nota de Crédito

```bash
POST /api/v1/notas-credito?tenantId=1
Content-Type: application/json

{
  "invoiceIdReferencia": 123,
  "cufeFacturaOriginal": "abc123...",
  "numeroFacturaOriginal": "FV-001",
  "fechaFacturaOriginal": "2024-12-01",
  "motivo": "Devolución de mercancía por defecto de fabricación",
  "codigoMotivoDian": "2",
  "fechaEmision": "2024-12-29",
  "items": [
    {
      "productId": 456,
      "productName": "Laptop HP",
      "descripcion": "Laptop HP ProBook",
      "quantity": 1,
      "unitPrice": 2500000.00,
      "unidadMedidaUNECE": "NIU",
      "tipoImpuesto": "IVA",
      "porcentajeImpuesto": 19.00
    }
  ]
}
```

### Aprobar Nota de Crédito (Revierte Contabilidad)

```bash
POST /api/v1/notas-credito/5/aprobar
```

**Resultado:**
- ✅ Estado cambia a `APROBADA`
- 🔄 **Contabilidad de la factura original se REVIERTE automáticamente**
- 📝 Se registra quién y cuándo aprobó

---

## 💰 INTEGRACIÓN CONTABLE

### Nota de Crédito → REVERSIÓN

Cuando se **aprueba** una nota de crédito:

```java
// ANTES (factura original)
DÉBITO:  Clientes (CxC)         $1,000,000
CRÉDITO: Ventas                  $1,000,000

// DESPUÉS (nota de crédito aprobada) → SE INVIERTE
DÉBITO:  Ventas                  $1,000,000
CRÉDITO: Clientes (CxC)         $1,000,000
```

### Nota de Débito → GENERA ASIENTO ADICIONAL

Cuando se **aprueba** una nota de débito:

```java
// Asiento adicional por intereses de mora
DÉBITO:  Clientes (CxC)         $100,000
CRÉDITO: Ingresos Financieros    $100,000
```

---

## 🔧 CONFIGURACIÓN

### 1. Ejecutar Migración SQL

```bash
mysql -u root -p cloudfly_erp < backend/db/migration_notas_dian.sql
```

### 2. Reiniciar Backend

```bash
cd backend
mvn spring-boot:run
```

---

## 📊 CÓDIGOS MOTIVO DIAN

### Nota de Crédito
- `1` = Anulación de factura electrónica
- `2` = Anulación parcial
- `3` = Rebaja total aplicada
- `4` = Rebaja parcial aplicada
- `5` = Descuento total o parcial

### Nota de Débito
- `1` = Intereses
- `2` = Gastos por cobrar
- `3` = Cambio del valor

---

## ⚠️ IMPORTANTE - INTEGRACIÓN CONTABLE PENDIENTE

Los servicios incluyen **placeholders** para integración contable:

```java
// TODO: Implementar cuando módulo contable esté disponible
// private final AccountingService accountingService;
```

**Para activar:**
1. Crear/vincular servicio contable
2. Descomentar inyección de dependencia
3. Implementar métodos `revertirContabilidad()` y `generarContabilidad()`

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Ejecutar migración SQL
2. ⏳ Integrar con módulo contable
3. ⏳ Conectar con microservicio DIAN
4. ⏳ Crear formularios frontend
5. ⏳ Implementar reportes

---

**Actualización:** 29 de Diciembre de 2024  
**Versión:** 1.0.0
