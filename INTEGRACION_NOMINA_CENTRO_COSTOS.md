# Implementación: Integración Nómina - Centro de Costos

## Resumen de Cambios

Esta implementación conecta el módulo de **Nómina** con el módulo de **Centro de Costos** permitiendo:
1. Asignar empleados a centros de costo
2. Generar comprobantes contables de nómina agrupados por centro de costo
3. Generar reportes de costos de nómina por centro de costo

---

## Archivos Creados/Modificados

### Backend

#### Migraciones SQL
- **`V18__employee_cost_center.sql`** - Agrega columna `cost_center_id` a empleados y crea vista para reportes
- **`V19__sp_payroll_by_cost_center.sql`** - SP que genera comprobantes contables con centro de costo

#### Entidades y DTOs
- **`Employee.java`** - Agregado campo `costCenter` (relación ManyToOne)
- **`EmployeeDTO.java`** - Agregados campos `costCenterId`, `costCenterCode`, `costCenterName`
- **`EmployeeCreateDTO.java`** - Agregado campo `costCenterId`
- **`PayrollCostByCostCenterDTO.java`** (NUEVO) - DTO para reporte de costos

#### Servicios
- **`EmployeeService.java`** - Modificado para manejar centro de costo en crear/actualizar/convertir
- **`PayrollCostCenterReportService.java`** (NUEVO) - Genera reportes por centro de costo

#### Controladores
- **`PayrollReportController.java`** (NUEVO) - Endpoints para reportes de nómina

### Frontend

#### Tipos TypeScript
- **`types/hr/index.ts`** - Agregados interfaces `CostCenterCost`, `PayrollCostSummary`, `PayrollCostByCostCenter`, `CostCenter`

#### Servicios
- **`services/hr/payrollReportService.ts`** (NUEVO) - Servicio para API de reportes

#### Páginas
- **`app/(dashboard)/hr/reports/cost-by-center/page.tsx`** (NUEVO) - Página de reporte visual

---

## Endpoints API

### GET `/api/hr/reports/cost-by-center/{periodId}`
Obtiene el reporte de costos de nómina por centro de costo para un período específico.

**Parámetros:**
- `periodId` (path) - ID del período de nómina
- `customerId` (query) - ID del cliente/tenant

**Respuesta:**
```json
{
  "periodId": 1,
  "periodYear": 2025,
  "periodNumber": 12,
  "periodType": "MONTHLY",
  "periodName": "Diciembre 2025",
  "costCenters": [
    {
      "costCenterId": 1,
      "costCenterCode": "CC-ADM",
      "costCenterName": "Administración",
      "employeeCount": 3,
      "totalSalary": 5000000,
      "totalEmployerCost": 7200000,
      "percentageOfTotal": 45.5
    }
  ],
  "summary": {
    "totalEmployees": 10,
    "totalCostCenters": 4,
    "grandTotalEmployerCost": 15800000
  }
}
```

### GET `/api/hr/reports/cost-by-center/year/{year}`
Obtiene reportes de todos los períodos liquidados de un año.

---

## Uso

### 1. Asignar Centro de Costo a Empleado
Al crear o editar un empleado, seleccionar el centro de costo en el formulario.

### 2. Ver Reporte
Navegar a `/hr/reports/cost-by-center` y seleccionar un período liquidado.

### 3. Generar Comprobante con Centros de Costo
Usar el nuevo SP `sp_generate_payroll_voucher_by_cost_center` para generar comprobantes contables agrupados por centro de costo.

---

## Ejecución de Migraciones

```sql
-- Ejecutar las migraciones V18 y V19 en la base de datos
-- O reiniciar el backend para que Flyway las ejecute automáticamente
```

---

## Próximos Pasos

1. [ ] Agregar selector de centro de costo en el formulario de empleados (frontend)
2. [ ] Integrar el SP de centro de costo en el flujo de liquidación
3. [ ] Agregar gráficos de distribución (pie chart)
4. [ ] Exportación a Excel del reporte
5. [ ] Comparativo de períodos
