# 📝 **MÓDULO DE COMPROBANTES CONTABLES - PLAN DE IMPLEMENTACIÓN**

## 🎯 **OBJETIVO**

Crear el módulo completo de gestión de comprobantes contables (accounting vouchers) que permita:
- Crear comprobantes de INGRESO, EGRESO y NOTAS CONTABLES
- Registrar asientos contables con débitos y créditos
- Asignar centros de costo y terceros
- Validar que débitos = créditos
- Listar y consultar comprobantes
- Aprobar/Contabilizar comprobantes

## 📊 **ESTRUCTURA EN BASE DE DATOS (Ya existe)**

### Tabla: accounting_vouchers
```sql
- id
- voucher_type (INGRESO, EGRESO, NOTA_CONTABLE)
- voucher_number (Consecutivo)
- date (Fecha del comprobante)
- description
- reference (Referencia externa)
- status (DRAFT, POSTED, VOID)
- tenant_id
- total_debit
- total_credit
```

### Tabla: accounting_entries (Detalle)
```sql
- id
- voucher_id
- line_number
- account_code (Plan de cuentas)
- third_party_id (Tercero/Contact)
- cost_center_id (Centro de costo)
- description
- debit_amount
- credit_amount
- base_value
- tax_value
```

## 🔧 **COMPONENTES A CREAR**

### Backend (Java)

#### 1. ✅ Entidades (Ya existen)
- `AccountingVoucher.java`
- `AccountingEntry.java`

#### 2. ⚠️ Repositorios (CREAR)
- `AccountingVoucherRepository.java`
- `AccountingEntryRepository.java`

#### 3. ⚠️ DTOs (CREAR)
- `VoucherRequestDTO.java` - Para crear/actualizar
- `VoucherResponseDTO.java` - Para respuestas
- `EntryDTO.java` - Para líneas del comprobante

#### 4. ⚠️ Servicio (CREAR)
- `AccountingVoucherService.java`
  - createVoucher()
  - updateVoucher()
  - postVoucher() - Aprobar/Contabilizar
  - voidVoucher() - Anular
  - getVouchers() - Listar
  - getNextVoucherNumber() - Consecutivo

#### 5. ⚠️ Controlador (CREAR)
- `AccountingVoucherController.java`
  - POST /accounting/vouchers
  - GET /accounting/vouchers
  - GET /accounting/vouchers/{id}
  - PUT /accounting/vouchers/{id}
  - POST /accounting/vouchers/{id}/post
  - POST /accounting/vouchers/{id}/void
  - DELETE /accounting/vouchers/{id}

#### 6. ⚠️ Seguridad (AGREGAR)
- Actualizar `SecurityConfig.java`
- Permisos para /accounting/vouchers/**

### Frontend (TypeScript/React)

#### 1. ⚠️ Página (CREAR)
- `app/(dashboard)/contabilidad/comprobantes/page.tsx`

#### 2. ⚠️ Vista Principal (CREAR)
- `views/apps/contabilidad/comprobantes/index.tsx`
  - Lista de comprobantes
  - Filtros (fecha, tipo, estado)
  - Tabla con comprobantes
  - Acciones (Ver, Editar, Anular)

#### 3. ⚠️ Vista de Formulario (CREAR)
- `views/apps/contabilidad/comprobantes/form/index.tsx`
  - Selección de tipo de comprobante
  - Encabezado (fecha, descripción, referencia)
  - Grid de líneas (débito/crédito)
  - Validación débitos = créditos
  - Selección de cuenta, tercero, centro costo

#### 4. ⚠️ Servicio (CREAR)
- `services/accounting/voucherService.ts`
  - createVoucher()
  - updateVoucher()
  - getVouchers()
  - postVoucher()
  - voidVoucher()

## 🎨 **DISEÑO DE LA INTERFAZ**

### Vista de Lista
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Comprobantes Contables                    [+ Nuevo]      │
├─────────────────────────────────────────────────────────────┤
│ Filtros:                                                    │
│ [Tipo: Todos ▼] [Estado: Todos ▼] [Desde: __/__/__]       │
│ [Hasta: __/__/__] [Buscar...]                              │
├─────────────────────────────────────────────────────────────┤
│ KPIs:                                                       │
│ ┌──────────┬──────────┬──────────┬──────────┐             │
│ │ Total    │ DRAFT    │ POSTED   │ VOID     │             │
│ │   45     │   12     │   30     │    3     │             │
│ └──────────┴──────────┴──────────┴──────────┘             │
├─────────────────────────────────────────────────────────────┤
│ Tabla:                                                      │
│ # │ Fecha      │ Tipo     │ Número │ Descripción │ Estado │
│ 1 │ 12/12/2025 │ INGRESO  │ ING-001│ Venta #123  │ POSTED │
│ 2 │ 11/12/2025 │ EGRESO   │ EGR-045│ Pago nomina │ POSTED │
│ 3 │ 10/12/2025 │ INGRESO  │ ING-002│ Venta #124  │ DRAFT  │
└─────────────────────────────────────────────────────────────┘
```

### Vista de Formulario
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Nuevo Comprobante de Egreso                              │
├─────────────────────────────────────────────────────────────┤
│ Encabezado:                                                 │
│ Tipo: [EGRESO ▼]  Número: EGR-046  Fecha: [12/12/2025]    │
│ Descripción: [Pago nómina Diciembre 2025____________]      │
│ Referencia: [_________________________________]             │
├─────────────────────────────────────────────────────────────┤
│ Detalle:                                      [+ Agregar]   │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Cuenta    │ Tercero │ Centro Costo│ Débito │ Crédito │  │
│ ├───────────┼─────────┼─────────────┼────────┼─────────┤  │
│ │ 5105-Gas. │ Juan P. │ ADM-IT      │ 50,000 │       0 │  │
│ │ 1110-Banc │    -   │     -       │      0 │  50,000 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Totales:  Débitos: 50,000   Créditos: 50,000   Dif: 0 ✅  │
├─────────────────────────────────────────────────────────────┤
│ [Cancelar] [Guardar Borrador] [Guardar y Contabilizar]    │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 **REGLAS DE NEGOCIO**

### Validaciones
1. ✅ Débitos = Créditos (obligatorio para contabilizar)
2. ✅ Al menos 2 líneas (débito y crédito)
3. ✅ Fecha válida dentro del período fiscal
4. ✅ Cuentas deben existir en el plan de cuentas
5. ✅ Número de comprobante único por tipo
6. ✅ Solo borradores se pueden editar
7. ✅ Comprobantes POSTED no se pueden eliminar

### Estados
- **DRAFT**: Borrador, puede editarse
- **POSTED**: Contabilizado, afecta libros, no se puede editar
- **VOID**: Anulado, no afecta libros

### Flujo
```
CREAR → DRAFT → EDITAR → POST → POSTED
                  ↓
               DELETE   
                  
POSTED → VOID (Anulación)
```

## 📋 **PRIORIDAD DE IMPLEMENTACIÓN**

### Fase 1: Backend Básico (ALTA PRIORIDAD)
1. Crear repositorios
2. Crear DTOs
3. Crear servicio básico (CRUD)
4. Crear controlador con endpoints
5. Actualizar seguridad

### Fase 2: Frontend Lista (ALTA PRIORIDAD)
1. Crear página
2. Crear vista de lista
3. Implementar filtros
4. Conectar con API

### Fase 3: Frontend Formulario (ALTA PRIORIDAD)
1. Crear formulario de comprobante
2. Grid dinámico de líneas
3. Validaciones
4. Guardar y contabilizar

### Fase 4: Funcionalidades Avanzadas (MEDIA PRIORIDAD)
1. Anulación de comprobantes
2. Duplicar comprobante
3. Exportar a PDF/Excel
4. Búsqueda avanzada
5. Auditoría de cambios

## 🎯 **PRÓXIMO PASO INMEDIATO**

Dado el contexto actual, recomiendo:

**Opción 1**: Crear una vista simplificada que muestre los comprobantes existentes (si hay datos en la BD)

**Opción 2**: Implementar el módulo completo paso a paso, empezando por backend

**Opción 3**: Crear una vista de "Próximamente" con un mensaje informativo mientras se implementa

**¿Cuál prefieres que hagamos primero?** 🤔

---
**Estado Actual**: 📌 Planificado, pendiente de implementación
**Complejidad**: Alta (requiere 8-10 archivos nuevos)
**Tiempo estimado**: 2-3 horas de desarrollo completo
