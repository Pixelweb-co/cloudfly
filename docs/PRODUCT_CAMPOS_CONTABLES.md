# 📋 CAMPOS CONTABLES PARA PRODUCT.JAVA

## ✅ CAMPOS A AGREGAR MANUALMENTE

Agregar estos campos en la clase `Product.java` después de la línea 92 (antes de `createdAt`):

```java
// ===== CAMPOS CONTABLES (Integración con Contabilidad) =====

/**
 * Cuenta contable de ingresos (cuando se vende el producto)
 * Ejemplo: "4135" - Comercio al por mayor y al por menor
 */
@Column(name = "income_account_code", length = 10)
private String incomeAccountCode;

/**
 * Cuenta contable de costos (cuando se vende el producto)
 * Ejemplo: "6135" - Costo de ventas
 */
@Column(name = "cost_account_code", length = 10)
private String costAccountCode;

/**
 * Cuenta contable de inventario (para productos con stock)
 * Ejemplo: "1435" - Mercancías no fabricadas por la empresa
 */
@Column(name = "inventory_account_code", length = 10)
private String inventoryAccountCode;

/**
 * Tarifa de IVA aplicable (%)
 * Ejemplo: 19, 5, 0
 */
@Column(name = "vat_rate", precision = 5, scale = 2)
private BigDecimal vatRate;

/**
 * Código del impuesto al consumo (si aplica)
 */
@Column(name = "consumption_tax_code", length = 10)
private String consumptionTaxCode;

/**
 * Tarifa del impuesto al consumo (%)
 */
@Column(name = "consumption_tax_rate", precision = 5, scale = 2)
private BigDecimal consumptionTaxRate;

/**
 * Indica si el producto está excluido de IVA
 */
@Column(name = "vat_exempt")
private Boolean vatExempt = false;

/**
 * Costo promedio del producto (para cálculos contables)
 */
@Column(name = "average_cost", precision = 15, scale = 2)
private BigDecimal averageCost;
```

## 📊 GETTERS Y SETTERS

Agregar al final de la clase, antes del cierre:

```java
// Getters y Setters Contables

public String getIncomeAccountCode() {
    return incomeAccountCode;
}

public void setIncomeAccountCode(String incomeAccountCode) {
    this.incomeAccountCode = incomeAccountCode;
}

public String getCostAccountCode() {
    return costAccountCode;
}

public void setCostAccountCode(String costAccountCode) {
    this.costAccountCode = costAccountCode;
}

public String getInventoryAccountCode() {
    return inventoryAccountCode;
}

public void setInventoryAccountCode(String inventoryAccountCode) {
    this.inventoryAccountCode = inventoryAccountCode;
}

public BigDecimal getVatRate() {
    return vatRate;
}

public void setVatRate(BigDecimal vatRate) {
    this.vatRate = vatRate;
}

public String getConsumptionTaxCode() {
    return consumptionTaxCode;
}

public void setConsumptionTaxCode(String consumptionTaxCode) {
    this.consumptionTaxCode = consumptionTaxCode;
}

public BigDecimal getConsumptionTaxRate() {
    return consumptionTaxRate;
}

public void setConsumptionTaxRate(BigDecimal consumptionTaxRate) {
    this.consumptionTaxRate = consumptionTaxRate;
}

public Boolean getVatExempt() {
    return vatExempt;
}

public void setVatExempt(Boolean vatExempt) {
    this.vatExempt = vatExempt;
}

public BigDecimal getAverageCost() {
    return averageCost;
}

public void setAverageCost(BigDecimal averageCost) {
    this.averageCost = averageCost;
}
```

## 💡 USO EN CONTABILIDAD

### Cuando se vende un producto:
```java
// Débito: Caja (efectivo) o Clientes (crédito)
// Crédito: Ingreso (product.getIncomeAccountCode())
// Crédito: IVA por pagar (calculado con product.getVatRate())

// Débito: Costo de venta (product.getCostAccountCode())
// Crédito: Inventario (product.getInventoryAccountCode())
```

### Al comprar inventario:
```java
// Débito: Inventario (product.getInventoryAccountCode())
// Crédito: Proveedores o Caja
```

## 🔄 MIGRACIÓN SQL

La migración `V3__productos_contabilidad.sql` ya está creada con:
- ALTER TABLE para agregar columnas
- Valores por defecto para productos existentes
- Índices para optimizar consultas

---

**Ubicación del archivo:** `backend/src/main/java/com/app/starter1/persistence/entity/Product.java`

**Línea de inserción:** Después de la línea 92 (antes de `@Column(updatable = false) private LocalDateTime createdAt;`)
