# 📘 **GUÍA PRÁCTICA: USAR CENTROS DE COSTO EN CLOUDFLY**

## 🎯 **FLUJO COMPLETO DE USO**

### **FASE 1: CONFIGURACIÓN INICIAL** ⚙️

#### 1.1 Crear Estructura de Centros de Costo

**Acceso**: `http://localhost:3000/contabilidad/centros-costo`

**Ejemplo de estructura recomendada para una PYME**:

```
🏢 EMPRESA CLOUDFLY S.A.S.

📂 ADM - Administración
   ├─ ADM-DIR   Dirección General
   ├─ ADM-FIN   Finanzas y Contabilidad  
   ├─ ADM-HR    Recursos Humanos
   └─ ADM-IT    Tecnología (Sistemas)

📂 VEN - Ventas
   ├─ VEN-NAC   Ventas Nacionales
   ├─ VEN-INT   Ventas Internacionales
   ├─ VEN-WEB   E-Commerce
   └─ VEN-POS   Punto de Venta

📂 PRO - Producción
   ├─ PRO-BOG   Planta Bogotá
   ├─ PRO-MED   Planta Medellín
   └─ PRO-LOG   Logística y Distribución

📂 MKT - Marketing
   ├─ MKT-DIG   Marketing Digital
   ├─ MKT-TV    Publicidad Tradicional
   └─ MKT-EVE   Eventos y Ferias
```

**Pasos en el sistema**:

1. **Crear centros principales**:
```
Clic "Nuevo Centro"
  Código: ADM
  Nombre: Administración
  Estado: Activo
  Centro Padre: (vacío)
  Descripción: Gastos administrativos generales
[Crear]

Repetir para: VEN, PRO, MKT
```

2. **Crear sub-centros**:
```
Clic "Nuevo Centro"
  Código: ADM-IT
  Nombre: Tecnología
  Estado: Activo
  Centro Padre: ADM - Administración  ⬅️ Seleccionar
  Descripción: Sistemas, infraestructura IT, licencias
[Crear]

Repetir para los demás...
```

---

### **FASE 2: USO EN COMPROBANTES CONTABLES** 📝

#### 2.1 Estructura de la Base de Datos

La tabla `accounting_entries` tiene el campo:
```sql
cost_center_id BIGINT  -- ID del centro de costo
```

Esto significa que **cada línea de un asiento contable** puede tener un centro de costo.

#### 2.2 Ejemplo de Asiento Contable

**Caso**: Pago de nómina del departamento de IT - $50,000

```sql
-- Comprobante: EGRESO-001
-- Fecha: 2025-12-12
-- Concepto: Pago nómina IT - Diciembre

INSERT INTO accounting_entries (
  voucher_id, 
  line_number,
  account_code, 
  third_party_id,
  cost_center_id,  ⬅️ AQUÍ SE ASIGNA
  description,
  debit_amount,
  credit_amount
) VALUES
  -- Línea 1: Gasto
  (1, 1, '5105', NULL, 4, 'Nómina IT - Diciembre', 50000, 0),
  -- cost_center_id = 4  (ADM-IT)
  
  -- Línea 2: Salida de banco
  (1, 2, '1110', NULL, NULL, 'Pago nómina', 0, 50000);
  -- Sin centro de costo (es solo movimiento de banco)
```

**Resultado en la base de datos**:
```
┌────┬──────────┬───────┬─────────────┬──────────┬─────────┐
│ ID │ Cuenta   │ CC_ID │ Descripción │ Débito   │ Crédito │
├────┼──────────┼───────┼─────────────┼──────────┼─────────┤
│ 1  │ 5105     │ 4     │ Nómina IT   │ 50,000   │ 0       │ ⬅️ ADM-IT
│ 2  │ 1110     │ NULL  │ Pago nómina │ 0        │ 50,000  │
└────┴──────────┴───────┴─────────────┴──────────┴─────────┘
```

---

### **FASE 3: INTEGRACIÓN CON MÓDULOS** 🔗

#### 3.1 Desde Ventas → Contabilidad

Cuando se crea una **Factura de Venta**, el sistema genera automáticamente:

```javascript
// FACTURA VEN-001
// Cliente: ABC S.A.S.
// Total: $100,000 + IVA $19,000 = $119,000
// Vendedor asignado a: VEN-NAC

// Asiento contable automático:
{
  voucherType: "INGRESO",
  entries: [
    // Cuenta por cobrar
    {
      accountCode: "1305",  // Clientes
      debit: 119000,
      credit: 0,
      costCenterId: null,  // No aplica para cuentas por cobrar
      description: "Factura VEN-001"
    },
    // Ingreso por venta
    {
      accountCode: "4135",  // Ventas
      debit: 0,
      credit: 100000,
      costCenterId: 5,  ⬅️ VEN-NAC (se asigna automáticamente)
      description: "Venta productos"
    },
    // IVA generado
    {
      accountCode: "2408",  // IVA por pagar
      debit: 0,
      credit: 19000,
      costCenterId: null,
      description: "IVA Factura VEN-001"
    }
  ]
}
```

#### 3.2 Desde Compras → Contabilidad

```javascript
// FACTURA COMPRA #045
// Proveedor: Papelería XYZ
// Total: $500,000
// Departamento: Administración

// Asiento contable:
{
  entries: [
    // Gasto
    {
      accountCode: "5195",  // Gastos diversos
      debit: 500000,
      costCenterId: 1,  ⬅️ ADM (Administración)
      description: "Papelería oficina"
    },
    // Cuenta por pagar
    {
      accountCode: "2335",  // Proveedores
      credit: 500000,
      costCenterId: null,
      description: "Factura #045"
    }
  ]
}
```

---

### **FASE 4: REPORTES Y ANÁLISIS** 📊

#### 4.1 Consulta: Gastos por Centro de Costo

```sql
SELECT 
    cc.code AS codigo_centro,
    cc.name AS nombre_centro,
    SUM(ae.debit_amount) AS total_gastos
FROM accounting_entries ae
INNER JOIN cost_centers cc ON ae.cost_center_id = cc.id
INNER JOIN accounting_vouchers av ON ae.voucher_id = av.id
WHERE av.status = 'POSTED'
  AND av.date BETWEEN '2025-01-01' AND '2025-12-31'
  AND ae.debit_amount > 0
GROUP BY cc.code, cc.name
ORDER BY total_gastos DESC;
```

**Resultado**:
```
┌─────────────┬──────────────────┬──────────────┐
│ Código      │ Nombre           │ Total Gastos │
├─────────────┼──────────────────┼──────────────┤
│ PRO-BOG     │ Planta Bogotá    │ $5,000,000   │
│ VEN-NAC     │ Ventas Nacional  │ $3,500,000   │
│ ADM-IT      │ Tecnología       │ $2,800,000   │
│ MKT-DIG     │ Marketing Digital│ $1,200,000   │
│ ADM-HR      │ RRHH             │ $  800,000   │
└─────────────┴──────────────────┴──────────────┘
```

#### 4.2 Análisis de Rentabilidad por Centro

```sql
SELECT 
    cc.code,
    cc.name,
    SUM(ae.credit_amount) AS ingresos,
    SUM(ae.debit_amount) AS gastos,
    (SUM(ae.credit_amount) - SUM(ae.debit_amount)) AS utilidad,
    CASE 
        WHEN SUM(ae.credit_amount) > 0 
        THEN ((SUM(ae.credit_amount) - SUM(ae.debit_amount)) / SUM(ae.credit_amount) * 100)
        ELSE 0 
    END AS margen_pct
FROM accounting_entries ae
INNER JOIN cost_centers cc ON ae.cost_center_id = cc.id
WHERE ae.account_code LIKE '4%'  -- Ingresos
   OR ae.account_code LIKE '5%'  -- Gastos
GROUP BY cc.code, cc.name;
```

**Resultado**:
```
┌─────────┬──────────────┬────────────┬──────────┬───────────┬────────┐
│ Código  │ Nombre       │ Ingresos   │ Gastos   │ Utilidad  │ Margen │
├─────────┼──────────────┼────────────┼──────────┼───────────┼────────┤
│ VEN-NAC │ Venta Nac.   │ 10,000,000 │ 3,500,000│ 6,500,000 │ 65%  ✅│
│ VEN-INT │ Venta Int.   │  5,000,000 │ 2,000,000│ 3,000,000 │ 60%  ✅│
│ MKT-DIG │ Mkt Digital  │    500,000 │ 1,200,000│  -700,000 │-140% ❌│
└─────────┴──────────────┴────────────┴──────────┴───────────┴────────┘
```

**Decisión**: Marketing Digital no es rentable, revisar estrategia.

---

### **FASE 5: CASOS DE USO REALES** 💼

#### Caso 1: Control de Proyectos

```
Proyecto: Implementación ERP Cliente XYZ
Centro de Costo: PRO-ERP-XYZ (crear específico)

Todos los gastos del proyecto van a este centro:
- Horas de consultoría
- Licencias software
- Viáticos del equipo
- Materiales

Al final del proyecto:
Total Ingresos:  $50,000,000
Total Gastos:    $35,000,000
Utilidad:        $15,000,000
Margen:          30% ✅ Proyecto rentable
```

#### Caso 2: Comparación de Sucursales

```
VEN-BOG (Bogotá)
  Ventas:    $100M
  Gastos:    $ 30M
  Utilidad:  $ 70M
  Margen:    70%

VEN-MED (Medellín)
  Ventas:    $ 80M
  Gastos:    $ 50M
  Utilidad:  $ 30M
  Margen:    37.5%

Conclusión: Bogotá es más eficiente
```

#### Caso 3: Control Presupuestario

```
Centro: ADM-IT
Presupuesto anual: $120,000 ($10,000/mes)

Enero:   $ 8,500  ✅ -15% vs presupuesto
Febrero: $12,000  ⚠️ +20% vs presupuesto
Marzo:   $ 9,500  ✅ -5% vs presupuesto

Acumulado Q1: $30,000 vs $30,000 presupuestado ✅
```

---

### **FASE 6: MEJORES PRÁCTICAS** ⭐

#### ✅ **Hacer**:
1. Crear estructura jerárquica clara
2. Usar códigos cortos y descriptivos (ADM, VEN, PRO)
3. Asignar centro de costo solo a cuentas de resultado (ingresos/gastos)
4. Revisar reportes mensualmente
5. Mantener centros actualizados

#### ❌ **No Hacer**:
1. Crear demasiados centros (complejidad innecesaria)
2. Asignar a cuentas de balance (activos, pasivos)
3. Cambiar códigos frecuentemente
4. Duplicar centros con nombres similares
5. Ignorar centros sin movimientos

---

### **RESUMEN RÁPIDO** 🚀

| Paso | Acción | Dónde |
|------|--------|-------|
| 1 | Crear centros de costo | `/contabilidad/centros-costo` |
| 2 | Asignar en comprobantes | `accounting_entries.cost_center_id` |
| 3 | Generar reportes | SQL o futuro módulo de reportes |
| 4 | Analizar resultados | Excel o BI |
| 5 | Tomar decisiones | Gerencia |

---

**🎯 Próximo paso**: ¿Quieres que cree una vista de **Reporte de Gastos por Centro de Costo** para visualizar esto directamente en el frontend?
