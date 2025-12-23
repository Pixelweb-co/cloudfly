# Fix: PayrollPeriod Type Error - periodType String Literal

## Error #10

**Archivo:** `hr/period/form/page.tsx`  
**Línea:** 378

### Error Original
```
Type error: Argument of type '{ employeeIds: number[]; status: string; periodType: string; ... }' 
is not assignable to parameter of type 'Partial<PayrollPeriod>'.
  Types of property 'periodType' are incompatible.
    Type 'string' is not assignable to type '"WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined'.
```

## Problema

TypeScript no puede inferir que `formData.periodType` (tipo `string`) es compatible con el tipo literal union requerido: `"WEEKLY" | "BIWEEKLY" | "MONTHLY"`.

Cuando usamos spread operator (`...formData`), TypeScript mantiene el tipo original `string` en lugar de reconocerlo como uno de los valores literales específicos.

## Solución

En lugar de usar spread operator, construimos el objeto `periodData` explícitamente con el tipo correcto:

```typescript
// ❌ ANTES - TypeScript ve periodType como string genérico
const periodData = {
    ...formData,
    employeeIds: includedEmployees.map(e => e.id),
    status: 'OPEN'
}

// ✅ DESPUÉS - Tipo explícito con type assertion
const periodData: Partial<PayrollPeriod> = {
    periodType: formData.periodType as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    periodNumber: formData.periodNumber,
    year: formData.year,
    startDate: formData.startDate,
    endDate: formData.endDate,
    paymentDate: formData.paymentDate,
    description: formData.description,
    employeeIds: includedEmployees.map(e => e.id),
    status: 'OPEN'
}
```

## ¿Por qué esto funciona?

1. **Tipo Explícito:** `Partial<PayrollPeriod>` le dice a TypeScript qué tipo esperamos
2. **Type Assertion:** `as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'` confirma que el valor es uno de los literales válidos
3. **Sin Spread:** Evitamos que TypeScript mantenga tipos genéricos del objeto original

## Alternativas Consideradas

### Opción 1: Tipo el formData desde el inicio
```typescript
const [formData, setFormData] = useState<{
    periodType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    // ...
}>({ ... })
```
❌ Más verboso, afecta todo el componente

### Opción 2: Type assertion solo en periodType
```typescript
const periodData = {
    ...formData,
    periodType: formData.periodType as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
}
```
❌ No funciona, TypeScript aún ve el objeto completo como incompatible

### Opción 3: Construcción explícita (ELEGIDA) ✅
```typescript
const periodData: Partial<PayrollPeriod> = {
    periodType: formData.periodType as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    // ... resto de campos explícitos
}
```
✅ Claro, seguro, funciona

## Concepto TypeScript: String Literals vs String

```typescript
// Tipo literal union
type PeriodType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

let a: string = 'WEEKLY'          // ❌ No puede asignarse a PeriodType
let b: PeriodType = 'WEEKLY'      // ✅ OK
let c = 'WEEKLY' as PeriodType    // ✅ Type assertion
```

## Estado Final

✅ **Error de compilación resuelto**  
✅ **Tipo correcto asegurado con Partial<PayrollPeriod>**  
✅ **Type safety mantenido**
