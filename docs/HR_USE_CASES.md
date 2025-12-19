# 📋 CASOS DE USO - MÓDULO DE NÓMINA

## 👤 ACTORES DEL SISTEMA

1. **Administrador de RH** - Gestiona empleados y procesa nómina
2. **Empleado** - Consulta sus recibos
3. **Sistema** - Realiza cálculos automáticos

---

## 📊 CASO DE USO 1: GESTIÓN DE EMPLEADOS

### UC-001: Crear Empleado

**Actor Principal:** Administrador de RH

**Precondiciones:**
- Usuario autenticado con rol HR o ADMIN
- Customer ID válido

**Flujo Principal:**
1. El administrador navega a `/hr/employees`
2. Hace clic en "Nuevo Empleado"
3. Completa el formulario con:
   - Datos personales (nombre, RFC, CURP, NSS)
   - Datos laborales (puesto, departamento, fecha de ingreso)
   - Datos de nómina (salario base, frecuencia de pago)
   - Datos bancarios (banco, CLABE, número de cuenta)
4. El sistema valida los datos
5. El sistema asigna un número de empleado único
6. El sistema guarda el empleado en la BD
7. El sistema muestra confirmación

**Postcondiciones:**
- Empleado creado con estado ACTIVO
- Empleado visible en la lista
- Empleado disponible para procesar nómina

**Flujos Alternos:**
- **3a.** Datos inválidos → Sistema muestra errores
- **6a.** RFC duplicado → Sistema rechaza y muestra error

**Endpoints Usados:**
```
POST /api/hr/employees?customerId=1
Body: EmployeeCreateDTO
```

---

### UC-002: Consultar Empleados

**Actor Principal:** Administrador de RH

**Flujo Principal:**
1. El administrador navega a `/hr/employees`
2. El sistema muestra lista paginada de empleados
3. El administrador puede:
   - Buscar por nombre o número
   - Filtrar por estatus (Activo/Inactivo)
   - Ver detalles de un empleado
4. El sistema muestra resultados

**Endpoints Usados:**
```
GET /api/hr/employees?customerId=1&page=0&size=10&search=Juan
```

---

### UC-003: Editar Empleado

**Actor Principal:** Administrador de RH

**Flujo Principal:**
1. El administrador busca y selecciona un empleado
2. Hace clic en "Editar"
3. Modifica los campos necesarios
4. El sistema valida los cambios
5. El sistema actualiza el registro
6. El sistema muestra confirmación

**Restricciones:**
- No se puede editar el número de empleado
- No se puede cambiar el RFC si tiene nómina pagada

**Endpoints Usados:**
```
PUT /api/hr/employees/{id}?customerId=1
Body: EmployeeDTO
```

---

### UC-004: Desactivar Empleado

**Actor Principal:** Administrador de RH

**Flujo Principal:**
1. El administrador selecciona un empleado activo
2. Hace clic en "Desactivar"
3. El sistema verifica que no tenga nómina pendiente
4. El sistema cambia el estado a INACTIVO
5. El sistema registra fecha de baja
6. El sistema muestra confirmación

**Validaciones:**
- No procesar en futuros periodos
- Mantener historial de nómina

**Endpoints Usados:**
```
PATCH /api/hr/employees/{id}/toggle-status?customerId=1
```

---

## 💰 CASO DE USO 2: PROCESAR Y PAGAR NÓMINA

### UC-101: Crear Periodo de Nómina

**Actor Principal:** Administrador de RH

**Precondiciones:**
- Tener empleados activos
- Conceptos de nómina inicializados

**Flujo Principal:**
1. El administrador navega a `/hr/periods`
2. Hace clic en "Nuevo Periodo"
3. Completa el formulario:
   - Tipo de periodo (SEMANAL, QUINCENAL, MENSUAL)
   - Número de periodo
   - Año
   - Fecha inicio y fin
   - Fecha de pago
4. El sistema calcula días trabajados
5. El sistema crea el periodo con estado OPEN
6. El sistema muestra confirmación

**Postcondiciones:**
- Periodo creado listo para procesamiento

**Endpoints Usados:**
```
POST /api/hr/periods?customerId=1
Body: {
  periodType: "BIWEEKLY",
  periodNumber: 24,
  year: 2025,
  startDate: "2025-12-16",
  endDate: "2025-12-31",
  paymentDate: "2026-01-02"
}
```

---

### UC-102: Calcular Nómina del Periodo

**Actor Principal:** Administrador de RH / Sistema

**Precondiciones:**
- Periodo en estado OPEN
- Al menos un empleado activo

**Flujo Principal:**
1. El administrador navega a `/hr/process`
2. Selecciona el periodo a procesar
3. Hace clic en "Calcular Nómina"
4. **El sistema para cada empleado activo:**
   
   **4.1 Calcula salario base:**
   - dailySalary = baseSalary / días_periodo
   - basePay = dailySalary × workingDays
   
   **4.2 Aplica percepciones recurrentes:**
   - Aguinaldo proporcional
   - Prima vacacional
   - Bonos asignados
   
   **4.3 Aplica incidencias del periodo:**
   - ➕ Horas extra
   - ➕ Bonos extraordinarios
   - ➖ Faltas no justificadas
   - ➖ Permisos sin goce
   
   **4.4 Calcula deducciones:**
   - **ISR:** Si ingreso > $10,000 → 10%
   - **IMSS:** 2.5% del salario
   - Préstamos activos
   - Otras deducciones
   
   **4.5 Calcula neto:**
   - netPay = totalPerceptions - totalDeductions
   
   **4.6 Genera recibo:**
   - Número de recibo único
   - Desglose detallado
   - Estado: CALCULATED

5. El sistema actualiza estado del periodo a CALCULATED
6. El sistema muestra resumen:
   - Empleados procesados: N
   - Total percepciones: $XXX
   - Total deducciones: $XXX
   - Total neto a pagar: $XXX

**Postcondiciones:**
- N recibos creados (uno por empleado)
- Periodo en estado CALCULATED
- Datos listos para aprobación

**Endpoints Usados:**
```
POST /api/hr/payroll/periods/{periodId}/process?customerId=1

Response: {
  "message": "Payroll processed successfully",
  "processedCount": 5,
  "errorsCount": 0,
  "periodStatus": "CALCULATED"
}
```

**Lógica de Cálculo (Backend):**
```java
// PayrollCalculationService.calculatePayroll()

1. Obtener datos del empleado y periodo
2. Calcular salario diario según frecuencia
3. Calcular sueldo base = dailySalary × workingDays
4. Sumar percepciones recurrentes
5. Aplicar incidencias (bonos, horas extra, faltas)
6. Calcular ISR e IMSS
7. Aplicar deducciones recurrentes
8. Calcular neto = percepciones - deducciones
9. Retornar PayrollCalculationResult
```

---

### UC-103: Revisar Recibos Generados

**Actor Principal:** Administrador de RH

**Precondiciones:**
- Nómina calculada (estado CALCULATED)

**Flujo Principal:**
1. El administrador navega a `/hr/receipts`
2. Selecciona el periodo procesado
3. El sistema muestra tabla con todos los recibos:
   - Empleado
   - Días trabajados
   - Salario base
   - Percepciones
   - Deducciones
   - ISR / IMSS
   - **Neto a pagar**
4. El administrador puede:
   - Ver detalle de cada recibo
   - Ordenar por columna
   - Exportar a PDF/Excel
   - Enviar por email

**Endpoints Usados:**
```
GET /api/hr/payroll/periods/{periodId}/receipts?customerId=1

Response: [
  {
    "id": 1,
    "employeeName": "Juan Pérez",
    "receiptNumber": "2025-0024-EMP001",
    "regularDays": 15,
    "baseSalary": 15000.00,
    "totalPerceptions": 15000.00,
    "totalDeductions": 1875.00,
    "isrAmount": 1500.00,
    "imssAmount": 375.00,
    "netPay": 13125.00,
    "status": "CALCULATED"
  },
  ...
]
```

---

### UC-104: Aprobar Nómina

**Actor Principal:** Administrador de RH

**Precondiciones:**
- Periodo en estado CALCULATED
- Recibos revisados y validados

**Flujo Principal:**
1. El administrador está en `/hr/process` paso 2
2. Revisa el resumen de recibos
3. Verifica que los montos sean correctos
4. Hace clic en "Aprobar Nómina"
5. El sistema:
   - Cambia estado de todos los recibos a APPROVED
   - Cambia estado del periodo a APPROVED
   - Registra fecha y usuario que aprobó
6. El sistema muestra confirmación
7. El sistema habilita botón "Registrar Pago"

**Postcondiciones:**
- Nómina bloqueada para modificaciones
- Lista para pago

**Endpoints Usados:**
```
POST /api/hr/payroll/periods/{periodId}/approve?customerId=1

Response: {
  "message": "Payroll approved successfully"
}
```

---

### UC-105: Registrar Pago de Nómina

**Actor Principal:** Administrador de RH

**Precondiciones:**
- Periodo en estado APPROVED
- Fondos disponibles (validación externa)

**Flujo Principal:**
1. El administrador está en `/hr/process` paso 3
2. Hace clic en "Registrar Pago"
3. **El sistema para cada recibo:**
   - Cambia estado a PAID
   - Registra fecha de pago (paidAt)
   - Genera referencia de pago
   - [OPCIONAL] Envía notificación al empleado
4. El sistema cambia estado del periodo a PAID
5. El sistema muestra mensaje de éxito
6. [FUTURO] El sistema genera dispersión bancaria

**Postcondiciones:**
- Todos los recibos marcados como PAID
- Periodo cerrado
- Empleados pueden consultar su recibo

**Endpoints Usados:**
```
POST /api/hr/payroll/periods/{periodId}/pay?customerId=1

Response: {
  "message": "Payment registered successfully"
}
```

**Flujo Futuro con Notificaciones:**
```java
// En PayrollProcessingService.registerPayment()
for (PayrollReceipt receipt : receipts) {
    receipt.setStatus(PAID);
    receipt.setPaidAt(LocalDateTime.now());
    receiptRepository.save(receipt);
    
    // Enviar notificación por email
    notificationService.sendPayrollReceipt(
        receipt.getEmployee().getEmail(),
        receipt
    );
}
```

---

## 👨‍💼 CASO DE USO 3: CONSULTA POR EMPLEADO

### UC-201: Consultar Mis Recibos (Portal de Empleado)

**Actor Principal:** Empleado

**Precondiciones:**
- Empleado autenticado
- Tener al menos un recibo pagado

**Flujo Principal:**
1. El empleado ingresa al portal
2. Navega a "Mis Recibos"
3. El sistema muestra lista de recibos:
   - Periodo
   - Fecha de pago
   - Neto pagado
   - Estado
4. El empleado selecciona un recibo
5. El sistema muestra desglose completo:
   - **Percepciones:**
     - Sueldo base
     - Horas extra
     - Bonos
     - Total percepciones
   - **Deducciones:**
     - ISR
     - IMSS
     - Préstamos
     - Total deducciones
   - **Neto a pagar**
6. El empleado puede:
   - Descargar PDF
   - Enviar a su email
   - Imprimir

**Endpoints Futuros:**
```
GET /api/hr/my-receipts?employeeId={userId}
GET /api/hr/my-receipts/{receiptId}/pdf
```

---

## 🔄 DIAGRAMA DE FLUJO COMPLETO

```
┌─────────────────────────────────────────────────────────┐
│              CICLO COMPLETO DE NÓMINA                    │
└─────────────────────────────────────────────────────────┘

1. PREPARACIÓN
   ├─ Crear/Actualizar Empleados
   ├─ Verificar Conceptos de Nómina
   └─ Registrar Incidencias del Periodo

2. CREACIÓN DE PERIODO
   └─ Nuevo Periodo → Estado: OPEN

3. CÁLCULO (Automático)
   ├─ Procesar Empleados Activos
   ├─ Calcular Percepciones
   ├─ Calcular Deducciones (ISR, IMSS)
   ├─ Generar Recibos
   └─ Periodo → Estado: CALCULATED

4. REVISIÓN
   ├─ Ver Recibos Generados
   ├─ Validar Montos
   └─ Verificar Empleados

5. APROBACIÓN
   ├─ Aprobar Nómina
   └─ Periodo → Estado: APPROVED

6. PAGO
   ├─ Registrar Pago
   ├─ Generar Transferencias
   ├─ Enviar Notificaciones
   └─ Periodo → Estado: PAID

7. POST-PAGO
   ├─ Empleados consultan recibos
   ├─ Contabilidad registra pólizas
   └─ Archivo de periodos
```

---

## 📊 ESTADOS DEL PERIODO Y TRANSICIONES

```
OPEN → Solo lectura de empleados
  ↓ [Procesar]
CALCULATED → Recibos generados, revisión
  ↓ [Aprobar]
APPROVED → Nómina validada, lista para pago
  ↓ [Pagar]
PAID → Nómina pagada, periodo cerrado
  ↓ [Cerrar]
CLOSED → Archivado, solo lectura
```

---

## 🎯 EJEMPLO PRÁCTICO: PAGAR A JUAN PÉREZ

### Datos Iniciales
- **Empleado:** Juan Pérez
- **Puesto:** Gerente
- **Salario Base:** $15,000/mes
- **Periodo:** Quincenal (15 días)

### Paso 1: Cálculo Automático

```javascript
// El sistema calcula automáticamente:

dailySalary = 15000 / 30 = $500/día
basePay = 500 × 15 = $7,500

// Percepciones
Sueldo Base: $7,500
Bono Puntualidad: $500
────────────────────────
Total Percepciones: $8,000

// Deducciones
ISR (10%): $800
IMSS (2.5%): $187.50
────────────────────────
Total Deducciones: $987.50

// NETO
Neto a Pagar: $7,012.50
```

### Paso 2: Flujo en la UI

```
1. Admin va a /hr/process
2. Selecciona "Quincena 24 - Diciembre 2025"
3. Click "Calcular Nómina"
   → Sistema procesa 5 empleados
   → Genera 5 recibos
   
4. Admin revisa tabla:
   Juan Pérez | 15 días | $15,000 | $8,000 | $987.50 | $7,012.50 ✓

5. Click "Aprobar Nómina"
   → Estado: APPROVED

6. Click "Registrar Pago"
   → Estado: PAID
   → Juan recibe notificación por email
```

---

## 📧 INTEGRACIÓN CON NOTIFICACIONES (Futuro)

### Topic Kafka: `payroll.receipt.paid`

```json
{
  "eventType": "PAYROLL_RECEIPT_PAID",
  "receiptId": 123,
  "employeeId": 456,
  "employeeEmail": "juan.perez@company.com",
  "periodName": "Quincena 24 - Diciembre 2025",
  "netPay": 7012.50,
  "paidAt": "2025-12-31T18:00:00"
}
```

### Plantilla de Email

**Asunto:** 💰 Tu recibo de nómina está disponible - Quincena 24

**Cuerpo:**
```
Hola Juan Pérez,

Tu pago de nómina ha sido procesado:

Periodo: Quincena 24 - Diciembre 2025
Monto neto: $7,012.50 MXN
Fecha de pago: 31/12/2025

Puedes consultar el desglose completo en tu portal de empleado.

[Ver Mi Recibo] [Descargar PDF]

Saludos,
Equipo de RH
```

---

## ✅ RESUMEN DE CASOS DE USO

| ID | Caso de Uso | Actor | Estado |
|----|-------------|-------|---------|
| UC-001 | Crear Empleado | Admin RH | ✅ Backend |
| UC-002 | Consultar Empleados | Admin RH | ✅ Completo |
| UC-003 | Editar Empleado | Admin RH | ✅ Backend |
| UC-004 | Desactivar Empleado | Admin RH | ✅ Completo |
| UC-101 | Crear Periodo | Admin RH | ✅ Backend |
| UC-102 | Calcular Nómina | Sistema | ✅ **Completo** |
| UC-103 | Revisar Recibos | Admin RH | ✅ **Completo** |
| UC-104 | Aprobar Nómina | Admin RH | ✅ **Completo** |
| UC-105 | Registrar Pago | Admin RH | ✅ **Completo** |
| UC-201 | Consultar Recibos | Empleado | 🔜 Futuro |

---

**Documento creado:** 2025-12-16
**Módulo:** HR & Payroll - CloudFly
**Estado:** ✅ Funcional
