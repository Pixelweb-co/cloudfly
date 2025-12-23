# 📋 Plan de Implementación: Sistema de Liquidación de Nómina Colombia

## 📊 Análisis del Estado Actual

### Backend Existente:
- ✅ Entidades base creadas (Employee, PayrollPeriod, PayrollReceipt, PayrollReceiptDetail)
- ✅ Repositorios configurados
- ✅ Servicios básicos (PayrollCalculationService, PayrollLiquidationService)
- ✅ Controladores base (PayrollLiquidationController)
- ⚠️ **FALTAN:** Campos para conceptos colombianos (prestaciones sociales, provisiones, parafiscales)
- ⚠️ **FALTAN:** Cálculos específicos de Colombia (cesantías, prima, intereses, vacaciones)
- ⚠️ **FALTAN:** Integración contable detallada

### Frontend Existente:
- ✅ Páginas de períodos (/hr/periods)
- ✅ Página de recibos (/hr/receipts)
- ✅ Tipos TypeScript básicos
- ✅ Servicios de API
- ⚠️ **FALTAN:** Campos en tipos para conceptos colombianos
- ⚠️ **FALTAN:** UI para detalles de liquidación
- ⚠️ **FALTAN:** Componentes para mostrar desglose de nómina
- ⚠️ **FALTAN:** Vista de pago individual de empleados

---

## 🎯 Tareas de Implementación

### FASE 1: Backend - Entidades y Modelo de Datos

#### Tarea 1.1: Actualizar Entidad `PayrollReceipt`
**Archivo:** `backend/src/main/java/com/app/starter1/persistence/entity/PayrollReceipt.java`

**Acciones:**
- [ ] Agregar campos de devengos (earnings):
  ```java
  // DEVENGOS/EARNINGS
  private BigDecimal salaryAmount = BigDecimal.ZERO;
  private BigDecimal overtimeAmount = BigDecimal.ZERO;
  private BigDecimal commissionsAmount = BigDecimal.ZERO;
  private BigDecimal transportAllowanceAmount = BigDecimal.ZERO;
  private BigDecimal bonusesAmount = BigDecimal.ZERO;
  private BigDecimal otherEarnings = BigDecimal.ZERO;
  ```

- [ ] Agregar campos de deducciones (deductions):
  ```java
  // DEDUCCIONES LEGALES
  private BigDecimal healthDeduction = BigDecimal.ZERO; // 4%
  private BigDecimal pensionDeduction = BigDecimal.ZERO; // 4%
  private BigDecimal otherDeductions = BigDecimal.ZERO; // Préstamos, embargos, etc.
  ```

- [ ] Agregar campos de costos del empleador:
  ```java
  // COSTOS DEL EMPLEADOR (para contabilidad)
  private BigDecimal employerHealthContribution = BigDecimal.ZERO; // 8.5%
  private BigDecimal employerPensionContribution = BigDecimal.ZERO; // 12%
  private BigDecimal arlContribution = BigDecimal.ZERO; // 0.522% - 6.96%
  private BigDecimal senaContribution = BigDecimal.ZERO; // 2%
  private BigDecimal icbfContribution = BigDecimal.ZERO; // 3%
  private BigDecimal cajaCompensacionContribution = BigDecimal.ZERO; // 4%
  ```

- [ ] Agregar campos de provisiones:
  ```java
  // PROVISIONES (prestaciones sociales)
  private BigDecimal primaServiciosProvision = BigDecimal.ZERO;
  private BigDecimal cesantiasProvision = BigDecimal.ZERO;
  private BigDecimal interesesCesantiasProvision = BigDecimal.ZERO;
  private BigDecimal vacacionesProvision = BigDecimal.ZERO;
  ```

- [ ] Eliminar/renombrar campos no aplicables a Colombia:
  - Cambiar `isrAmount` → `incomeTaxAmount` (para futura implementación)
  - Cambiar `imssAmount` → `socialSecurityAmount`
  - Eliminar o marcar como deprecated campos CFDI de México

- [ ] Actualizar método `calculateNetPay()`:
  ```java
  public void calculateNetPay() {
      BigDecimal totalEarnings = salaryAmount
          .add(overtimeAmount)
          .add(commissionsAmount)
          .add(transportAllowanceAmount)
          .add(bonusesAmount)
          .add(otherEarnings);
      
      BigDecimal totalDeductions = healthDeduction
          .add(pensionDeduction)
          .add(otherDeductions);
      
      this.totalPerceptions = totalEarnings;
      this.totalDeductions = totalDeductions;
      this.netPay = totalEarnings.subtract(totalDeductions);
  }
  ```

#### Tarea 1.2: Crear Entidad `PayrollConfiguration`
**Archivo:** `backend/src/main/java/com/app/starter1/persistence/entity/PayrollConfiguration.java`

**Acciones:**
- [ ] Verificar que contenga porcentajes configurables:
  ```java
  private BigDecimal healthEmployeePercentage = new BigDecimal("4.00");
  private BigDecimal healthEmployerPercentage = new BigDecimal("8.50");
  private BigDecimal pensionEmployeePercentage = new BigDecimal("4.00");
  private BigDecimal pensionEmployerPercentage = new BigDecimal("12.00");
  private BigDecimal senaPercentage = new BigDecimal("2.00");
  private BigDecimal icbfPercentage = new BigDecimal("3.00");
  private BigDecimal cajaPercentage = new BigDecimal("4.00");
  private BigDecimal interesesCesantiasPercentage = new BigDecimal("12.00");
  
  // Valores 2025
  private BigDecimal smmlv = new BigDecimal("1423500");
  private BigDecimal transportAllowance = new BigDecimal("140606");
  
  // Configuración parafiscales
  private Boolean applyParafiscales = true; // Si tiene >10 empleados
  ```

#### Tarea 1.3: Migración de Base de Datos
**Archivo:** `backend/src/main/resources/db/migration/V[X]__update_payroll_receipts_colombia.sql`

**Acciones:**
- [ ] Crear migración Flyway para agregar nuevas columnas a `payroll_receipts`
- [ ] Agregar índices apropiados
- [ ] Crear tabla de configuración si no existe
- [ ] Script de datos iniciales con valores 2025

---

### FASE 2: Backend - Servicios de Cálculo

#### Tarea 2.1: Actualizar `PayrollCalculationService`
**Archivo:** `backend/src/main/java/com/app/starter1/services/PayrollCalculationService.java`

**Acciones:**
- [ ] Crear método `calculateDevengos()`:
  ```java
  private DevengosResult calculateDevengos(Employee employee, PayrollPeriod period, 
      List<PayrollNovelty> novelties, PayrollConfiguration config)
  ```
  - Calcular salario base proporcional
  - Calcular horas extras (con recargos 25%, 75%)
  - Calcular comisiones
  - Calcular auxilio de transporte (solo si salario < 2 SMMLV)
  - Procesar novedades de ingreso (bonos, incentivos)

- [ ] Crear método `calculateDeducciones()`:
  ```java
  private DeduccionesResult calculateDeducciones(Employee employee, BigDecimal baseForContributions,
      List<PayrollNovelty> novelties, PayrollConfiguration config)
  ```
  - Base = Salario + Horas Extras (NO incluye aux. transporte)
  - Salud: 4% de la base
  - Pensión: 4% de la base
  - Procesar novedades de egreso (préstamos, embargos, descuentos)

- [ ] Crear método `calculateEmployerCosts()`:
  ```java
  private EmployerCostsResult calculateEmployerCosts(Employee employee, BigDecimal baseForContributions,
      PayrollConfiguration config)
  ```
  - Salud empleador: 8.5%
  - Pensión empleador: 12%
  - ARL: según nivel de riesgo del empleado (0.522% - 6.96%)
  - SENA: 2% (si aplica)
  - ICBF: 3% (si aplica)
  - Caja Compensación: 4%

- [ ] Crear método `calculateProvisiones()`:
  ```java
  private ProvisionesResult calculateProvisiones(Employee employee, BigDecimal baseSalary,
      BigDecimal transportAllowance, int periodDays, PayrollConfiguration config)
  ```
  - Prima de servicios: `(baseSalary × días) / 360`
  - Cesantías: `((baseSalary + transportAllowance) × días) / 360`
  - Intereses cesantías: `(cesantías × 12% × días) / 360`
  - Vacaciones: `(baseSalary × días) / 720`

- [ ] Actualizar método principal `calculatePayroll()` para usar los nuevos métodos

#### Tarea 2.2: Actualizar `PayrollLiquidationService`
**Archivo:** `backend/src/main/java/com/app/starter1/services/PayrollLiquidationService.java`

**Acciones:**
- [ ] Actualizar `generateReceipt()` para llenar todos los campos nuevos
- [ ] Mejorar respuesta de `LiquidationResult`:
  ```java
  @Data
  public static class LiquidationResult {
      private Long periodId;
      private String status;
      private Integer totalEmployees;
      private Integer receiptsGenerated;
      
      // Totales detallados
      private BigDecimal totalGrossPay;
      private BigDecimal totalDeductions;
      private BigDecimal totalNetPay;
      private BigDecimal totalEmployerCosts;
      private BigDecimal totalProvisions;
      private BigDecimal totalParafiscales;
      
      private Integer noveltiesProcessed;
      private LocalDateTime liquidatedAt;
  }
  ```

#### Tarea 2.3: Crear `PayrollAccountingService`
**Archivo NUEVO:** `backend/src/main/java/com/app/starter1/services/PayrollAccountingService.java`

**Acciones:**
- [x] Crear servicio para generación de asientos contables
- [x] Método `generateProvisionEntry(PayrollPeriod period)` - Asiento al liquidar
- [x] Método `generatePaymentEntry(PayrollReceipt receipt)` - Asiento al pagar empleado
- [x] Integración con módulo de contabilidad existente

---

### FASE 3: Backend - DTOs y Controladores

#### Tarea 3.1: Actualizar `PayrollReceiptDTO`
**Archivo:** `backend/src/main/java/com/app/starter1/dto/hr/PayrollReceiptDTO.java`

**Acciones:**
- [ ] Agregar todos los campos nuevos de devengos, deducciones, costos y provisiones
- [ ] Crear DTOs anidados para mejor organización:
  ```java
  @Data
  public class PayrollReceiptDTO {
      // ... campos básicos existentes
      
      private DevengosDTO devengos;
      private DeduccionesDTO deducciones;
      private CostosEmpleadorDTO costosEmpleador;
      private ProvisionesDTO provisiones;
      
      @Data
      public static class DevengosDTO {
          private BigDecimal salario;
          private BigDecimal horasExtras;
          private BigDecimal comisiones;
          private BigDecimal auxilioTransporte;
          private BigDecimal bonos;
          private BigDecimal otros;
          private BigDecimal total;
      }
      
      @Data
      public static class DeduccionesDTO {
          private BigDecimal salud;
          private BigDecimal pension;
          private BigDecimal otras;
          private BigDecimal total;
      }
      
      @Data
      public static class CostosEmpleadorDTO {
          private BigDecimal saludEmpleador;
          private BigDecimal pensionEmpleador;
          private BigDecimal arl;
          private BigDecimal sena;
          private BigDecimal icbf;
          private BigDecimal cajaCompensacion;
          private BigDecimal total;
      }
      
      @Data
      public static class ProvisionesDTO {
          private BigDecimal prima;
          private BigDecimal cesantias;
          private BigDecimal interesesCesantias;
          private BigDecimal vacaciones;
          private BigDecimal total;
      }
  }
  ```

#### Tarea 3.2: Actualizar `PayrollLiquidationController`
**Archivo:** `backend/src/main/java/com/app/starter1/controllers/PayrollLiquidationController.java`

**Acciones:**
- [ ] Agregar endpoint para obtener recibos de un período:
  ```java
  @GetMapping("/periods/{periodId}/receipts")
  public ResponseEntity<List<PayrollReceiptDTO>> getPeriodReceipts(
      @PathVariable Long periodId,
      @RequestParam Long customerId)
  ```

- [ ] Agregar endpoint para obtener detalle de un recibo:
  ```java
  @GetMapping("/receipts/{receiptId}")
  public ResponseEntity<PayrollReceiptDTO> getReceipt(
      @PathVariable Long receiptId,
      @RequestParam Long customerId)
  ```

- [ ] Agregar endpoint para descargar PDF:
  ```java
  @GetMapping("/receipts/{receiptId}/pdf")
  public ResponseEntity<byte[]> downloadReceiptPDF(
      @PathVariable Long receiptId,
      @RequestParam Long customerId)
  ```

- [ ] Agregar endpoint para cerrar período:
  ```java
  @PostMapping("/periods/{periodId}/close")
  public ResponseEntity<ClosePeriodResult> closePeriod(
      @PathVariable Long periodId,
      @RequestParam Long customerId)
  ```

---

### FASE 4: Frontend - Tipos TypeScript

#### Tarea 4.1: Actualizar Tipos de Nómina
**Archivo:** `frontend/src/types/hr/index.ts`

**Acciones:**
- [ ] Actualizar interfaz `PayrollReceipt`:
  ```typescript
  export interface PayrollReceipt {
      id: number
      employeeId: number
      employeeName: string
      employeeEmail?: string
      periodId: number
      periodName: string
      receiptNumber: string
      calculationDate: string
  
      // Días trabajados
      regularDays: number
      absenceDays: number
      overtimeHours: number
  
      // Salarios
      baseSalary: number
      dailySalary: number
  
      // Devengos detallados
      devengos: {
          salario: number
          horasExtras: number
          comisiones: number
          auxilioTransporte: number
          bonos: number
          otros: number
          total: number
      }
  
      // Deducciones detalladas
      deducciones: {
          salud: number
          pension: number
          otras: number
          total: number
      }
  
      // Costos del empleador (solo para admin/contabilidad)
      costosEmpleador?: {
          saludEmpleador: number
          pensionEmpleador: number
          arl: number
          sena: number
          icbf: number
          cajaCompensacion: number
          total: number
      }
  
      // Provisiones (solo para admin/contabilidad)
      provisiones?: {
          prima: number
          cesantias: number
          interesesCesantias: number
          vacaciones: number
          total: number
      }
  
      // Totales
      totalPerceptions: number
      totalDeductions: number
      netPay: number
  
      // Estado y metadatos
      status: 'PENDING' | 'PAID' | 'CANCELLED'
      paidAt?: string
      paymentReference?: string
      paymentMethod?: string
      pdfUrl?: string
      emailSent?: boolean
  }
  ```

- [ ] Agregar tipo para resultado de liquidación:
  ```typescript
  export interface LiquidationResult {
      periodId: number
      status: string
      totalEmployees: number
      receiptsGenerated: number
      totalGrossPay: number
      totalDeductions: number
      totalNetPay: number
      totalEmployerCosts: number
      totalProvisions: number
      noveltiesProcessed: number
      liquidatedAt: string
  }
  ```

- [ ] Agregar tipo para solicitud de pago:
  ```typescript
  export interface PaymentRequest {
      paymentReference: string
      paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHECK'
      notes?: string
  }
  ```

---

### FASE 5: Frontend - Servicios API

#### Tarea 5.1: Actualizar Servicio de Liquidación
**Archivo:** `frontend/src/services/hr/payrollLiquidationService.ts`

**Acciones:**
- [x] Crear o actualizar servicio completo:
  ```typescript
  import apiClient from '@/utils/apiClient'
  import { PayrollReceipt, LiquidationResult, PaymentRequest } from '@/types/hr'
  
  export const payrollLiquidationService = {
      // Liquidar período completo
      async liquidatePeriod(periodId: number): Promise<LiquidationResult> {
          const response = await apiClient.post(`/hr/payroll/periods/${periodId}/liquidate`)
          return response.data
      },
  
      // Obtener recibos de un período
      async getPeriodReceipts(periodId: number): Promise<PayrollReceipt[]> {
          const response = await apiClient.get(`/hr/payroll/periods/${periodId}/receipts`)
          return response.data
      },
  
      // Obtener detalle de un recibo
      async getReceipt(receiptId: number): Promise<PayrollReceipt> {
          const response = await apiClient.get(`/hr/payroll/receipts/${receiptId}`)
          return response.data
      },
  
      // Pagar recibo individual
      async payReceipt(receiptId: number, request: PaymentRequest): Promise<any> {
          const response = await apiClient.post(`/hr/payroll/receipts/${receiptId}/pay`, request)
          return response.data
      },
  
      // Descargar PDF de recibo
      async downloadReceiptPDF(receiptId: number): Promise<Blob> {
          const response = await apiClient.get(`/hr/payroll/receipts/${receiptId}/pdf`, {
              responseType: 'blob'
          })
          return response.data
      },
  
      // Cerrar período
      async closePeriod(periodId: number): Promise<any> {
          const response = await apiClient.post(`/hr/payroll/periods/${periodId}/close`)
          return response.data
      }
  }
  ```

---

### FASE 6: Frontend - Componentes y Vistas

#### Tarea 6.1: Actualizar Vista de Períodos
**Archivo:** `frontend/src/app/(dashboard)/hr/periods/page.tsx`

**Acciones:**
- [ ] Agregar botón "Liquidar" para períodos en estado OPEN
- [ ] Mostrar información detallada de liquidación en períodos LIQUIDATED
- [ ] Agregar progreso de pago (empleados pagados / total)
- [ ] Agregar botón "Ver Recibos" que redireccione a vista de detalles

#### Tarea 6.2: Crear Vista de Detalle de Período Liquidado
**Archivo NUEVO:** `frontend/src/app/(dashboard)/hr/period/view/page.tsx` (Implementado aquí)

**Acciones:**
- [x] Crear página de detalle del período
- [x] Mostrar resumen financiero:
  - Total bruto
  - Total deducciones
  - Total neto
  - Costos del empleador
  - Provisiones
- [x] Tabla de empleados con:
  - Nombre
  - Neto a pagar
  - Estado (PENDING/PAID)
  - Botón "Pagar" (para PENDING)
  - Botón "Ver Recibo" (para todos)
  - Indicador de email enviado
- [x] Filtros por estado de pago
- [ ] Búsqueda por nombre de empleado
- [ ] Botón "Cerrar Período" (cuando todos estén pagados)

#### Tarea 6.3: Crear Componente de Detalle de Recibo
**Archivo NUEVO:** `frontend/src/components/hr/ReceiptDetailView.tsx`

**Acciones:**
- [x] Crear componente reutilizable para mostrar recibo
- [x] Secciones:
  1. **Encabezado**: Información del empleado y período
  2. **Devengos** (tabla):
     - Salario base
     - Horas extras
     - Comisiones
     - Auxilio de transporte
     - Bonos
     - **Subtotal devengos**
  3. **Deducciones** (tabla):
     - Salud (4%)
     - Pensión (4%)
     - Otras deducciones
     - **Subtotal deducciones**
  4. **Neto a Pagar** (destacado)
  5. **Información adicional** (accordion/colapsable):
     - Costos del empleador
     - Provisiones calculadas
  6. **Acciones**:
     - Descargar PDF
     - Enviar por email (si no se ha enviado)
     - Registrar pago (si está PENDING)

#### Tarea 6.4: Crear Diálogo de Pago Individual
**Archivo NUEVO:** `frontend/src/components/hr/PaymentDialog.tsx` (Implementado Inline en PeriodView)

**Acciones:**
- [x] Crear diálogo modal para registrar pago
- [x] Campos:
  - Monto (readonly, mostrar neto a pagar)
  - Referencia de pago (input text, requerido)
  - Método de pago (select: Transferencia/Efectivo/Cheque)
  - Notas (textarea, opcional)
- [x] Validaciones
- [x] Al confirmar:
  - Llamar API de pago
  - Generar PDF
  - Enviar email al empleado
  - Actualizar estado en la lista
- [ ] Mostrar feedback de éxito/error

#### Tarea 6.5: Crear Componente de Desprendible de Pago (PDF Preview)
**Archivo NUEVO:** `frontend/src/components/hr/PayrollReceiptPDF.tsx`

**Acciones:**
- [ ] Componente que simula el PDF para preview
- [ ] Diseño profesional tipo desprendible de nómina
- [ ] Logo de la empresa
- [ ] Información de la empresa
- [ ] Información del empleado
- [ ] Desglose completo de devengos y deducciones
- [ ] Totales destacados
- [ ] Firma digital / sello
- [ ] Puede usarse para generar el PDF real en el backend

---

### FASE 7: Backend - Generación de PDFs

#### Tarea 7.1: Actualizar Servicio de PDFs
**Archivo:** `backend/src/main/java/com/app/starter1/services/PayrollReceiptPdfService.java`

**Acciones:**
- [x] Implementar generación de PDF con iText o similar
- [x] Template del desprendible de nómina:
  - Header con logo y datos de la empresa
  - Información del empleado
  - Tabla de devengos
  - Tabla de deducciones
  - Total neto a pagar destacado
  - Footer con firma/sello digital
- [x] Guardar PDF en sistema de archivos o storage
- [x] Retornar URL del PDF generado

---

### FASE 8: Integración y Pruebas

#### Tarea 8.1: Pruebas Backend
**Acciones:**
- [ ] Tests unitarios de servicios de cálculo
- [ ] Tests de integración de endpoints
- [ ] Validar cálculos con ejemplos reales
- [ ] Verificar generación de asientos contables

#### Tarea 8.2: Pruebas Frontend
**Acciones:**
- [ ] Probar flujo completo: crear período → liquidar → pagar → cerrar
- [ ] Validar cálculos en UI
- [ ] Probar descarga de PDFs
- [ ] Probar envío de emails
- [ ] Responsive design en móviles/tablets

#### Tarea 8.3: Pruebas de Integración E2E
**Acciones:**
- [ ] Flujo completo de liquidación mensual
- [ ] Flujo de liquidación quincenal
- [ ] Casos con novedades (horas extras, bonos, descuentos)
- [ ] Casos con diferentes niveles de ARL
- [ ] Validar accuracy de cálculos vs. normativa colombiana

---

### FASE 9: Documentación y Capacitación

#### Tarea 9.1: Documentación Técnica
**Acciones:**
- [ ] Documentar API endpoints (Swagger/OpenAPI)
- [ ] Documentar modelo de datos actualizado
- [ ] Guía de configuración de parámetros de nómina
- [ ] Ejemplos de uso de la API

#### Tarea 9.2: Documentación de Usuario
**Acciones:**
- [ ] Manual de usuario del módulo de nómina
- [ ] Guía paso a paso para liquidar nómina
- [ ] FAQ de cálculos de nómina colombiana
- [ ] Videos tutoriales (opcional)

---

## 📈 Priorización de Tareas

### 🔴 ALTA PRIORIDAD (Sprint 1 - Semana 1-2):
1. [x] Tarea 1.1: Actualizar entidad PayrollReceipt
2. [x] Tarea 1.3: Migración de BD
3. [x] Tarea 2.1: Actualizar PayrollCalculationService (cálculos core)
4. [x] Tarea 3.1: Actualizar PayrollReceiptDTO
5. [x] Tarea 4.1: Actualizar tipos TypeScript

### 🟡 MEDIA PRIORIDAD (Sprint 2 - Semana 3-4):
6. [x] Tarea 2.2: Actualizar PayrollLiquidationService
7. [x] Tarea 3.2: Actualizar controladores
8. [x] Tarea 5.1: Actualizar servicios frontend
9. [x] Tarea 6.2: Vista de detalle de período
10. [x] Tarea 6.3: Componente de detalle de recibo

### 🟢 BAJA PRIORIDAD (Sprint 3 - Semana 5-6):
11. [x] Tarea 2.3: PayrollAccountingService
12. [x] Tarea 6.4: Diálogo de pago (Inline)
13. [ ] Tarea 6.5: Componente PDF Preview
14. [x] Tarea 7.1: Generación de PDFs
15. [ ] Tarea 8.x: Pruebas completas
16. [ ] Tarea 9.x: Documentación

---

## 🎨 Mejores Prácticas de UX/UI a Aplicar

### 1. **Feedback Visual Inmediato**
- Loaders durante cálculos de liquidación
- Toasts/Snackbars para confirmación de acciones
- Skeleton loaders mientras cargan datos

### 2. **Validaciones Claras**
- Mensajes de error específicos y constructivos
- Validación en tiempo real en formularios
- Tooltips explicativos en campos complejos

### 3. **Diseño Consistente**
- Seguir paleta de colores del tema actual
- Usar componentes MUI del proyecto
- Iconografía coherente (Material Icons)

### 4. **Accesibilidad**
- Etiquetas ARIA apropiadas
- Navegación por teclado
- Contraste de colores adecuado

### 5. **Responsive Design**
- Tablas responsive con scroll horizontal en móviles
- Bottom sheets en móvil vs. modales en desktop
- Botones accesibles con touch targets de 44px mínimo

### 6. **Información Contextual**
- Breadcrumbs para navegación
- Status badges claros (colores semánticos)
- Timestamps relativos ("Hace 2 horas")

### 7. **Performance**
- Paginación en listas grandes
- Lazy loading de recibos
- Debouncing en búsquedas
- Optimistic UI updates

### 8. **Seguridad y Permisos**
- Mostrar/ocultar campos según rol del usuario
- Confirmaciones para acciones críticas (cerrar período)
- Audit trail de cambios importantes

---

## ✅ Checklist Final

Antes de dar por completada la implementación:

- [ ] ✅ Todos los cálculos validados contra normativa colombiana 2025
- [ ] ✅ PDFs generados con formato profesional
- [ ] ✅ Emails de notificación funcionando
- [ ] ✅ Asientos contables correctos
- [ ] ✅ Todas las vistas responsive
- [ ] ✅ Manejo de errores robusto
- [ ] ✅ Tests pasando (>80% cobertura)
- [ ] ✅ Documentación completa
- [ ] ✅ Performance optimizada (lista de 100+ recibos carga en <2s)
- [ ] ✅ Accesibilidad validada
- [ ] ✅ Code review completado
- [ ] ✅ Deploy a staging y pruebas con cliente

---

## 🚀 Orden de Implementación Recomendado

Siguiendo el principio de **entregar valor incremental**, el orden sugerido es:

1. **Día 1-2**: Tareas 1.1, 1.3 (Backend: Modelo de datos)
2. **Día 3-4**: Tarea 2.1 (Backend: Lógica de cálculo)
3. **Día 5**: Tareas 3.1, 4.1 (DTOs y Tipos)
4. **Día 6-7**: Tareas 2.2, 3.2 (Backend: Servicios y controladores)
5. **Día 8-9**: Tareas 5.1, 6.1 (Frontend: Servicios y actualizar períodos)
6. **Día 10-12**: Tareas 6.2, 6.3 (Frontend: Vistas principales)
7. **Día 13-14**: Tareas 6.4, 7.1 (Pago y PDFs)
8. **Día 15-16**: Tarea 2.3 (Contabilidad)
9. **Día 17-18**: Tarea 8 (Pruebas)
10. **Día 19-20**: Tarea 9 y ajustes finales

**Estimación total:** 4 semanas (20 días hábiles) para implementación completa.

---

**Fecha de creación:** 2025-12-19  
**Última actualización:** 2025-12-19  
**Versión:** 1.0
