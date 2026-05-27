# 📦 INVOICE ITEM DIAN - DOCUMENTACIÓN LÍNEAS DE FACTURA ELECTRÓNICA

## 🎯 Resumen

La entidad `InvoiceItem` ha sido actualizada para cumplir con **todos los requisitos DIAN** para facturación electrónica UBL 2.1, incluyendo identificación de productos, unidades de medida UNECE, impuestos detallados y descuentos/cargos por línea.

---

## ✅ CAMBIOS REALIZADOS

### 1. **Campos Originales** - MANTENIDOS
- `id, productId, productName, quantity, unitPrice`
- `discount, subtotal, tax, total`
- `invoice` (relación ManyToOne)

### 2. **Nuevos Campos DIAN** - AGREGADOS

---

## 📋 CAMPOS DIAN AGREGADOS

### 📌 Identificación del Producto/Servicio

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `codigoProducto` | VARCHAR(100) | SKU, EAN, código interno | `SKU-12345` |
| `descripcion` | TEXT | Descripción detallada (**OBLIGATORIO**) | `Laptop HP Core i7` |
| `unidadMedidaUNECE` | VARCHAR(10) | Código UNECE/REC20 | `NIU`, `KGM`, `MTR` |
| `unidadMedidaDescripcion` | VARCHAR(100) | Descripción unidad | `Unidad`, `Kilogramo` |
| `marca` | VARCHAR(200) | Marca del producto | `HP` |
| `modelo` | VARCHAR(200) | Modelo del producto | `ProBook 450 G8` |

**Códigos UNECE Comunes:**
- `NIU` = Unidad (Number of units)
- `KGM` = Kilogramo
- `GRM` = Gramo
- `MTR` = Metro
- `LTR` = Litro
- `HUR` = Hora (servicios)
- `DAY` = Día
- `MON` = Mes
- `MTK` = Metro cuadrado
- `MTQ` = Metro cúbico

### 📌 Impuestos Detallados (OBLIGATORIO DIAN)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `tipoImpuesto` | VARCHAR(20) | IVA, INC, ICA | `IVA` |
| `tarifaIVA` | VARCHAR(20) | Tarifa aplicable | `19%`, `5%`, `EXCLUIDO` |
| `porcentajeImpuesto` | DECIMAL(5,2) | Porcentaje para cálculo | `19.00` |
| `baseImpuesto` | DECIMAL(12,2) | Base gravable | `100000.00` |
| `impuestoCalculado` | DECIMAL(12,2) | Valor del impuesto | `19000.00` |

**Tarifas IVA en Colombia:**
- `0%` = Excluido de IVA
- `5%` = IVA reducido
- `19%` = IVA general
- `EXENTO` = Exento de IVA
- `EXCLUIDO` = No sujeto a IVA

### 📌 Descuentos y Cargos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `descuentosLinea` | TEXT | JSON con descuentos aplicados |
| `valorDescuentos` | DECIMAL(12,2) | Total de descuentos |
| `cargosLinea` | TEXT | JSON con cargos adicionales |
| `valorCargos` | DECIMAL(12,2) | Total de cargos |

**Formato JSON Descuentos:**
```json
{
  "motivo": "Descuento temporal 10%",
  "porcentaje": 10.00,
  "valor": 5000.00
}
```

**Formato JSON Cargos:**
```json
{
  "motivo": "Cargo por transporte",
  "valor": 2000.00
}
```

### 📌 Información Adicional

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numeroLinea` | INT | Número de línea en factura (orden) |
| `esGratuito` | BOOLEAN | Item es bonificación/muestra |
| `notasLinea` | VARCHAR(1000) | Observaciones de la línea |
| `createdAt` | DATETIME | Fecha de creación |

---

## 🔧 MÉTODOS AUXILIARES AGREGADOS

### `calcularSubtotal()`
Calcula: `cantidad × precio unitario`

```java
item.calcularSubtotal();
// subtotal = 5 × 100.00 = 500.00
```

### `calcularBaseImpuesto()`
Calcula: `subtotal - descuentos + cargos`

```java
item.calcularBaseImpuesto();
// base = 500.00 - 50.00 + 20.00 = 470.00
```

### `calcularImpuesto()`
Calcula: `base × (porcentaje / 100)`

```java
item.calcularImpuesto();
// impuesto = 470.00 × 0.19 = 89.30
```

### `calcularTotal()`
Calcula: `base + impuestos`

```java
item.calcularTotal();
// total = 470.00 + 89.30 = 559.30
```

### `calcularTodo()`
Ejecuta todos los cálculos en orden correcto

```java
item.calcularTodo();
```

### `tieneConfiguracionDianCompleta()`
Valida si tiene datos mínimos para DIAN

```java
if (item.tieneConfiguracionDianCompleta()) {
    // Puede incluirse en factura electrónica
}
```

---

## 📊 EJEMPLO DE USO

### Crear Línea de Factura DIAN Completa

```java
InvoiceItem item = InvoiceItem.builder()
    // Datos básicos
    .productId(123L)
    .productName("Laptop HP ProBook 450 G8")
    .quantity(2)
    .unitPrice(BigDecimal.valueOf(2500000))
    
    // Identificación DIAN
    .codigoProducto("SKU-LAPTOP-HP450")
    .descripcion("Laptop HP ProBook 450 G8, Intel Core i7, 16GB RAM, 512GB SSD")
    .unidadMedidaUNECE("NIU")
    .unidadMedidaDescripcion("Unidad")
    .marca("HP")
    .modelo("ProBook 450 G8")
    
    // Impuestos
    .tipoImpuesto("IVA")
    .tarifaIVA("19%")
    .porcentajeImpuesto(BigDecimal.valueOf(19.00))
    
    // Descuentos
    .descuentosLinea("{\"motivo\":\"Descuento mayorista\",\"porcentaje\":10,\"valor\":500000}")
    .valorDescuentos(BigDecimal.valueOf(500000))
    
    // Cargos
    .cargosLinea("{\"motivo\":\"Transporte especial\",\"valor\":50000}")
    .valorCargos(BigDecimal.valueOf(50000))
    
    // Adicional
    .numeroLinea(1)
    .esGratuito(false)
    .notasLinea("Incluye garantía extendida 2 años")
    
    .build();

// Calcular todos los valores
item.calcularTodo();
```

**Resultado:**
- Subtotal: `2 × 2,500,000 = 5,000,000`
- Base: `5,000,000 - 500,000 + 50,000 = 4,550,000`
- IVA: `4,550,000 × 19% = 864,500`
- Total: `4,550,000 + 864,500 = 5,414,500`

---

## 🔄 FÓRMULAS DE CÁLCULO

### 1. Subtotal
```
Subtotal = Cantidad × Precio Unitario
```

### 2. Base Imponible
```
Base = Subtotal - Descuentos + Cargos
```

### 3. Impuesto
```
Impuesto = Base × (Porcentaje / 100)
```

### 4. Total
```
Total = Base + Impuesto
```

---

## 🗄️ MIGRACIÓN DE DATOS

```bash
mysql -u root -p cloudfly_erp < backend/db/migration_invoice_item_dian_fields.sql
```

---

## ✅ VALIDACIONES RECOMENDADAS

```java
@Service
public class InvoiceItemValidator {
    
    public List<String> validateForDian(InvoiceItemDTO item) {
        List<String> errores = new ArrayList<>();
        
        // Obligatorios DIAN
        if (item.getDescripcion() == null || item.getDescripcion().isEmpty()) {
            errores.add("Descripción es obligatoria");
        }
        
        if (item.getUnidadMedidaUNECE() == null) {
            errores.add("Unidad de medida UNECE es obligatoria");
        }
        
        if (item.getTipoImpuesto() == null) {
            errores.add("Tipo de impuesto es obligatorio");
        }
        
        if (item.getQuantity() == null || item.getQuantity() <= 0) {
            errores.add("Cantidad debe ser mayor a 0");
        }
        
        if (item.getPorcentajeImpuesto() != null) {
            if (item.getPorcentajeImpuesto().compareTo(BigDecimal.ZERO) < 0 ||
                item.getPorcentajeImpuesto().compareTo(BigDecimal.valueOf(100)) > 0) {
                errores.add("Porcentaje de impuesto debe estar entre 0 y 100");
            }
        }
        
        return errores;
    }
}
```

---

## 📚 REFERENCIAS

- [Anexo Técnico UBL 2.1 DIAN](https://www.dian.gov.co)
- [Códigos UNECE REC20](https://www.unece.org/cefact/codesfortrade/codes_index.html)
- [Tarifas IVA Colombia](https://www.dian.gov.co/impuestos/IVA)

---

**Actualización:** 29 de Diciembre de 2024  
**Versión:** 1.0.0
