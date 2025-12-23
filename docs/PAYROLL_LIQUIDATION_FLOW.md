# 💼 Implementación Completa: Liquidación y Pago de Nómina

## � Conceptos Fundamentales de Liquidación de Nómina

La liquidación de nómina no es solo el sueldo básico. Incluye múltiples componentes que deben calcularse correctamente según la legislación colombiana:

### 💰 Componentes Salariales

#### 1. **Salario Base**
- Valor económico pagado al colaborador por el trabajo realizado durante el período.
- Base para el cálculo de prestaciones sociales y aportes.

#### 2. **Horas Extras**
- Trabajo adicional fuera de la jornada ordinaria
- Recargo según la ley: diurnas (25%), nocturnas (75%), dominicales y festivos (75%)

#### 3. **Auxilio de Transporte**
- Bonificación por movilidad del empleado
- Solo aplica para salarios hasta 2 SMMLV
- Valor 2025: **$140.606**

#### 4. **Comisiones**
- Retribución por logro de objetivos, ventas o alto rendimiento
- Hace parte del salario cuando es habitual

### 🏥 Seguridad Social (Deducciones del Empleado)

#### 5. **Salud (EPS)**
- **Empleado paga:** 4% sobre el salario base
- **Empleador paga:** 8.5% sobre el salario base
- **Total:** 12.5%

#### 6. **Pensión**
- **Empleado paga:** 4% sobre el salario base
- **Empleador paga:** 12% sobre el salario base
- **Total:** 16%

#### 7. **ARL (Riesgos Laborales)**
- **Empleador paga:** 0.522% a 6.96% según el nivel de riesgo
- No se descuenta al empleado

### 🎁 Prestaciones Sociales (Provisiones del Empleador)

#### 8. **Prima de Servicios**
- Un mes de salario por cada año trabajado
- Se paga en 2 cuotas: junio (50%) y diciembre (50%)
- **Fórmula:** `(Salario × Días trabajados) / 360`

#### 9. **Cesantías**
- Un mes de salario por cada año trabajado
- Ahorro para desempleo, vivienda o educación
- Se consignan en el fondo antes del 15 de febrero
- **Fórmula:** `(Salario × Días trabajados) / 360`

#### 10. **Intereses sobre Cesantías**
- 12% anual sobre las cesantías acumuladas
- Se pagan directamente al empleado antes del 31 de enero
- **Fórmula:** `Cesantías × 12% × Días / 360`

#### 11. **Vacaciones**
- 15 días hábiles por cada año trabajado
- **Fórmula:** `(Salario × Días trabajados) / 720`
- Se pagan cuando el empleado toma las vacaciones

### 👨‍👩‍👧‍👦 Aportes Parafiscales (Solo empleadores con más de 10 empleados o ingresos > 3000 UVT)

#### 12. **SENA**
- 2% sobre la nómina mensual

#### 13. **ICBF**
- 3% sobre la nómina mensual

#### 14. **Caja de Compensación Familiar**
- 4% sobre la nómina mensual

---

## �📊 Flujo de Estados

### Estados del Período:
```
OPEN → LIQUIDATED → PARTIALLY_PAID → PAID → CLOSED
```

### Estados del Recibo Individual:
```
PENDING → PAID
```

---

## � Ejemplo Práctico: Liquidación de Nómina Mensual

### Datos del Empleado:
- **Nombre:** Juan Pérez
- **Cargo:** Especialista de Marketing
- **Salario Base:** $1.500.000
- **Horas Extras:** $150.000
- **Días laborados:** 30 (mes completo)
- **Auxilio de Transporte:** $140.606 (aplica porque salario < 2 SMMLV)

### 💵 Cálculo de Devengos

```
Salario Base:                           $ 1.500.000
Horas Extras:                           $   150.000
Auxilio de Transporte:                  $   140.606
                                        ────────────
TOTAL DEVENGADO:                        $ 1.790.606
```

### ➖ Cálculo de Deducciones (Sobre Salario + Horas Extras = $1.650.000)

```
Base para aportes: $1.650.000

Salud (4%):        $ 1.650.000 × 0.04  =  $  66.000
Pensión (4%):      $ 1.650.000 × 0.04  =  $  66.000
                                           ─────────
TOTAL DEDUCCIONES:                         $ 132.000
```

### 💰 Neto a Pagar

```
Total Devengado:                        $ 1.790.606
Total Deducciones:                      $   132.000
                                        ────────────
NETO A PAGAR:                           $ 1.658.606
```

### 🏢 Costos del Empleador (No se descuentan al empleado)

```
Salud (8.5%):      $ 1.650.000 × 0.085 =  $ 140.250
Pensión (12%):     $ 1.650.000 × 0.12  =  $ 198.000
ARL (0.522%):      $ 1.650.000 × 0.00522= $   8.613
                                           ─────────
TOTAL SEGURIDAD SOCIAL:                    $ 346.863

SENA (2%):         $ 1.650.000 × 0.02  =  $  33.000
ICBF (3%):         $ 1.650.000 × 0.03  =  $  49.500
Caja Comp (4%):    $ 1.650.000 × 0.04  =  $  66.000
                                           ─────────
TOTAL PARAFISCALES:                        $ 148.500
```

### 📊 Provisiones Mensuales (30 días)

```
Prima de Servicios:
  ($1.650.000 × 30) / 360 =              $ 137.500

Cesantías:
  ($1.790.606 × 30) / 360 =              $ 149.217

Intereses sobre Cesantías:
  ($149.217 × 12% × 30) / 360 =          $   1.492

Vacaciones:
  ($1.650.000 × 30) / 720 =              $  68.750
                                           ─────────
TOTAL PROVISIONES:                         $ 356.959
```

### 💼 Costo Total del Empleado para la Empresa

```
Salario + Horas Extras:                 $ 1.650.000
Auxilio de Transporte:                  $   140.606
Seguridad Social:                       $   346.863
Parafiscales:                           $   148.500
Provisiones:                            $   356.959
                                        ────────────
COSTO TOTAL:                            $ 2.642.928
```

---

## �🔄 Proceso Completo

### 1️⃣ **LIQUIDAR PERÍODO**
**Endpoint:** `POST /api/hr/periods/{id}/liquidate`

**Acciones:**
- Por cada empleado activo, calcula:
  
  **📈 DEVENGOS:**
  - Salario base proporcional a días trabajados
  - Horas extras (si aplica)
  - Comisiones (si aplica)
  - Auxilio de transporte (si salario < 2 SMMLV)
  - Otras novedades positivas (bonos, incentivos)
  
  **📉 DEDUCCIONES:**
  - Salud: 4% sobre (salario base + horas extras)
  - Pensión: 4% sobre (salario base + horas extras)
  - Otras deducciones (préstamos, embargos, anticipos)
  
  **💼 COSTOS EMPLEADOR (para contabilidad):**
  - Salud: 8.5%
  - Pensión: 12%
  - ARL: 0.522% a 6.96% (según riesgo)
  - SENA: 2% (si aplica)
  - ICBF: 3% (si aplica)
  - Caja de Compensación: 4%
  
  **🎁 PROVISIONES:**
  - Prima de servicios: (Salario × Días) / 360
  - Cesantías: (Salario × Días) / 360
  - Intereses cesantías: (Cesantías × 12% × Días) / 360
  - Vacaciones: (Salario × Días) / 720

- Genera `PayrollReceipt` (estado: PENDING) para cada empleado con todos los cálculos
- Marca novedades asociadas como PROCESSED
- Cambia período a LIQUIDATED
- **NO genera PDFs aún** (se harán al pagar individual)

**Request:**
```json
POST /api/hr/periods/123/liquidate?customerId=1
```

**Response:**
```json
{
  "periodId": 123,
  "status": "LIQUIDATED",
  "totalEmployees": 6,
  "receiptsGenerated": 6,
  "totalGrossPay": 9900000,
  "totalDeductions": 792000,
  "totalNetPay": 9108000,
  "totalEmployerCosts": 2967372,
  "totalProvisions": 2141750,
  "noveltiesProcessed": 3
}
```

---

### 2️⃣ **PAGAR EMPLEADO INDIVIDUAL**
**Endpoint:** `POST /api/hr/receipts/{receiptId}/pay`

**Acciones:**
- Genera PDF del recibo
- Envía email al empleado con PDF adjunto (vía notification-service)
- Marca recibo como PAID
- Registra `paidAt` timestamp
- **Verifica si todos pagados → actualiza período a PAID automáticamente**
- Genera asiento contable individual

**Request:**
```json
POST /api/hr/receipts/456/pay?customerId=1
{
  "paymentReference": "TRX-2025-001",
  "paymentMethod": "TRANSFER",
  "notes": "Transferencia realizada"
}
```

**Response:**
```json
{
  "receiptId": 456,
  "employeeName": "Juan Pérez",
  "netPay": 450000,
  "status": "PAID",
  "pdfUrl": "/uploads/receipts/receipt_456.pdf",
  "emailSent": true,
  "periodStatus": "PARTIALLY_PAID"  // O "PAID" si era el último
}
```

---

### 3️⃣ **CERRAR PERÍODO (Manual)**
**Endpoint:** `POST /api/hr/periods/{id}/close`

**Acciones:**
- Verifica que todos los recibos estén pagados
- Genera comprobante contable consolidado (provisiones)
- Cambia período a CLOSED
- **Bloquea toda modificación**

---

## 📧 Integración con Notification Service

### Email Template: Recibo de Nómina

**Subject:** `Desprendible de Nómina - {periodName}`

**Body:**
```html
<h2>Hola {employeeName},</h2>
<p>Adjunto encontrarás tu desprendible de nómina correspondiente al período:</p>
<ul>
  <li><strong>Período:</strong> {periodName}</li>
  <li><strong>Fecha de Pago:</strong> {paymentDate}</li>
  <li><strong>Neto a Pagar:</strong> ${netPay}</li>
</ul>
<p>Referencia de pago: {paymentReference}</p>
```

**Attachment:** `recibo_{receiptId}.pdf`

---

## 📑 Asientos Contables

### 1️⃣ Al Liquidar Período (Provisión de Nómina)

Este asiento se genera cuando se liquida el período, registrando el gasto y las obligaciones:

```
CONCEPTO: Provisión Nómina - {periodName}
FECHA: {liquidationDate}

DÉBITOS (Gastos):
  510506 - Sueldos y Salarios           $ 9.900.000  (Salarios brutos)
  510527 - Aportes Salud (8.5%)         $   841.500
  510527 - Aportes Pensión (12%)        $ 1.188.000
  510527 - Aportes ARL (0.522%)         $    51.678
  510527 - SENA (2%)                    $   198.000
  510527 - ICBF (3%)                    $   297.000
  510527 - Caja Compensación (4%)       $   396.000
  511020 - Provisión Prima Servicios    $   825.000
  511020 - Provisión Cesantías          $   825.000
  511020 - Provisión Int. Cesantías     $     8.250
  511020 - Provisión Vacaciones         $   412.500
                                        ────────────
  TOTAL DÉBITOS                         $14.942.928

CRÉDITOS (Pasivos):
  238030 - Salud por Pagar (Empleado)   $   396.000  (4%)
  238030 - Salud por Pagar (Empleador)  $   841.500  (8.5%)
  238035 - Pensión por Pagar (Empleado) $   396.000  (4%)
  238035 - Pensión por Pagar (Empleador)$ 1.188.000  (12%)
  238040 - ARL por Pagar                $    51.678
  238095 - SENA por Pagar               $   198.000
  238095 - ICBF por Pagar               $   297.000
  238095 - Caja Compensación por Pagar  $   396.000
  261005 - Prima de Servicios por Pagar $   825.000
  261010 - Cesantías por Pagar          $   825.000
  261015 - Int. Cesantías por Pagar     $     8.250
  261020 - Vacaciones por Pagar         $   412.500
  233595 - Nómina por Pagar (Neto)      $ 9.108.000
                                        ────────────
  TOTAL CRÉDITOS                        $14.942.928
```

### 2️⃣ Al Pagar Empleado Individual

Este asiento se genera por cada empleado cuando se le paga:

```
CONCEPTO: Pago Nómina - Juan Pérez - Quincenal 1/2025
FECHA: {paidAt}
REFERENCIA: {paymentReference}

DÉBITO:
  233595 - Nómina por Pagar             $ 1.658.606

CRÉDITO:
  111005 - Bancos                       $ 1.658.606
```

### 3️⃣ Al Pagar Seguridad Social (Mensual)

Cuando se pagan los aportes a seguridad social:

```
CONCEPTO: Pago Seguridad Social - {mes/año}
FECHA: {paymentDate}

DÉBITOS:
  238030 - Salud por Pagar              $ 1.237.500  (Total empleado + empleador)
  238035 - Pensión por Pagar            $ 1.584.000  (Total empleado + empleador)
  238040 - ARL por Pagar                $    51.678
                                        ────────────
  TOTAL DÉBITOS                         $ 2.873.178

CRÉDITO:
  111005 - Bancos                       $ 2.873.178
```

### 4️⃣ Al Pagar Parafiscales (Mensual)

```
CONCEPTO: Pago Parafiscales - {mes/año}
FECHA: {paymentDate}

DÉBITOS:
  238095 - SENA por Pagar               $   198.000
  238095 - ICBF por Pagar               $   297.000
  238095 - Caja Compensación por Pagar  $   396.000
                                        ────────────
  TOTAL DÉBITOS                         $   891.000

CRÉDITO:
  111005 - Bancos                       $   891.000
```

### 5️⃣ Al Pagar Prima de Servicios (Junio y Diciembre)

```
CONCEPTO: Pago Prima de Servicios - Semestre {X}/{año}
FECHA: {paymentDate}

DÉBITO:
  261005 - Prima de Servicios por Pagar $ 4.950.000  (Acumulado semestral)

CRÉDITO:
  111005 - Bancos                       $ 4.950.000
```

### 6️⃣ Al Consignar Cesantías (Antes del 15 de Febrero)

```
CONCEPTO: Consignación Cesantías - Año {año}
FECHA: {paymentDate}

DÉBITO:
  261010 - Cesantías por Pagar          $ 9.900.000  (Acumulado anual)

CRÉDITO:
  111005 - Bancos                       $ 9.900.000
```

### 7️⃣ Al Pagar Intereses sobre Cesantías (Antes del 31 de Enero)

```
CONCEPTO: Pago Intereses Cesantías - Año {año}
FECHA: {paymentDate}

DÉBITO:
  261015 - Int. Cesantías por Pagar     $    99.000  (Acumulado anual)

CRÉDITO:
  111005 - Bancos                       $    99.000
```

---

## 📊 Plan de Cuentas Contables (PUC Colombia)

### Gastos (Débito)
- **510506** - Sueldos y Salarios
- **510527** - Aportes a Seguridad Social (Empleador)
- **511020** - Provisiones (Prima, Cesantías, Intereses, Vacaciones)

### Obligaciones Laborales (Crédito)
- **233595** - Nómina por Pagar (Neto a empleados)
- **238030** - Salud por Pagar
- **238035** - Pensión por Pagar
- **238040** - ARL por Pagar
- **238095** - Parafiscales por Pagar (SENA, ICBF, Caja Comp.)
- **261005** - Prima de Servicios por Pagar
- **261010** - Cesantías por Pagar
- **261015** - Intereses sobre Cesantías por Pagar
- **261020** - Vacaciones por Pagar

### Activos (Débito/Crédito)
- **111005** - Bancos



---

## 🎨 UI/UX - Vista de Período Liquidado

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Período: Quincenal 1/2025               [LIQUIDATED]     │
│ Fechas: 01/01/2025 - 15/01/2025  |  Pago: 20/01/2025       │
├─────────────────────────────────────────────────────────────┤
│ 💰 Resumen Financiero                                       │
│ ┌─────────────┬──────────────┬──────────────┬─────────────┐│
│ │ Total Neto  │ Pagado       │ Pendiente    │ Progreso    ││
│ │ $2,120,600  │ $450,000     │ $1,670,600   │ 1/6 (17%)   ││
│ └─────────────┴──────────────┴──────────────┴─────────────┘│
│                                                              │
│ 👥 Empleados                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Empleado          Neto        Estado      Acción         ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ Juan Pérez    $450,000    ✅ PAID      [Ver Recibo]     ││
│ │ María López   $380,000    ⏳ PENDING   [💰 Pagar]       ││
│ │ Carlos Gómez  $520,000    ⏳ PENDING   [💰 Pagar]       ││
│ │ Ana Torres    $290,000    ⏳ PENDING   [💰 Pagar]       ││
│ │ Luis Martín   $310,000    ⏳ PENDING   [💰 Pagar]       ││
│ │ Sofia Ruiz    $170,600    ⏳ PENDING   [💰 Pagar]       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [📊 Ver Comprobantes Contables] [🔒 Cerrar Período]         │
└─────────────────────────────────────────────────────────────┘
```

```

---

## 📊 Tabla Resumen: Porcentajes de Liquidación de Nómina Colombia 2025

| Concepto | Base de Cálculo | Empleado Paga | Empleador Paga | Total | Observaciones |
|----------|-----------------|---------------|----------------|-------|---------------|
| **Salud** | Salario base + HE | 4% | 8.5% | 12.5% | Obligatorio |
| **Pensión** | Salario base + HE | 4% | 12% | 16% | Obligatorio |
| **ARL** | Salario base | - | 0.522% - 6.96% | Variable | Según nivel de riesgo |
| **SENA** | Salario base | - | 2% | 2% | Si >10 empleados o >3000 UVT |
| **ICBF** | Salario base | - | 3% | 3% | Si >10 empleados o >3000 UVT |
| **Caja Compensación** | Salario base | - | 4% | 4% | Obligatorio |
| **Prima de Servicios** | Salario promedio | - | (Salario × Días) / 360 | Provisión | 2 pagos: Junio y Diciembre |
| **Cesantías** | Salario promedio + aux. transporte | - | (Salario × Días) / 360 | Provisión | Consignación antes del 15/Feb |
| **Int. Cesantías** | Cesantías acumuladas | - | 12% anual | Provisión | Pago directo antes del 31/Ene |
| **Vacaciones** | Salario base | - | (Salario × Días) / 720 | Provisión | 15 días hábiles/año |
| **Aux. Transporte** | Fijo | - | $140.606 (2025) | Fijo | Solo si salario < 2 SMMLV |

### 📌 Notas Importantes:

1. **Base de cálculo para aportes:** Salario base + Horas extras (NO incluye auxilio de transporte)
2. **Base para prestaciones sociales:** Salario base + Auxilio de transporte + Comisiones habituales
3. **SMMLV 2025:** $1.423.500
4. **Auxilio de Transporte 2025:** $140.606 (solo para quienes ganan hasta $2.847.000)
5. **Parafiscales:** Solo aplican si la empresa tiene más de 10 empleados o ingresos superiores a 3.000 UVT anuales

### 🧮 Fórmulas Rápidas:

```
DEVENGADO = Salario + Horas Extras + Comisiones + Aux. Transporte + Bonos

DEDUCCIONES = (Salario + HE) × 8% [4% Salud + 4% Pensión] + Otras deducciones

NETO A PAGAR = DEVENGADO - DEDUCCIONES

COSTO EMPLEADOR = Salario + Aux. Transporte + 
                  (Salario × 20.5%) [Seg. Social] + 
                  (Salario × 9%) [Parafiscales si aplica] +
                  (Salario × 21.83%) [Provisiones]

COSTO TOTAL ≈ Salario × 1.51 (aproximado, con todos los conceptos)
```

---

## 🔧 Endpoints a Implementar

1. `POST /api/hr/periods/{id}/liquidate` - Liquidar período completo
2. `POST /api/hr/receipts/{id}/pay` - Pagar empleado individual
3. `POST /api/hr/periods/{id}/close` - Cerrar período
4. `GET /api/hr/periods/{id}/receipts` - Listar recibos del período
5. `GET /api/hr/receipts/{id}/pdf` - Descargar PDF del recibo

---

## ✅ Estado Actual de la Documentación

- ✅ Conceptos fundamentales de liquidación de nómina (según Siigo)
- ✅ Componentes salariales detallados
- ✅ Prestaciones sociales y provisiones
- ✅ Aportes parafiscales
- ✅ Ejemplo práctico completo de liquidación
- ✅ Tabla de porcentajes 2025
- ✅ Fórmulas de cálculo
- ✅ Asientos contables detallados (PUC Colombia)
- ✅ Plan de cuentas contable
- ✅ Flujo de estados técnico
- ✅ Endpoints definidos
- ⏳ Servicio de liquidación (próximo a implementar)
- ⏳ Servicio de pago individual (próximo)
- ⏳ Generación de PDFs (próximo)
- ⏳ Integración email (próximo)
- ⏳ Asientos contables automáticos (próximo)

---

## 🚀 Próximos Pasos

### Implementación Backend:

1. **Actualizar Entidades:**
   - Agregar campos para todos los conceptos de nómina en `PayrollReceipt`
   - Campos de devengos, deducciones, provisiones y costos de empleador

2. **Servicio de Liquidación:**
   - Implementar lógica de cálculo según las fórmulas definidas
   - Considerar días trabajados, horas extras, comisiones
   - Aplicar correctamente los porcentajes de ley
   - Calcular provisiones

3. **Servicio de Pago:**
   - Generación de PDF con desprendible detallado
   - Integración con notification-service
   - Actualización de estados

4. **Asientos Contables:**
   - Generación automática al liquidar
   - Generación al pagar cada empleado
   - Soporte para pago de seguridad social y parafiscales

### ¿Deseas continuar con la implementación del backend?
