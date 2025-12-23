# Pasos para Probar el Flujo de Nómina Completo

## 1. Crear Empleado
1. Navegar a: http://localhost:3000/hr/employees/form
2. Llenar formulario:
   - **Nombres**: Carlos
   - **Apellidos**: Rodriguez
   - **Cédula**: 1234567890
   - **Email**: carlos@test.com
   - **Teléfono**: 3001234567
   - **Fecha de Ingreso**: 2025-12-01
   - **Salario Base**: 1.500.000
   - **Departamento**: Ventas
   - **Cargo**: Vendedor
   - **Frecuencia de Pago**: Quincenal
   - **Método de Pago**: Transferencia Bancaria
   - **EPS**: Sura
   - **AFP**: Porvenir
   - **ARL**: Sura
   - **Caja Cesantías**: Porvenir
   - **Caja Compensación**: Comfama
   - **Auxilio Transporte**: Activado
3. Guardar
4. Verificar que aparece en la lista de empleados

## 2. Crear Período de Nómina
1. Navegar a: http://localhost:3000/hr/periods
2. Clic en "Crear Período"
3. Llenar:
   - **Nombre**: Período Quincenal Diciembre 2025
   - **Fecha Inicio**: 2025-12-01
   - **Fecha Fin**: 2025-12-15
   - **Descripción**: Primera quincena de diciembre
4. Guardar
5. Verificar que aparece en la lista con estado "DRAFT"

## 3. Liquidar Período
1. En la lista de períodos, encontrar el período creado
2. Clic en botón "Liquidar"
3. Esperar a que se procese
4. Verificar que:
   - Estado cambie a "LIQUIDADO"
   - Se muestren los valores calculados:
     - Devengados (Salario + Aux. Transporte)
     - Deducciones (Salud 4% + Pensión 4%)
     - Aportes del Empleador (Salud 8.5%, Pensión 12%, ARL, Parafiscales)
     - Provisiones (Prima, Cesantías, Int. Cesantías, Vacaciones)
     - Neto a Pagar

## 4. Ver Detalle del Período
1. Clic en el período liquidado
2. Verificar que se muestre el resumen con valores correctos
3. Ver listado de recibos generados

## Valores Esperados para Salario 1.500.000 (Quincenal)

### Cálculos Base:
- **Salario Quincenal**: 1.500.000 / 2 = 750.000
- **Auxilio de Transporte Quincenal**: 200.000 / 2 = 100.000 (aprox)
- **Total Devengado**: 850.000

### Deducciones Empleado:
- **Salud (4%)**: 750.000 * 0.04 = 30.000
- **Pensión (4%)**: 750.000 * 0.04 = 30.000
- **Total Deducciones**: 60.000

### Neto a Pagar:
- 850.000 - 60.000 = **790.000**

### Aportes Empleador:
- **Salud (8.5%)**: 750.000 * 0.085 = 63.750
- **Pensión (12%)**: 750.000 * 0.12 = 90.000
- **ARL (0.522%)**: 750.000 * 0.00522 = 3.915
- **SENA (2%)**: 750.000 * 0.02 = 15.000
- **ICBF (3%)**: 750.000 * 0.03 = 22.500
- **Caja Compensación (4%)**: 750.000 * 0.04 = 30.000
- **Total Aportes**: 225.165

### Provisiones:
- **Prima (8.33%)**: 750.000 * 0.0833 = 62.475
- **Cesantías (8.33%)**: 750.000 * 0.0833 = 62.475
- **Int. Cesantías (1%)**: 62.475 * 0.01 = 625 (mensual)
- **Vacaciones (4.17%)**: 750.000 * 0.0417 = 31.275
- **Total Provisiones**: 156.850

### Costo Total para la Empresa:
- 750.000 (Salario) + 100.000 (Aux. Trans) + 225.165 (Aportes) + 156.850 (Provisiones) = **1.232.015**

## Notas Importantes
- Si el salario base supera 2 SMMLV (2.600.000), NO se paga auxilio de transporte
- Los porcentajes pueden variar según la configuración en PayrollConfiguration
- Las provisiones se calculan proporcionalmente a los días trabajados
