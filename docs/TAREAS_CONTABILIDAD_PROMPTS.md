# 📋 TAREAS MÓDULO CONTABILIDAD - PROMPTS DE DESARROLLO

## 🎯 OBJETIVO
Implementar módulo de contabilidad completo cumpliendo requisitos de Siigo para Ecuador/Colombia.

---

## 📊 ESTADO ACTUAL DEL PROYECTO

**Última actualización:** 2025-12-11 20:51  
**Tareas completadas:** 2/29  
**Progreso general:** █░░░░░░░░░ 6.9%

###  **Última tarea completada:**
✅ **TAREA 1.2: Servicio Libro Mayor** (Completada)

### **Próxima tarea a realizar:**
➡️ **TAREA 1.3: Controller Libros Contables**

---

## 📈 PROGRESO POR FASE

```
FASE 1: Backend - Libros Contables     [██░░] 2/4 tareas (50%)
FASE 2: Backend - Estados Financieros  [░░░░] 0/4 tareas (0%)
FASE 3: Frontend - Comprobantes        [░░░░] 0/4 tareas (0%)
FASE 4: Frontend - Reportes            [░░░░] 0/4 tareas (0%)
FASE 5: Integraciones                  [░░░░] 0/4 tareas (0%)
FASE 6: Menú y Rutas                   [░░░░] 0/2 tareas (0%)
───────────────────────────────────────────────────────────
TOTAL:                                 [█░░░░░░░░░] 2/29 tareas (6.9%)
```

---

## 🔄 INSTRUCCIONES DE USO

1. **Iniciar tarea:** Marca la fecha de inicio
2. **Completar tarea:** Cambia `[ ]` a `[x]` y marca fecha de fin
3. **Actualizar progreso:** Recalcula porcentajes automáticamente
4. **Siguiente tarea:** Busca la primera tarea sin marcar `[ ]`

---

# FASE 1: BACKEND - LIBROS CONTABLES (2 semanas)

## [x] TAREA 1.1: Servicio Libro Diario

**Estado:** ✅ Completada  
**Prioridad:** 🔴 Alta  
**Estimado:** 3 días  
**Inicio:** 11/12/2025  
**Fin:** 11/12/2025

**Archivo:** `backend/src/main/java/com/app/starter1/services/LibroDiarioService.java`

**Prompt:**
```
Crear LibroDiarioService que genere el Libro Diario contable.

Requisitos:
1. Obtener todos los comprobantes en un rango de fechas
2. Ordenar cronológicamente por fecha y número
3. Incluir para cada movimiento:
   - Fecha
   - Tipo y número de comprobante
   - Cuenta contable (código y nombre)
   - Tercero (si aplica)
   - Descripción
   - Débito
   - Crédito
4. Calcular totales por día y totales generales
5. Permitir filtrar por:
   - Rango de fechas
   - Tipo de comprobante
   - Estado (POSTED, VOID)

Retornar LibroDiarioDTO con:
- List<LibroDiarioRow>
- totalDebit
- totalCredit
- fromDate
- toDate
```

**Criterios de aceptación:**
- [x] Service creado con método getLibroDiario()
- [x] DTO LibroDiarioDTO definido
- [x] Ordenamiento cronológico funciona
- [x] Cálculo de totales correcto
- [x] Filtros implementados

**Archivos creados:**
- ✅ `LibroDiarioService.java` - Servicio principal
- ✅ `LibroDiarioDTO.java` - DTO del reporte
- ✅ `LibroDiarioRow.java` - DTO de cada fila
- ✅ `AccountingVoucherRepository.java` - Repository con queries

---

## [x] TAREA 1.2: Servicio Libro Mayor

**Estado:** ✅ Completada  
**Prioridad:** 🔴 Alta  
**Estimado:** 3 días  
**Inicio:** 11/12/2025  
**Fin:** 11/12/2025  
**Depende de:** TAREA 1.1 ✅

**Archivo:** `backend/src/main/java/com/app/starter1/services/LibroMayorService.java`

**Prompt:**
```
Crear LibroMayorService que genere el Libro Mayor por cuenta.

Requisitos:
1. Recibir código de cuenta y rango de fechas
2. Obtener saldo inicial de la cuenta
3. Listar movimientos de la cuenta ordenados por fecha
4. Calcular saldo acumulado en cada línea
5. Incluir:
   - Fecha
   - Comprobante (tipo y número)
   - Descripción
   - Tercero
   - Débito
   - Crédito
   - Saldo (acumulado según naturaleza)
6. Retornar LibroMayorDTO con:
   - ChartOfAccount account
   - BigDecimal initialBalance
   - List<LibroMayorRow> entries
   - BigDecimal finalBalance
```

**Criterios de aceptación:**
- [x] Service creado con método getLibroMayor()
- [x] Saldo inicial correcto según naturaleza
- [x] Saldo acumulado calculado correctamente
- [x] DTO LibroMayorDTO definido

**Archivos creados:**
- ✅ `LibroMayorService.java` - Servicio principal
- ✅ `LibroMayorDTO.java` - DTO del reporte
- ✅ `LibroMayorRow.java` - DTO de cada fila
- ✅ `AccountingEntryRepository.java` - Repository con queries
- ✅ `ChartOfAccountRepository.java` - Repository de cuentas

---

## [ ] TAREA 1.3: Controller Libros Contables

**Estado:** ⏳ Pendiente  
**Prioridad:** 🔴 Alta  
**Estimado:** 2 días  
**Inicio:** --/--/----  
**Fin:** --/--/----  
**Depende de:** TAREA 1.1, TAREA 1.2

**Archivo:** `backend/src/main/java/com/app/starter1/controllers/AccountingReportController.java`

**Prompt:**
```
Crear AccountingReportController para exponer reportes contables.

Endpoints:
1. GET /api/accounting/reports/libro-diario
   - Params: fromDate, toDate, voucherType (opcional)
   - Return: LibroDiarioDTO

2. GET /api/accounting/reports/libro-mayor
   - Params: accountCode, fromDate, toDate
   - Return: LibroMayorDTO

3. GET /api/accounting/reports/libro-mayor/batch
   - Params: accountCodes[], fromDate, toDate
   - Return: Map<String, LibroMayorDTO>

Incluir validaciones:
- Fechas válidas
- Cuenta existente
- Período fiscal válido
- Autorización por roles (ADMIN, CONTADOR)
```

**Criterios de aceptación:**
- [ ] Controller creado
- [ ] 3 endpoints funcionando
- [ ] Validaciones implementadas
- [ ] Autorización por roles
- [ ] Manejo de errores

---

## [ ] TAREA 1.4: Tests Unitarios Libros

**Estado:** ⏳ Pendiente  
**Prioridad:** 🟡 Media  
**Estimado:** 2 días  
**Inicio:** --/--/----  
**Fin:** --/--/----  
**Depende de:** TAREA 1.1, TAREA 1.2, TAREA 1.3

**Archivo:** `backend/src/test/java/com/app/starter1/services/LibroDiarioServiceTest.java`

**Prompt:**
```
Crear tests unitarios para servicios de libros contables.

Tests para LibroDiarioService:
- testGetLibroDiario_ConComprobantes_RetornaDatos()
- testGetLibroDiario_SinComprobantes_RetornaVacio()
- testGetLibroDiario_ConFiltros_FiltaCorrectamente()
- testCalculoTotales_EsCorrect()

Tests para LibroMayorService:
- testGetLibroMayor_ConMovimientos_RetornaSaldoCorrecto()
- testGetLibroMayor_CuentaDebito_SaldoAcumulaBien()
- testGetLibroMayor_CuentaCredito_SaldoAcumulaBien()

Usar @DataJpaTest y mock data.
```

**Criterios de aceptación:**
- [ ] Tests de LibroDiarioService
- [ ] Tests de LibroMayorService
- [ ] Cobertura >80%
- [ ] Todos los tests pasan

---

---

# FASE 2: BACKEND - ESTADOS FINANCIEROS (2 semanas)

## TAREA 2.1: Servicio Balance General
**Archivo:** `backend/src/main/java/com/app/starter1/services/BalanceGeneralService.java`

**Prompt:**
```
Crear BalanceGeneralService que genere el Balance General.

Requisitos:
1. Recibir fecha de corte (asOfDate)
2. Calcular saldos de todas las cuentas hasta esa fecha
3. Clasificar por:
   - ACTIVOS (Corrientes, No Corrientes)
   - PASIVOS (Corrientes, No Corrientes)
   - PATRIMONIO
4. Para cada cuenta nivel 4 incluir:
   - Código y nombre
   - Saldo débito/crédito según naturaleza
5. Calcular subtotales por grupo y totales por clase
6. Validar: Total Activo = Total Pasivo + Patrimonio

Retornar BalanceGeneralDTO con:
- LocalDate asOfDate
- BalanceSection activos (corrientes, noCorrientes)
- BalanceSection pasivos (corrientes, noCorrientes)
- BalanceSection patrimonio
- BigDecimal totalActivos
- BigDecimal totalPasivos
- BigDecimal totalPatrimonio
- boolean isBalanced
```

## TAREA 2.2: Servicio Estado de Resultados
**Archivo:** `backend/src/main/java/com/app/starter1/services/EstadoResultadosService.java`

**Prompt:**
```
Crear EstadoResultadosService (P&L).

Requisitos:
1. Recibir rango de fechas
2. Sumar movimientos de cuentas de:
   - INGRESOS (naturaleza crédito)
   - GASTOS (naturaleza débito)
   - COSTOS (naturaleza débito)
3. Estructura:
   - Ingresos operacionales
   - Ingresos no operacionales
   - Total Ingresos
   - Costo de ventas
   - Utilidad Bruta
   - Gastos operacionales
   - Gastos no operacionales
   - Total Gastos
   - Utilidad/Pérdida Neta

Retornar EstadoResultadosDTO con todos los subtotales.
```

## TAREA 2.3: Servicio Flujo de Efectivo
**Archivo:** `backend/src/main/java/com/app/starter1/services/FlujoEfectivoService.java`

**Prompt:**
```
Crear FlujoEfectivoService.

Requisitos:
1. Obtener movimientos de cuentas de efectivo (1105, 1110, 1120)
2. Clasificar por:
   - Actividades operativas
   - Actividades de inversión
   - Actividades de financiación
3. Calcular:
   - Saldo inicial
   - Entradas
   - Salidas
   - Saldo final

Retornar FlujoEfectivoDTO.
```

## TAREA 2.4: Controller Estados Financieros
**Archivo:** `backend/src/main/java/com/app/starter1/controllers/AccountingReportController.java`

**Prompt:**
```
Agregar endpoints a AccountingReportController:

1. GET /api/accounting/reports/balance-general
   - Params: asOfDate, tenantId
   - Return: BalanceGeneralDTO

2. GET /api/accounting/reports/estado-resultados
   - Params: fromDate, toDate, tenantId
   - Return: EstadoResultadosDTO

3. GET /api/accounting/reports/flujo-efectivo
   - Params: fromDate, toDate, tenantId
   - Return: FlujoEfectivoDTO

4. GET /api/accounting/reports/export/{reportType}
   - Params: reportType (BALANCE, RESULTADOS, FLUJO)
   - Return: Excel o PDF (según Accept header)
```

---

# FASE 3: FRONTEND - COMPROBANTES (2 semanas)

## TAREA 3.1: Tipos TypeScript Comprobantes
**Archivo:** `frontend/src/types/apps/contabilidadTypes.ts`

**Prompt:**
```
Actualizar contabilidadTypes.ts con tipos para comprobantes.

Agregar:
- VoucherType enum
- VoucherStatus enum
- AccountingVoucher interface
- AccountingEntry interface
- CreateVoucherRequest interface
- UpdateVoucherRequest interface

Incluir comentarios JSDoc y ejemplos.
```

## TAREA 3.2: Servicio API Comprobantes
**Archivo:** `frontend/src/views/apps/contabilidad/comprobantes/services/api.ts`

**Prompt:**
```
Crear VoucherService con métodos:
- getAll(filters): Promise<AccountingVoucher[]>
- getById(id): Promise<AccountingVoucher>
- create(data: CreateVoucherRequest): Promise<AccountingVoucher>
- update(id, data): Promise<AccountingVoucher>
- post(id): Promise<AccountingVoucher> // Contabilizar
- void(id): Promise<AccountingVoucher> // Anular
- delete(id): Promise<void>
- getNextNumber(type): Promise<string>

Incluir manejo de errores con toast.
```

## TAREA 3.3: Componente Formulario Comprobante
**Archivo:** `frontend/src/views/apps/contabilidad/comprobantes/components/ComprobanteForm.tsx`

**Prompt:**
```
Crear ComprobanteForm component.

Features:
1. Seleccionar tipo de comprobante
2. Fecha y descripción
3. Tabla de movimientos editable:
   - Columnas: Cuenta, Tercero, Centro Costo, Descripción, Débito, Crédito
   - Agregar/eliminar líneas
   - Autocomplete para cuentas
   - Autocomplete para terceros
4. Totales en tiempo real
5. Validar balance (débito = crédito)
6. Botones:
   - Guardar Borrador
   - Guardar y Contabilizar
   - Cancelar
7. Mostrar diferencia si no está balanceado
8. Deshabilitar edición si está contabilizado

Usar react-hook-form y zod para validaciones.
```

## TAREA 3.4: Página Lista Comprobantes
**Archivo:** `frontend/src/views/apps/contabilidad/comprobantes/index.tsx`

**Prompt:**
```
Crear vista principal de comprobantes.

Features:
1. Tabla con:
   - Tipo
   - Número
   - Fecha
   - Descripción
   - Total Débito
   - Total Crédito
   - Estado (badge con colores)
   - Acciones (Ver, Editar, Contabilizar, Anular, Eliminar)
2. Filtros:
   - Rango fechas
   - Tipo comprobante
   - Estado
   - Buscar por número/descripción
3. Paginación
4. Botón "Nuevo Comprobante"
5. Modal para crear/editar
6. Confirmación antes de anular/eliminar

Usar @tanstack/react-table.
```

---

# FASE 4: FRONTEND - REPORTES (2 semanas)

## TAREA 4.1: Vista Libro Diario
**Archivo:** `frontend/src/app/(dashboard)/contabilidad/libro-diario/page.tsx`

**Prompt:**
```
Crear página Libro Diario.

Features:
1. Filtros:
   - Rango fechas (desde/hasta)
   - Tipo comprobante
2. Tabla con:
   - Fecha
   - Comprobante (tipo + número)
   - Cuenta (código + nombre)
   - Tercero
   - Descripción
   - Débito
   - Crédito
3. Agrupación por fecha
4. Subtotales por día
5. Totales generales
6. Botones:
   - Exportar Excel
   - Exportar PDF
   - Imprimir
7. Loading state
8. Formatear montos con separadores

Usar recharts para resumen visual (opcional).
```

## TAREA 4.2: Vista Libro Mayor
**Archivo:** `frontend/src/app/(dashboard)/contabilidad/libro-mayor/page.tsx`

**Prompt:**
```
Crear página Libro Mayor.

Features:
1. Selector de cuenta (autocomplete)
2. Rango de fechas
3. Mostrar:
   - Nombre de cuenta
   - Saldo inicial
   - Tabla de movimientos:
     * Fecha
     * Comprobante
     * Descripción
     * Tercero
     * Débito
     * Crédito
     * Saldo (acumulado)
   - Saldo final
4. Resaltar saldo con color según naturaleza
5. Exportar Excel/PDF
6. Cambiar cuenta sin recargar página

Incluir gráfico de evolución del saldo.
```

## TAREA 4.3: Vista Balance General
**Archivo:** `frontend/src/app/(dashboard)/contabilidad/balance-general/page.tsx`

**Prompt:**
```
Crear página Balance General.

Features:
1. Selector de fecha de corte
2. Estructura en 3 columnas:
   - ACTIVOS
     * Corrientes
     * No Corrientes
     * Total Activos
   - PASIVOS
     * Corrientes
     * No Corrientes
     * Total Pasivos
   - PATRIMONIO
     * Capital
     * Utilidades
     * Total Patrimonio
3. Árbol expandible por niveles
4. Resaltar totales
5. Validar ecuación contable
6. Exportar Excel/PDF

Usar estructura acordeón para jerarquía.
```

## TAREA 4.4: Vista Estado de Resultados
**Archivo:** `frontend/src/app/(dashboard)/contabilidad/estado-resultados/page.tsx`

**Prompt:**
```
Crear página Estado de Resultados (P&L).

Features:
1. Rango de fechas
2. Estructura:
   - INGRESOS
     * Operacionales
     * No operacionales
     * Total Ingresos
   - COSTOS
     * Costo de ventas
   - UTILIDAD BRUTA
   - GASTOS
     * Operacionales
     * No operacionales
     * Total Gastos
   - UTILIDAD/PÉRDIDA NETA
3. Resaltar resultado final (verde/rojo)
4. Gráfico de barras Ingresos vs Gastos
5. % de margen
6. Exportar Excel/PDF
```

---

# FASE 5: INTEGRACIONES (2 semanas)

## TAREA 5.1: Auto-Contabilizar Ventas
**Archivo:** `backend/src/main/java/com/app/starter1/services/VentaContableService.java`

**Prompt:**
```
Crear VentaContableService para contabilizar automáticamente facturas.

Al crear/aprobar factura:
1. Obtener datos de la factura
2. Por cada producto vendido:
   - Usar product.incomeAccountCode
   - Usar product.costAccountCode
   - Usar product.inventoryAccountCode
3. Crear comprobante tipo INGRESO:
   Débito: 1305 Clientes (total factura)
   Crédito: 4135 Ventas (subtotal)
   Crédito: 2408 IVA por pagar (IVA)
   
   Si producto maneja stock:
   Débito: 6135 Costo ventas (costo)
   Crédito: 1435 Inventario (costo)

4. Aplicar retenciones si contact.applyWithholdingTax
5. Guardar referencia factura en comprobante
6. Marcar factura como contabilizada

Incluir rollback si falla.
```

## TAREA 5.2: Auto-Contabilizar Compras
**Archivo:** `backend/src/main/java/com/app/starter1/services/CompraContableService.java`

**Prompt:**
```
Crear CompraContableService para contabilizar compras de inventario.

Al registrar compra:
1. Crear comprobante tipo EGRESO:
   Débito: 1435 Inventario (costo productos)
   Débito: 2408 IVA Descontable (IVA)
   Crédito: 2205 Proveedores (total)

2. Actualizar product.averageCost
3. Actualizar product.inventoryQty
4. Aplicar retenciones si aplica
5. Guardar referencia orden de compra

Permitir contabilización por lotes.
```

## TAREA 5.3: Auto-Contabilizar Pagos
**Archivo:** `backend/src/main/java/com/app/starter1/services/PagoContableService.java`

**Prompt:**
```
Crear PagoContableService.

Al registrar pago a proveedor:
Débito: 2205 Proveedores
Crédito: 1105 Caja o 1110 Bancos

Al registrar cobro a cliente:
Débito: 1105 Caja o 1110 Bancos
Crédito: 1305 Clientes

Incluir opción de pago parcial.
```

## TAREA 5.4: Listeners de Eventos
**Archivo:** `backend/src/main/java/com/app/starter1/events/ContabilidadEventListener.java`

**Prompt:**
```
Crear EventListener para contabilización automática.

Escuchar eventos:
- FacturaCreatedEvent → VentaContableService
- CompraCreatedEvent → CompraContableService
- PagoCreatedEvent → PagoContableService

Usar @EventListener y @Async.
Incluir logs detallados.
Manejar errores sin afectar operación principal.
```

---

# FASE 6: MENÚ Y RUTAS (1 semana)

## TAREA 6.1: Actualizar Menú Frontend
**Archivo:** `frontend/src/components/layout/vertical/verticalMenuData.json`

**Prompt:**
```
Actualizar menú con estructura completa de Contabilidad:

Contabilidad (calculator icon)
├── Pan de Cuentas
├── Comprobantes
│   ├── Nuevo Comprobante
│   ├── Lista Comprobantes
│   └── Comprobantes Pendientes
├── Terceros
├── Centros de Costo
├── Reportes
│   ├── Libro Diario
│   ├── Libro Mayor
│   ├── Balance de Prueba
│   ├── Balance General
│   ├── Estado de Resultados
│   └── Flujo de Efectivo
└── Configuración
    ├── Períodos Fiscales
    ├── Retenciones
    └── Parámetros Contables

Roles: SUPERADMIN, ADMIN, CONTADOR
```

## TAREA 6.2: Crear Rutas Next.js
**Archivos:** `frontend/src/app/(dashboard)/contabilidad/*/page.tsx`

**Prompt:**
```
Crear estructura de rutas:

/contabilidad/plan-cuentas
/contabilidad/comprobantes
/contabilidad/comprobantes/nuevo
/contabilidad/comprobantes/[id]
/contabilidad/terceros
/contabilidad/centros-costo
/contabilidad/reportes/libro-diario
/contabilidad/reportes/libro-mayor
/contabilidad/reportes/balance-prueba
/contabilidad/reportes/balance-general
/contabilidad/reportes/estado-resultados
/contabilidad/reportes/flujo-efectivo

Cada página debe:
- Tener metadata (title, description)
- Importar vista correspondiente
- Incluir middleware de autenticación
```

---

# CHECKLIST DE COMPLETITUD

```markdown
## Backend
- [ ] LibroDiarioService
- [ ] LibroMayorService
- [ ] BalanceGeneralService
- [ ] EstadoResultadosService
- [ ] FlujoEfectivoService
- [ ] AccountingReportController
- [ ] VentaContableService
- [ ] CompraContableService
- [ ] PagoContableService
- [ ] ContabilidadEventListener

## Frontend - Comprobantes
- [ ] Tipos TypeScript
- [ ] VoucherService API
- [ ] ComprobanteForm component
- [ ] ComprobanteLista view
- [ ] Validaciones y errores

## Frontend - Reportes
- [ ] Libro Diario view
- [ ] Libro Mayor view
- [ ] Balance General view
- [ ] Estado Resultados view
- [ ] Flujo Efectivo view
- [ ] Exportar Excel/PDF

## Integraciones
- [ ] Auto-contabilizar ventas
- [ ] Auto-contabilizar compras
- [ ] Auto-contabilizar pagos
- [ ] Event listeners

## Infraestructura
- [ ] Menú actualizado
- [ ] Rutas creadas
- [ ] Permisos configurados
- [ ] Tests unitarios
- [ ] Documentación
```

---

**Total estimado:** 10-12 semanas
**Prioridad:** Alta (cumplimiento fiscal)
**Fecha:** 2025-12-11
