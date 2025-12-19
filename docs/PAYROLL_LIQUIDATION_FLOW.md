# 💼 Implementación Completa: Liquidación y Pago de Nómina

## 📊 Flujo de Estados

### Estados del Período:
```
OPEN → LIQUIDATED → PARTIALLY_PAID → PAID → CLOSED
```

### Estados del Recibo Individual:
```
PENDING → PAID
```

---

## 🔄 Proceso Completo

### 1️⃣ **LIQUIDAR PERÍODO**
**Endpoint:** `POST /api/hr/periods/{id}/liquidate`

**Acciones:**
- Calcula nómina de cada empleado (salario proporcional + novedades)
- Genera `PayrollReceipt` (estado: PENDING) para cada empleado
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
  "totalNetPay": 2120600,
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

### Al Liquidar (NO se genera asiento, solo cálculo)
```
// Solo cálculo en memoria, no se registra aún
```

### Al Pagar Cada Empleado:
```
CONCEPTO: Pago Nómina - {employeeName} - {periodName}
FECHA: {paidAt}

DÉBITO:
  233595 - Nómina por Pagar         ${netPay}

CRÉDITO:
  111005 - Bancos                   ${netPay}
```

### Al Cerrar Período (Provisiones):
```
CONCEPTO: Provisión Nómina - {periodName}
FECHA: {closeDate}

DÉBITOS:
  510506 - Sueldos y Salarios       $ 2,305,000
  510527 - Aportes Empleador        $   692,007
  511020 - Provisiones              $   482,052

CRÉDITOS:
  238030 - Salud por Pagar (Empl)   $    92,200
  238035 - Pensión por Pagar (Empl) $    92,200
  233595 - Nómina por Pagar         $ 3,294,659
```

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

---

## 🔧 Endpoints a Implementar

1. `POST /api/hr/periods/{id}/liquidate` - Liquidar período completo
2. `POST /api/hr/receipts/{id}/pay` - Pagar empleado individual
3. `POST /api/hr/periods/{id}/close` - Cerrar período
4. `GET /api/hr/periods/{id}/receipts` - Listar recibos del período
5. `GET /api/hr/receipts/{id}/pdf` - Descargar PDF del recibo

---

## ✅ Estado Actual

- ✅ Estados actualizados en entidades
- ⏳ Servicio de liquidación (próximo)
- ⏳ Servicio de pago individual (próximo)
- ⏳ Generación de PDFs (próximo)
- ⏳ Integración email (próximo)
- ⏳ Asientos contables (próximo)

---

## 🚀 Siguiente Paso

¿Continúo con la implementación del backend (serviciosendpoints)?
