# 🏢 Módulo de Recursos Humanos y Nómina - Plan de Implementación

**Proyecto:** CloudFly  
**Módulo:** HR & Payroll Management  
**Fecha de Inicio:** 2025-12-16  
**Status:** 🚧 En Desarrollo

---

## 📊 Progreso General

- **Fase 1:** ⬜ 0% (0/15)
- **Fase 2:** ⬜ 0% (0/12)
- **Fase 3:** ⬜ 0% (0/10)
- **Fase 4:** ⬜ 0% (0/8)
- **TOTAL:** ⬜ 0% (0/45)

---

## 🎯 FASE 1: FUNDAMENTOS (Base del Sistema)

### Backend - Entidades y Repositorios

- [ ] **1.1** Crear entidad `Employee` (Empleado)
  - [ ] Campos básicos (nombre, RFC, CURP, email, teléfono)
  - [ ] Información laboral (fecha ingreso, cargo, departamento)
  - [ ] Información salarial (salario base, periodicidad)
  - [ ] Información bancaria (CLABE, banco, cuenta)
  - [ ] Relación con Tenant
  
- [ ] **1.2** Crear entidad `PayrollConcept` (Concepto de Nómina)
  - [ ] Tipo (PERCEPCION/DEDUCCION)
  - [ ] Clave SAT
  - [ ] Nombre y descripción
  - [ ] Es gravable
  - [ ] Relación con Tenant
  
- [ ] **1.3** Crear entidad `EmployeePayrollConcept` (Conceptos por Empleado)
  - [ ] Relación Empleado-Concepto
  - [ ] Monto o porcentaje
  - [ ] Vigencia
  - [ ] Es recurrente
  
- [ ] **1.4** Crear entidad `PayrollConfiguration` (Configuración de Nómina)
  - [ ] Días de aguinaldo
  - [ ] Días de vacaciones
  - [ ] Prima vacacional
  - [ ] Configuración de impuestos
  - [ ] Relación con Tenant

- [ ] **1.5** Crear Repositorios JPA
  - [ ] `EmployeeRepository`
  - [ ] `PayrollConceptRepository`
  - [ ] `EmployeePayrollConceptRepository`
  - [ ] `PayrollConfigurationRepository`

### Backend - DTOs

- [ ] **1.6** Crear DTOs de Employee
  - [ ] `EmployeeDTO`
  - [ ] `EmployeeCreateDTO`
  - [ ] `EmployeeUpdateDTO`
  - [ ] `EmployeeListDTO`

- [ ] **1.7** Crear DTOs de PayrollConcept
  - [ ] `PayrollConceptDTO`
  - [ ] `PayrollConceptCreateDTO`

- [ ] **1.8** Crear DTOs de EmployeePayrollConcept
  - [ ] `EmployeePayrollConceptDTO`
  - [ ] `EmployeePayrollConceptCreateDTO`

### Backend - Services

- [ ] **1.9** Implementar `EmployeeService`
  - [ ] CRUD completo
  - [ ] Activar/Desactivar empleado
  - [ ] Búsqueda y filtros
  - [ ] Validaciones de negocio

- [ ] **1.10** Implementar `PayrollConceptService`
  - [ ] CRUD de conceptos
  - [ ] Catálogo de conceptos predefinidos
  - [ ] Separación por tipo

- [ ] **1.11** Implementar `PayrollConfigurationService`
  - [ ] Obtener/Actualizar configuración del tenant
  - [ ] Valores por defecto

### Backend - Controllers

- [ ] **1.12** Implementar `EmployeeController`
  - [ ] GET /api/hr/employees (lista paginada)
  - [ ] GET /api/hr/employees/{id}
  - [ ] POST /api/hr/employees
  - [ ] PUT /api/hr/employees/{id}
  - [ ] DELETE /api/hr/employees/{id}
  - [ ] PATCH /api/hr/employees/{id}/status

- [ ] **1.13** Implementar `PayrollConceptController`
  - [ ] GET /api/hr/concepts
  - [ ] POST /api/hr/concepts
  - [ ] PUT /api/hr/concepts/{id}
  - [ ] DELETE /api/hr/concepts/{id}

- [ ] **1.14** Configurar Seguridad (SecurityConfig)
  - [ ] Agregar endpoints de HR a configuración
  - [ ] Definir roles y permisos

### Frontend - Types y Services

- [ ] **1.15** Crear tipos TypeScript
  - [ ] `types/hr/employee.ts`
  - [ ] `types/hr/payrollConcept.ts`
  - [ ] `types/hr/configuration.ts`

- [ ] **1.16** Crear servicios API
  - [ ] `services/hr/employeeService.ts`
  - [ ] `services/hr/payrollConceptService.ts`
  - [ ] `services/hr/configurationService.ts`

### Frontend - Páginas Base

- [ ] **1.17** Crear estructura de carpetas
  - [ ] `/app/(dashboard)/hr/employees/`
  - [ ] `/app/(dashboard)/hr/concepts/`
  - [ ] `/app/(dashboard)/hr/settings/`

- [ ] **1.18** Implementar página de Empleados
  - [ ] Lista de empleados con tabla
  - [ ] Filtros y búsqueda
  - [ ] Botón agregar empleado
  - [ ] Acciones (editar, eliminar, activar/desactivar)

- [ ] **1.19** Implementar formulario de Empleado
  - [ ] Datos personales
  - [ ] Información laboral
  - [ ] Información salarial
  - [ ] Información bancaria
  - [ ] Validaciones del formulario

- [ ] **1.20** Implementar página de Conceptos
  - [ ] Lista de conceptos (percepciones/deducciones)
  - [ ] Formulario de creación/edición
  - [ ] Badges por tipo

- [ ] **1.21** Implementar página de Configuración
  - [ ] Formulario de configuración general
  - [ ] Guardar configuración

---

## 🎯 FASE 2: PROCESAMIENTO DE NÓMINA

### Backend - Entidades

- [ ] **2.1** Crear entidad `PayrollPeriod` (Periodo de Nómina)
  - [ ] Tipo de periodo
  - [ ] Fechas (inicio, fin, pago)
  - [ ] Estatus (ABIERTO, PROCESADO, PAGADO, CERRADO)
  - [ ] Número y año

- [ ] **2.2** Crear entidad `PayrollIncidence` (Incidencias)
  - [ ] Empleado y Periodo
  - [ ] Tipo (FALTA, INCAPACIDAD, VACACIONES, PERMISO, HORAS_EXTRA, BONO)
  - [ ] Fechas y cantidad
  - [ ] Monto
  - [ ] Documento adjunto

- [ ] **2.3** Crear entidad `PayrollReceipt` (Recibo de Nómina)
  - [ ] Empleado y Periodo
  - [ ] Totales (percepciones, deducciones, neto)
  - [ ] Días trabajados/pagados
  - [ ] Estatus (CALCULADO, APROBADO, TIMBRADO, PAGADO)

- [ ] **2.4** Crear entidad `PayrollReceiptDetail` (Detalle de Recibo)
  - [ ] Recibo y Concepto
  - [ ] Monto
  - [ ] Tipo

- [ ] **2.5** Crear Repositorios
  - [ ] `PayrollPeriodRepository`
  - [ ] `PayrollIncidenceRepository`
  - [ ] `PayrollReceiptRepository`
  - [ ] `PayrollReceiptDetailRepository`

### Backend - Services

- [ ] **2.6** Implementar `PayrollPeriodService`
  - [ ] Crear periodo
  - [ ] Listar periodos
  - [ ] Cerrar periodo
  - [ ] Cambiar estatus

- [ ] **2.7** Implementar `PayrollIncidenceService`
  - [ ] CRUD de incidencias
  - [ ] Registrar incidencia masiva
  - [ ] Listar por periodo/empleado

- [ ] **2.8** Implementar `PayrollCalculationService`
  - [ ] Calcular nómina de un empleado
  - [ ] Calcular nómina del periodo completo
  - [ ] Aplicar percepciones recurrentes
  - [ ] Aplicar deducciones recurrentes
  - [ ] Aplicar incidencias
  - [ ] Calcular días trabajados

- [ ] **2.9** Implementar `PayrollProcessingService`
  - [ ] Procesar nómina del periodo
  - [ ] Recalcular nómina
  - [ ] Aprobar nómina
  - [ ] Generar recibos

### Backend - Controllers

- [ ] **2.10** Implementar `PayrollPeriodController`
  - [ ] GET /api/hr/payroll/periods
  - [ ] POST /api/hr/payroll/periods
  - [ ] GET /api/hr/payroll/periods/{id}
  - [ ] PATCH /api/hr/payroll/periods/{id}/status

- [ ] **2.11** Implementar `PayrollIncidenceController`
  - [ ] GET /api/hr/payroll/incidences
  - [ ] POST /api/hr/payroll/incidences
  - [ ] PUT /api/hr/payroll/incidences/{id}
  - [ ] DELETE /api/hr/payroll/incidences/{id}

- [ ] **2.12** Implementar `PayrollProcessingController`
  - [ ] POST /api/hr/payroll/periods/{id}/calculate
  - [ ] POST /api/hr/payroll/periods/{id}/recalculate
  - [ ] POST /api/hr/payroll/periods/{id}/approve
  - [ ] GET /api/hr/payroll/periods/{id}/receipts

### Frontend - Páginas

- [ ] **2.13** Implementar página de Periodos
  - [ ] Lista de periodos
  - [ ] Crear nuevo periodo
  - [ ] Ver detalle de periodo
  - [ ] Cambiar estatus

- [ ] **2.14** Implementar página de Incidencias
  - [ ] Registrar incidencia
  - [ ] Lista de incidencias del periodo
  - [ ] Editar/eliminar incidencia
  - [ ] Calendario de incidencias

- [ ] **2.15** Implementar página de Procesamiento
  - [ ] Vista de cálculo de nómina
  - [ ] Pre-visualización de montos
  - [ ] Botón calcular/recalcular
  - [ ] Botón aprobar
  - [ ] Ajustes manuales

- [ ] **2.16** Implementar página de Recibos
  - [ ] Lista de recibos del periodo
  - [ ] Vista de recibo individual
  - [ ] Generación de PDF (básico)

---

## 🎯 FASE 3: FUNCIONALIDADES AVANZADAS

### Backend - Cálculos Fiscales

- [ ] **3.1** Implementar cálculo de ISR
  - [ ] Tabla de ISR progresivo
  - [ ] Cálculo según periodo
  - [ ] Subsidio al empleo

- [ ] **3.2** Implementar cálculo de IMSS
  - [ ] Cuota obrera
  - [ ] Cuota patronal
  - [ ] Topes y límites

- [ ] **3.3** Implementar `TaxCalculationService`
  - [ ] Integrar ISR en cálculo de nómina
  - [ ] Integrar IMSS en cálculo de nómina

### Backend - Timbrado CFDI (Opcional para México)

- [ ] **3.4** Crear entidad `PayrollCFDI`
  - [ ] UUID
  - [ ] XML path
  - [ ] PDF path
  - [ ] Fecha de timbrado
  - [ ] Relación con Receipt

- [ ] **3.5** Implementar `PayrollTimbradoService`
  - [ ] Generar XML de nómina (formato SAT)
  - [ ] Integración con PAC (mock inicialmente)
  - [ ] Guardar UUID
  - [ ] Generar PDF del recibo timbrado

- [ ] **3.6** Implementar endpoints de timbrado
  - [ ] POST /api/hr/payroll/receipts/{id}/stamp
  - [ ] POST /api/hr/payroll/periods/{id}/stamp-all
  - [ ] GET /api/hr/payroll/receipts/{id}/cfdi

### Backend - Dispersión Bancaria

- [ ] **3.7** Crear entidad `PayrollPayment`
  - [ ] Recibo
  - [ ] Método de pago
  - [ ] Fecha
  - [ ] Referencia bancaria

- [ ] **3.8** Implementar `PayrollDispersionService`
  - [ ] Generar layout bancario (formato CLABE)
  - [ ] Registrar pagos
  - [ ] Conciliación

- [ ] **3.9** Implementar endpoints de dispersión
  - [ ] POST /api/hr/payroll/periods/{id}/generate-layout
  - [ ] POST /api/hr/payroll/periods/{id}/register-payments

### Integración con Contabilidad

- [ ] **3.10** Implementar integración contable
  - [ ] Generar póliza de nómina automática
  - [ ] Registrar en módulo de contabilidad
  - [ ] Mapeo de conceptos a cuentas contables

### Frontend - Avanzado

- [ ] **3.11** Implementar descarga de recibos PDF
  - [ ] Botón de descarga individual
  - [ ] Descarga masiva

- [ ] **3.12** Implementar página de Dispersión
  - [ ] Generar layout bancario
  - [ ] Descargar archivo
  - [ ] Registrar pagos realizados

- [ ] **3.13** Implementar timbrado en frontend
  - [ ] Botón timbrar individual
  - [ ] Timbrado masivo
  - [ ] Visualizar CFDI

---

## 🎯 FASE 4: OPTIMIZACIÓN Y REPORTES

### Backend - Reportes

- [ ] **4.1** Implementar `PayrollReportService`
  - [ ] Resumen de nómina por periodo
  - [ ] Reporte de incidencias
  - [ ] Provisiones contables
  - [ ] Reporte de impuestos
  - [ ] Comparativo entre periodos
  - [ ] Análisis por departamento/empleado

- [ ] **4.2** Implementar endpoints de reportes
  - [ ] GET /api/hr/reports/payroll-summary
  - [ ] GET /api/hr/reports/incidences
  - [ ] GET /api/hr/reports/taxes
  - [ ] GET /api/hr/reports/comparative

### Backend - Notificaciones

- [ ] **4.3** Implementar notificaciones de nómina
  - [ ] Envío de recibos por email
  - [ ] Notificación de periodo procesado
  - [ ] Alertas de incidencias

### Frontend - Dashboard y Analytics

- [ ] **4.4** Implementar Dashboard de HR
  - [ ] Total de empleados activos
  - [ ] Último periodo procesado
  - [ ] Costo total de nómina
  - [ ] Gráficas de tendencias
  - [ ] Próximos pagos

- [ ] **4.5** Implementar página de Reportes
  - [ ] Selector de tipo de reporte
  - [ ] Filtros personalizados
  - [ ] Exportación a Excel/PDF
  - [ ] Visualizaciones gráficas

### Frontend - Mejoras UX

- [ ] **4.6** Implementar búsqueda avanzada
  - [ ] Filtros múltiples en empleados
  - [ ] Búsqueda por periodo
  - [ ] Filtros por estatus

- [ ] **4.7** Implementar validaciones mejoradas
  - [ ] Validación de RFC/CURP
  - [ ] Validación de CLABE bancaria
  - [ ] Advertencias de datos incompletos

- [ ] **4.8** Implementar ayudas contextuales
  - [ ] Tooltips en formularios
  - [ ] Guías de uso
  - [ ] Mensajes de error descriptivos

---

## 📈 Métricas de Éxito

- [ ] Todos los endpoints responden correctamente
- [ ] Frontend muestra datos sin errores
- [ ] CRUD completo funciona en todas las entidades
- [ ] Cálculo de nómina es correcto
- [ ] Recibos se generan correctamente
- [ ] Reportes muestran datos precisos
- [ ] UI es intuitiva y responsiva
- [ ] Documentación completa

---

## 🔄 Notas de Implementación

### Orden Recomendado:
1. Backend primero (entidades → repositorios → services → controllers)
2. Luego Frontend (types → services → components → pages)
3. Pruebas después de cada módulo completado

### Consideraciones:
- Todos los modelos deben tener relación con `Tenant` para multi-tenancy
- Implementar soft-delete en entidades principales
- Usar DTOs para todas las respuestas de API
- Validar permisos en cada endpoint
- Logging completo en operaciones críticas
- Transacciones en operaciones de cálculo y procesamiento

---

## 📝 Logs de Cambios

### 2025-12-16
- ✅ Documento de planificación creado
- ⬜ Inicio de Fase 1

---

**Última actualización:** 2025-12-16  
**Progreso Total:** 0/45 tareas completadas
