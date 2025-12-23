# 📋 Plan de Actualización del Módulo de Nómina

**Proyecto:** CloudFly  
**Fecha:** 2025-12-17  
**Referencia:** [Alegra - Liquida tu Nómina](https://ayuda.alegra.com/col/liquida-tu-nomina)  
**Status:** 📋 Planificación

---

## 📊 Análisis del Estado Actual

### ✅ Lo que YA existe:

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| Entidad Employee | ✅ Completa | `backend/.../entity/Employee.java` |
| Entidad PayrollPeriod | ✅ Completa | `backend/.../entity/PayrollPeriod.java` |
| Entidad PayrollReceipt | ✅ Completa | `backend/.../entity/PayrollReceipt.java` |
| Entidad PayrollConfiguration | ✅ Completa | `backend/.../entity/PayrollConfiguration.java` |
| Menú HR en navegación | ✅ Existe | `frontend/.../verticalMenuData.tsx` |
| Página de configuración | ⚠️ Placeholder | `frontend/.../hr/config/page.tsx` |
| EmailService | ✅ Básico | `notifications/.../EmailService.java` |

### ❌ Lo que FALTA:

1. **Vista de Configuración de Nómina** - La página existe pero está vacía
2. **Campos adicionales en Employee** - NSS, Tipo de Contrato adicionales
3. **Envío de Colilla de Pago por Email** - No implementado
4. **Generación de PDF de Colilla** - No implementado
5. **Plantilla de Email para Colilla** - No existe

---

## 🎯 TAREAS DE ACTUALIZACIÓN

### FASE 1: Configuración de Nómina (Parametrización)

#### 1.1 Backend - PayrollConfigurationController
> **Archivo:** `backend/src/main/java/com/app/starter1/controllers/PayrollConfigurationController.java`

```java
// Endpoints necesarios:
GET    /api/hr/payroll/config       → Obtener configuración del tenant
PUT    /api/hr/payroll/config       → Actualizar configuración
POST   /api/hr/payroll/config/reset → Restaurar valores por defecto
```

#### 1.2 Backend - PayrollConfigurationDTO
> **Archivo:** `backend/src/main/java/com/app/starter1/dto/hr/PayrollConfigurationDTO.java`

**Campos parametrizables (desde PayrollConfiguration.java actual):**

| Grupo | Campo | Tipo | Descripción |
|-------|-------|------|-------------|
| **Prestaciones** | aguinaldoDays | Integer | Días de aguinaldo (default: 15) |
| **Prestaciones** | vacationDaysPerYear | Integer | Días de vacaciones al año |
| **Prestaciones** | vacationPremiumPercentage | BigDecimal | Prima vacacional % (default: 25%) |
| **Impuestos** | applyIsr | Boolean | ¿Aplicar ISR? |
| **Impuestos** | applyImss | Boolean | ¿Aplicar IMSS? |
| **Impuestos** | imssWorkerPercentage | BigDecimal | Cuota obrera IMSS |
| **Impuestos** | imssEmployerPercentage | BigDecimal | Cuota patronal IMSS |
| **Salario** | minimumWage | BigDecimal | Salario mínimo |
| **Salario** | umaValue | BigDecimal | UMA (Colombia: SMMLV) |
| **Timbrado** | enableCfdiTimbrado | Boolean | ¿Habilitar CFDI? |
| **Timbrado** | pacProvider | String | Proveedor PAC |
| **Banco** | bankLayoutFormat | String | Formato de layout bancario |
| **Contabilidad** | enableAccountingIntegration | Boolean | Integrar con contabilidad |
| **Contabilidad** | payrollExpenseAccount | String | Cuenta de gastos |
| **Contabilidad** | taxesPayableAccount | String | Cuenta de impuestos |
| **Contabilidad** | salariesPayableAccount | String | Cuenta de sueldos |
| **Notificaciones** | sendReceiptsByEmail | Boolean | Enviar recibos por email |
| **Notificaciones** | sendReceiptsByWhatsapp | Boolean | Enviar recibos por WhatsApp |

#### 1.3 Frontend - Página de Configuración
> **Archivo:** `frontend/src/app/(dashboard)/hr/config/page.tsx`

**Diseño similar a Alegra - Agrupado en secciones:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configuración de Nómina                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📅 PRESTACIONES SOCIALES                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ Días Aguinaldo  │ │ Días Vacaciones │ │ Prima Vacacional│       │
│  │      [ 15 ]     │ │      [ 6  ]     │ │    [ 25% ]      │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                     │
│  💰 IMPUESTOS Y DEDUCCIONES                                        │
│  ┌─────────────────┐ ┌─────────────────┐                           │
│  │ ☑ Aplicar ISR   │ │ ☑ Aplicar IMSS  │                           │
│  └─────────────────┘ └─────────────────┘                           │
│  ┌─────────────────┐ ┌─────────────────┐                           │
│  │ % Obrero IMSS   │ │ % Patronal IMSS │                           │
│  │   [ 2.375 ]     │ │   [ 20.40 ]     │                           │
│  └─────────────────┘ └─────────────────┘                           │
│                                                                     │
│  📊 SALARIOS DE REFERENCIA                                         │
│  ┌─────────────────┐ ┌─────────────────┐                           │
│  │ Salario Mínimo  │ │ UMA (SMMLV)     │                           │
│  │  [ $207.44 ]    │ │  [ $103.74 ]    │                           │
│  └─────────────────┘ └─────────────────┘                           │
│                                                                     │
│  🏦 INTEGRACIÓN CONTABLE                                           │
│  ┌─────────────────────────────────────┐                           │
│  │ ☑ Integrar con módulo de contabilidad                           │
│  └─────────────────────────────────────┘                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ Cuenta Gastos   │ │ Cuenta Impuestos│ │ Cuenta Sueldos  │       │
│  │   [ 5105 ]      │ │   [ 2365 ]      │ │   [ 2505 ]      │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                     │
│  📧 NOTIFICACIONES                                                 │
│  ┌─────────────────────────────────────┐                           │
│  │ ☑ Enviar colillas de pago por Email │                           │
│  │ ☐ Enviar colillas por WhatsApp      │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│                    [ Guardar Configuración ]                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.4 Frontend - Servicio de Configuración
> **Archivo:** `frontend/src/services/hr/payrollConfigService.ts`

```typescript
// Funciones:
getConfig(customerId: number): Promise<PayrollConfiguration>
updateConfig(customerId: number, config: PayrollConfiguration): Promise<void>
resetConfig(customerId: number): Promise<void>
```

---

### FASE 2: Completar Ficha del Empleado

#### 2.1 Campos adicionales en Employee

**Campos actuales verificados:**
- ✅ `email` - Ya existe (línea 51-52)
- ✅ `phone` - Ya existe
- ✅ `rfc` - Ya existe
- ✅ `curp` - Ya existe
- ✅ `nationalId` - Ya existe (para Colombia: Cédula)
- ✅ `baseSalary` - Ya existe
- ✅ `paymentFrequency` - Ya existe
- ✅ `paymentMethod` - Ya existe
- ✅ `bankName` - Ya existe
- ✅ `bankAccount` - Ya existe
- ✅ `clabe` - Ya existe

**Campos a AGREGAR:**

| Campo | Tipo | Descripción | País |
|-------|------|-------------|------|
| `nss` | String(11) | Número de Seguro Social | México |
| `eps` | String(100) | EPS del empleado | Colombia |
| `arl` | String(100) | ARL del empleado | Colombia |
| `afp` | String(100) | Fondo de Pensiones | Colombia |
| `cesantiasBox` | String(100) | Caja de Cesantías | Colombia |
| `salaryType` | Enum | INTEGRAL, ORDINARIO | Colombia |
| `hasTransportAllowance` | Boolean | ¿Aplica auxilio de transporte? | Colombia |

#### 2.2 Actualización de Employee Entity
> **Archivo:** `backend/src/main/java/com/app/starter1/persistence/entity/Employee.java`

#### 2.3 Actualización de EmployeeFormDialog
> **Archivo:** `frontend/src/components/hr/EmployeeFormDialog.tsx`

**Verificación del formulario actual:**
- ✅ Nombre, Apellido
- ✅ Email, Teléfono
- ✅ RFC, CURP, NSS
- ✅ Puesto, Departamento, Fecha Ingreso
- ✅ Salario Base, Frecuencia de Pago
- ✅ Datos Bancarios (Banco, Cuenta, CLABE)

**A AGREGAR para Colombia:**
- [ ] Sección "Seguridad Social"
  - EPS (Selector)
  - ARL (Selector)
  - Fondo de Pensiones (Selector)
  - Caja de Cesantías (Selector)
- [ ] Tipo de Salario (Integral/Ordinario)
- [ ] ¿Aplica Auxilio de Transporte? (Switch)

---

### FASE 3: Servicio de Envío de Colilla de Pago

#### 3.1 Extensión de NotificationMessage
> **Archivo:** `notifications/src/main/java/com/notification/service/dto/NotificationMessage.java`

**Campos a agregar:**

```java
// Para soportar adjuntos PDF
private byte[] pdfAttachment;
private String pdfFileName;
private Map<String, Object> templateData; // Datos dinámicos para plantilla
```

#### 3.2 Creación de Plantilla FreeMarker para Colilla
> **Archivo:** `notifications/src/main/resources/templates/payroll-receipt.ftl`

**Plantilla HTML similar a Alegra:**

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Estilos profesionales */
    </style>
</head>
<body>
    <div class="header">
        <h1>Colilla de Pago</h1>
        <p>${companyName}</p>
        <p>NIT: ${companyNit}</p>
    </div>
    
    <div class="employee-info">
        <p><strong>Empleado:</strong> ${employeeName}</p>
        <p><strong>Identificación:</strong> ${employeeId}</p>
        <p><strong>Cargo:</strong> ${jobTitle}</p>
    </div>
    
    <div class="period-info">
        <p><strong>Período:</strong> ${periodStart} - ${periodEnd}</p>
        <p><strong>Días Liquidados:</strong> ${daysWorked}</p>
        <p><strong>Método de Pago:</strong> ${paymentMethod}</p>
    </div>
    
    <div class="summary">
        <table>
            <tr>
                <td>Salario</td>
                <td>${baseSalary}</td>
            </tr>
            <tr>
                <td>Ingresos Adicionales</td>
                <td>${additionalIncome}</td>
            </tr>
            <tr>
                <td>Deducciones</td>
                <td>${totalDeductions}</td>
            </tr>
            <tr class="total">
                <td><strong>TOTAL A PAGAR</strong></td>
                <td><strong>${netPay}</strong></td>
            </tr>
        </table>
    </div>
</body>
</html>
```

#### 3.3 Generador de PDF de Colilla
> **Archivo:** `backend/src/main/java/com/app/starter1/services/PayrollReceiptPdfService.java`

**Dependencias necesarias (pom.xml):**
```xml
<!-- OpenPDF para generación de PDF -->
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>1.3.30</version>
</dependency>

<!-- O iText (versión libre) -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
</dependency>
```

**Funciones:**
- `generateReceiptPdf(PayrollReceipt receipt): byte[]`
- `generateReceiptPdfFile(PayrollReceipt receipt): File`

#### 3.4 Extensión de EmailService para adjuntos
> **Archivo:** `notifications/src/main/java/com/notification/service/services/EmailService.java`

**Método nuevo:**
```java
public void sendEmailWithAttachment(NotificationMessage notification) {
    MimeMessage mimeMessage = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
    
    helper.setTo(notification.getTo());
    helper.setSubject(notification.getSubject());
    helper.setText(loadTemplate(notification), true);
    
    // Agregar PDF adjunto
    if (notification.getPdfAttachment() != null) {
        helper.addAttachment(
            notification.getPdfFileName(),
            new ByteArrayResource(notification.getPdfAttachment()),
            "application/pdf"
        );
    }
    
    mailSender.send(mimeMessage);
}
```

#### 3.5 Servicio de Envío de Colilla
> **Archivo:** `backend/src/main/java/com/app/starter1/services/PayrollNotificationService.java`

```java
@Service
public class PayrollNotificationService {
    
    public void sendReceiptByEmail(PayrollReceipt receipt) {
        Employee employee = receipt.getEmployee();
        
        if (employee.getEmail() == null) {
            throw new RuntimeException("El empleado no tiene email configurado");
        }
        
        // 1. Generar PDF
        byte[] pdfBytes = receiptPdfService.generateReceiptPdf(receipt);
        
        // 2. Preparar mensaje
        NotificationMessage message = new NotificationMessage();
        message.setTo(employee.getEmail());
        message.setSubject("Tu Colilla de Pago - " + receipt.getPayrollPeriod().getPeriodName());
        message.setType("payroll-receipt");
        message.setUsername(employee.getFullName());
        message.setPdfAttachment(pdfBytes);
        message.setPdfFileName("colilla_" + receipt.getReceiptNumber() + ".pdf");
        
        // 3. Enviar a Kafka
        kafkaTemplate.send("notification-topic", objectMapper.writeValueAsString(message));
    }
    
    public void sendReceiptsForPeriod(Long periodId) {
        List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriodId(periodId);
        for (PayrollReceipt receipt : receipts) {
            sendReceiptByEmail(receipt);
        }
    }
}
```

#### 3.6 Endpoint para Envío de Colilla
> **Archivo:** `backend/src/main/java/com/app/starter1/controllers/PayrollProcessingController.java`

```java
// Enviar colilla individual por email
@PostMapping("/receipts/{receiptId}/send-email")
public ResponseEntity<?> sendReceiptByEmail(@PathVariable Long receiptId) {
    notificationService.sendReceiptByEmail(receiptId);
    return ResponseEntity.ok(Map.of("message", "Colilla enviada exitosamente"));
}

// Enviar todas las colillas del periodo
@PostMapping("/periods/{periodId}/send-all-emails")
public ResponseEntity<?> sendAllReceiptsByEmail(@PathVariable Long periodId) {
    int sent = notificationService.sendReceiptsForPeriod(periodId);
    return ResponseEntity.ok(Map.of("message", sent + " colillas enviadas"));
}
```

---

### FASE 4: Actualización del Menú

#### 4.1 Menú Actualizado
> **Archivo:** `frontend/src/data/navigation/verticalMenuData.tsx`

**Estructura propuesta (similar a Alegra):**

```typescript
{
  label: 'Recursos Humanos',
  icon: 'tabler-users',
  children: [
    // === GESTIÓN ===
    {
      label: 'Empleados',
      href: '/hr/employees',
      icon: 'tabler-user-circle'
    },
    {
      label: 'Conceptos de Nómina',
      href: '/hr/concepts',
      icon: 'tabler-list-details'
    },
    // === LIQUIDACIÓN (como Alegra) ===
    {
      label: 'Liquidación',
      icon: 'tabler-calculator',
      children: [
        {
          label: 'Periodos',
          href: '/hr/periods'
        },
        {
          label: 'Procesar Nómina',
          href: '/hr/process'
        },
        {
          label: 'Recibos de Nómina',
          href: '/hr/receipts'
        }
      ]
    },
    // === EMISIÓN (futuro) ===
    {
      label: 'Emisión',
      href: '/hr/emission',
      icon: 'tabler-send',
      suffix: {
        label: 'Próximamente',
        color: 'warning'
      }
    },
    // === CONFIGURACIÓN ===
    {
      label: 'Configuración',
      href: '/hr/config',
      icon: 'tabler-settings'
    }
  ]
}
```

---

## 📁 Archivos a Crear/Modificar

### Backend

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `PayrollConfigurationController.java` | ✨ Crear | Controlador de configuración |
| `PayrollConfigurationService.java` | ✨ Crear | Servicio de configuración |
| `PayrollConfigurationDTO.java` | ✨ Crear | DTO de configuración |
| `PayrollReceiptPdfService.java` | ✨ Crear | Generador de PDF |
| `PayrollNotificationService.java` | ✨ Crear | Servicio de notificación |
| `Employee.java` | ✏️ Modificar | Agregar campos Colombia |
| `EmployeeDTO.java` | ✏️ Modificar | Agregar campos Colombia |
| `PayrollProcessingController.java` | ✏️ Modificar | Agregar endpoints de email |
| `pom.xml` | ✏️ Modificar | Agregar OpenPDF/iText |

### Frontend

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `hr/config/page.tsx` | ✏️ Reemplazar | Implementar formulario completo |
| `payrollConfigService.ts` | ✨ Crear | Servicio API de configuración |
| `EmployeeFormDialog.tsx` | ✏️ Modificar | Agregar campos Colombia |
| `verticalMenuData.tsx` | ✏️ Modificar | Reorganizar menú HR |
| `types/hr/payrollConfig.ts` | ✨ Crear | Tipos TS de configuración |

### Notifications Service

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `NotificationMessage.java` | ✏️ Modificar | Soporte para adjuntos |
| `EmailService.java` | ✏️ Modificar | Método con adjuntos |
| `payroll-receipt.ftl` | ✨ Crear | Plantilla de colilla |

---

## ⏱️ Estimación de Tiempo

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| **Fase 1** | Configuración de Nómina | 3-4 horas |
| **Fase 2** | Completar Ficha Empleado | 2-3 horas |
| **Fase 3** | Envío de Colilla por Email | 4-5 horas |
| **Fase 4** | Actualización del Menú | 30 minutos |
| **TOTAL** | | **~10-12 horas** |

---

## 🔄 Orden de Implementación

1. **Primero:** Actualizar menú (Fase 4) - Rápido y visual
2. **Segundo:** Configuración de Nómina (Fase 1) - Base para todo
3. **Tercero:** Completar Empleado (Fase 2) - Datos necesarios
4. **Cuarto:** Envío de Colilla (Fase 3) - Funcionalidad compleja

---

## ✅ Checklist de Implementación

### Fase 1: Configuración ✅ COMPLETADA
- [x] PayrollConfigurationController.java
- [x] PayrollConfigurationService.java
- [x] PayrollConfigurationDTO.java
- [x] Frontend: config/page.tsx (completo)
- [x] Frontend: payrollConfigService.ts
- [x] Frontend: types incluidos en payrollConfigService.ts

### Fase 2: Empleado ✅ COMPLETADA
- [x] Agregar campos Colombia en Employee.java (EPS, ARL, AFP, Cesantías, etc.)
- [x] Actualizar EmployeeDTO.java (campos Colombia agregados)
- [x] Actualizar EmployeeCreateDTO.java (campos Colombia agregados)
- [x] Actualizar EmployeeFormDialog.tsx (con sección Seguridad Social Colombia)
- [x] Migración SQL para nuevos campos (V12__hr_payroll_configuration.sql)
- [x] Actualizar EmployeeService.java (mapeo de campos Colombia)

### Fase 3: Notificaciones ✅ COMPLETADA
- [x] Agregar dependencia OpenPDF en pom.xml
- [x] PayrollReceiptPdfService.java
- [x] PayrollNotificationService.java
- [x] Actualizar NotificationMessage.java (soporte PDF adjunto)
- [x] Actualizar EmailService.java (método con adjuntos)
- [x] Crear plantilla payroll-receipt.ftl
- [x] Endpoints de envío en controller (/send-email, /send-all-emails, /download-pdf)

---

## 🧪 Pruebas de UI/UX (Browser Test - 2025-12-17)

| Página | URL | Estado | Notas |
|--------|-----|--------|-------|
| **Dashboard de Nómina** | `/hr/dashboard` | ✅ OK | Widgets, alertas, accesos rápidos funcionan correctamente |
| **Lista de Empleados** | `/hr/employees` | ✅ OK | Tabla con 5 empleados, botones de acción funcionan |
| **Perfil de Empleado** | `/hr/employees/[id]` | ✅ OK | Tabs de info, laboral, seguridad social, historial |
| **Conceptos de Nómina** | `/hr/concepts` | ✅ OK | Sin conceptos, botón "Nuevo Concepto" visible |
| **Periodos** | `/hr/periods` | ✅ OK | 1 periodo creado (BIWEEKLY 1/2025) |
| **Procesar Nómina** | `/hr/process` | ✅ OK | Stepper de 4 pasos funcional |
| **Recibos de Nómina** | `/hr/receipts` | ✅ OK | Selector de periodo funcional |
| **Configuración** | `/hr/config` | ✅ OK | Formulario con todas las secciones |

### Correcciones Realizadas

1. **payrollConfigService.ts** - Corregido import de `@/utils/api` a `@/utils/axiosInterceptor`
2. **employees/[id]/page.tsx** - Corregido nombre del token de `token` a `AuthToken` en localStorage

---

**Documento creado:** 2025-12-17  
**Implementación completada:** 2025-12-17  
**Pruebas UI completadas:** 2025-12-17 22:50  
**Compilación Backend:** ✅ BUILD SUCCESS  
**Status:** ✅ TODAS LAS FASES IMPLEMENTADAS Y PROBADAS


