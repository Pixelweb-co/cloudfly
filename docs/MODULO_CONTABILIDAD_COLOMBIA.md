# 📊 ESPECIFICACIÓN - Módulo de Contabilidad para Colombia

## 🇨🇴 Normativa Aplicable

### **Marco Legal:**
- **Decreto 2420 de 2015** - Plan Único de Cuentas (PUC) Comercial
- **Ley 1314 de 2009** - Normas de Contabilidad e Información Financiera
- **NIIF** (Normas Internacionales de Información Financiera)
  - Grupo 1: NIIF Plenas (grandes empresas)
  - Grupo 2: NIIF para PYMES
  - Grupo 3: Contabilidad Simplificada (microempresas)
- **Resolución 000042 de 2020** - PUC para comerciantes

---

## 🏗️ ARQUITECTURA DEL MÓDULO

### **Estructura de Base de Datos:**

```sql
-- 1. PLAN ÚNICO DE CUENTAS (PUC)
CREATE TABLE chart_of_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL UNIQUE,           -- Ej: 1105, 110505
    name VARCHAR(255) NOT NULL,                 -- Ej: Caja
    account_type VARCHAR(50),                   -- ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO, COSTO
    level INT,                                  -- 1=Clase, 2=Grupo, 3=Cuenta, 4=Subcuenta
    parent_code VARCHAR(10),                    -- Código padre
    nature VARCHAR(10),                         -- DEBITO, CREDITO
    requires_third_party BOOLEAN DEFAULT FALSE, -- Si requiere tercero (proveedores, clientes)
    requires_cost_center BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,            -- No se puede eliminar
    INDEX idx_code (code),
    INDEX idx_parent (parent_code)
);

-- 2. TERCEROS (Clientes, Proveedores, Empleados)
CREATE TABLE third_parties (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(20) NOT NULL,                  -- CLIENTE, PROVEEDOR, EMPLEADO, OTRO
    document_type VARCHAR(10),                  -- CC, NIT, CE, PASAPORTE
    document_number VARCHAR(20) NOT NULL UNIQUE,
    verification_digit CHAR(1),                 -- Dígito de verificación para NIT
    business_name VARCHAR(255),                 -- Razón social
    trade_name VARCHAR(255),                    -- Nombre comercial
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    department VARCHAR(100),                    -- Departamento de Colombia
    country VARCHAR(50) DEFAULT 'Colombia',
    tax_regime VARCHAR(50),                     -- SIMPLIFICADO, COMÚN, GRAN_CONTRIBUYENTE
    is_tax_responsible BOOLEAN DEFAULT FALSE,   -- Responsable de IVA
    is_withholding_agent BOOLEAN DEFAULT FALSE, -- Agente de retención
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document (document_type, document_number),
    INDEX idx_type (type)
);

-- 3. CENTROS DE COSTO
CREATE TABLE cost_centers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_id) REFERENCES cost_centers(id)
);

-- 4. COMPROBANTES CONTABLES
CREATE TABLE accounting_vouchers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    voucher_type VARCHAR(20) NOT NULL,          -- INGRESO, EGRESO, NOTA_CONTABLE, APERTURA, CIERRE
    voucher_number VARCHAR(20) NOT NULL,        -- Consecutivo por tipo
    date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),                     -- Factura, recibo, etc.
    status VARCHAR(20) DEFAULT 'DRAFT',         -- DRAFT, POSTED, VOID
    created_by BIGINT,
    approved_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posted_at TIMESTAMP,
    fiscal_year INT,
    fiscal_period INT,                          -- 1-12 (mes)
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    UNIQUE KEY uk_type_number (voucher_type, voucher_number),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_fiscal (fiscal_year, fiscal_period)
);

-- 5. MOVIMIENTOS CONTABLES (Detalle de comprobantes)
CREATE TABLE accounting_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    voucher_id BIGINT NOT NULL,
    line_number INT,
    account_code VARCHAR(10) NOT NULL,
    third_party_id BIGINT,
    cost_center_id BIGINT,
    description VARCHAR(255),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    base_value DECIMAL(15,2),                   -- Base para retenciones
    tax_value DECIMAL(15,2),                    -- Valor del impuesto
    FOREIGN KEY (voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code),
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    INDEX idx_voucher (voucher_id),
    INDEX idx_account (account_code),
    INDEX idx_third_party (third_party_id)
);

-- 6. RETENCIONES (IVA, ICA, Fuente)
CREATE TABLE tax_withholdings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entry_id BIGINT NOT NULL,
    tax_type VARCHAR(20) NOT NULL,              -- RETEIVA, RETEICA, RETEFUENTE
    tax_code VARCHAR(10),                       -- Código del concepto
    tax_name VARCHAR(100),
    base_amount DECIMAL(15,2),
    tax_rate DECIMAL(5,2),                      -- Porcentaje
    tax_amount DECIMAL(15,2),
    FOREIGN KEY (entry_id) REFERENCES accounting_entries(id) ON DELETE CASCADE
);

-- 7. PERÍODOS FISCALES
CREATE TABLE fiscal_periods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    period INT NOT NULL,                        -- 1-12
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',          -- OPEN, CLOSED
    closed_at TIMESTAMP,
    closed_by BIGINT,
    UNIQUE KEY uk_year_period (year, period)
);

-- 8. CIERRE CONTABLE
CREATE TABLE closing_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fiscal_year INT NOT NULL,
    fiscal_period INT NOT NULL,
    account_code VARCHAR(10) NOT NULL,
    third_party_id BIGINT,
    cost_center_id BIGINT,
    debit_balance DECIMAL(15,2) DEFAULT 0,
    credit_balance DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code),
    UNIQUE KEY uk_closing (fiscal_year, fiscal_period, account_code, third_party_id, cost_center_id)
);
```

---

## 📋 PLAN ÚNICO DE CUENTAS (PUC) - Estructura

### **Clase 1: ACTIVO**
```
1 - ACTIVO
  11 - DISPONIBLE
    1105 - Caja
      110505 - Caja General
      110510 - Caja Menor
    1110 - Bancos
      111005 - Moneda Nacional
      111010 - Moneda Extranjera
    1120 - Cuentas de Ahorro
  12 - INVERSIONES
  13 - DEUDORES
    1305 - Clientes
    1355 - Anticipo de Impuestos
  14 - INVENTARIOS
    1435 - Mercancías no fabricadas por la empresa
    1455 - Materias Primas
  15 - ACTIVOS FIJOS
    1516 - Construcciones y edificaciones
    1520 - Maquinaria y equipo
    1524 - Equipo de oficina
    1528 - Equipo de computación
    1592 - Depreciación acumulada (crédito)
```

### **Clase 2: PASIVO**
```
2 - PASIVO
  21 - OBLIGACIONES FINANCIERAS
    2105 - Bancos nacionales
  22 - PROVEEDORES
    2205 - Nacionales
  23 - CUENTAS POR PAGAR
    2335 - Costos y gastos por pagar
    2365 - Retención en la fuente
    2367 - Impuesto a las ventas retenido
    2368 - Impuesto de industria y comercio retenido
  24 - IMPUESTOS, GRAVÁMENES Y TASAS
    2408 - Impuesto sobre las ventas por pagar
    2412 - Impuesto de industria y comercio
  25 - OBLIGACIONES LABORALES
    2505 - Salarios por pagar
    2510 - Cesantías consolidadas
```

### **Clase 3: PATRIMONIO**
```
3 - PATRIMONIO
  31 - CAPITAL SOCIAL
    3105 - Capital suscrito y pagado
  32 - RESERVAS
    3205 - Reservas obligatorias
  33 - REVALORIZACIÓN DEL PATRIMONIO
  36 - RESULTADOS DEL EJERCICIO
    3605 - Utilidades o excedentes acumulados
  37 - RESULTADOS DEL EJERCICIO
    3705 - Utilidad del ejercicio
```

### **Clase 4: INGRESOS**
```
4 - INGRESOS
  41 - OPERACIONALES
    4135 - Comercio al por mayor y al por menor
    4175 - Devoluciones en ventas (débito)
  42 - NO OPERACIONALES
    4210 - Financieros
```

### **Clase 5: GASTOS**
```
5 - GASTOS
  51 - OPERACIONALES DE ADMINISTRACIÓN
    5105 - Gastos de personal
    5110 - Honorarios
    5115 - Impuestos
    5120 - Arrendamientos
    5135 - Servicios
  52 - OPERACIONALES DE VENTAS
  53 - NO OPERACIONALES
  54 - IMPUESTO DE RENTA Y COMPLEMENTARIOS
```

### **Clase 6: COSTOS DE VENTAS**
```
6 - COSTO DE VENTAS
  61 - COSTO DE VENTAS Y DE PRESTACIÓN DE SERVICIOS
    6135 - Comercio al por mayor y al por menor
```

### **Clase 7: COSTOS DE PRODUCCIÓN**
```
7 - COSTOS DE PRODUCCIÓN O DE OPERACIÓN
  71 - MATERIA PRIMA
  72 - MANO DE OBRA DIRECTA
  73 - COSTOS INDIRECTOS
```

---

## 🔢 TIPOS DE COMPROBANTES

### **1. Comprobante de Ingreso (CI)**
```java
Uso: Registrar ingresos de dinero
Ejemplo:
- Recaudo de cartera
- Ventas de contado
- Préstamos recibidos
```

### **2. Comprobante de Egreso (CE)**
```java
Uso: Registrar salidas de dinero
Ejemplo:
- Pago a proveedores
- Nómina
- Pago de servicios
```

### **3. Nota Contable (NC)**
```java
Uso: Ajustes y reclasificaciones
Ejemplo:
- Depreciaciones
- Provisiones
- Correcciones
```

### **4. Comprobante de Apertura**
```java
Uso: Abrir período contable con saldos iniciales
```

### **5. Comprobante de Cierre**
```java
Uso: Cerrar cuentas de resultado al final del período
```

---

## 💼 FUNCIONALIDADES DEL MÓDULO

### **1. Gestión del PUC**
```typescript
Funciones:
- ✅ Consultar plan de cuentas
- ✅ Crear cuentas personalizadas
- ✅ Desactivar/Activar cuentas
- ✅ Búsqueda por código o nombre
- ✅ Visualización jerárquica
- ✅ Exportar PUC a Excel
```

### **2. Comprobantes Contables**
```typescript
Funciones:
- ✅ Crear comprobante (debe = haber)
- ✅ Editar comprobante en borrador
- ✅ Contabilizar (cambiar a POSTED)
- ✅ Anular comprobante
- ✅ Reversión de comprobantes
- ✅ Duplicar comprobante
- ✅ Adjuntar documentos (PDF, imágenes)
- ✅ Consecutivo automático por tipo
- ✅ Validación: Débito = Crédito
```

### **3. Terceros**
```typescript
Funciones:
- ✅ CRUD de terceros
- ✅ Clasificación (cliente/proveedor/empleado)
- ✅ Calcular dígito de verificación NIT
- ✅ Validar documento con RUES (opcional)
- ✅ Importar desde Excel
- ✅ Estado de cuenta por tercero
```

### **4. Centros de Costo**
```typescript
Funciones:
- ✅ Crear jerarquía de centros
- ✅ Asignar a movimientos
- ✅ Reportes por centro
- ✅ Análisis de rentabilidad
```

### **5. Retenciones**
```typescript
Tipos:
- Retención en la Fuente (Renta)
  - Servicios: 11%
  - Honorarios: 10%
  - Compras: 2.5%
  - Arrendamientos: 3.5%
  
- Retención de IVA (ReteIVA): 15%
- Retención de ICA (ReteICA): Según ciudad

Funciones:
- ✅ Cálculo automático
- ✅ Certificados de retención
- ✅ Reporte de retenciones
```

### **6. Reportes Contables**
```typescript
Reportes Básicos:
1. Balance de Prueba
2. Balance General
3. Estado de Resultados (P&G)
4. Libro Diario
5. Libro Mayor
6. Auxiliares por Cuenta
7. Estado de Cuenta por Tercero

Reportes Fiscales:
8. Medios Magnéticos
9. Información Exógena
10. Declaraciones (IVA, Renta)

Reportes de Análisis:
11. Flujo de Caja
12. Indicadores Financieros
13. Análisis Horizontal/Vertical
```

---

## 🎨 DISEÑO DE INTERFAZ

### **Pantalla Principal: Comprobante Contable**

```
┌─────────────────────────────────────────────────────────────┐
│  COMPROBANTE DE: [Ingreso ▼]  N°: [00001]  Fecha: [2025-12-11] │
├─────────────────────────────────────────────────────────────┤
│  Descripción: [Venta de mercancía             ]             │
│  Referencia:  [FAC-001                        ]             │
├──────┬─────────────┬─────────┬─────────┬────────┬──────────┤
│ CUEN │   NOMBRE    │ TERCERO │ C.COSTO │ DÉBITO │ CRÉDITO  │
├──────┼─────────────┼─────────┼─────────┼────────┼──────────┤
│ 1105 │ Caja        │         │         │ 100.00 │          │
│ 4135 │ Ventas      │ CLI-001 │ VEN-001 │        │ 100.00   │
├──────┴─────────────┴─────────┴─────────┼────────┼──────────┤
│                              TOTALES:  │ 100.00 │ 100.00   │
└────────────────────────────────────────┴────────┴──────────┘
│ [Agregar Línea]  [Guardar Borrador]  [Contabilizar]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 MODELOS DE DATOS (Java/TypeScript)

### **ChartOfAccount (Cuenta Contable)**
```java
public class ChartOfAccount {
    private Long id;
    private String code;           // "1105"
    private String name;           // "Caja"
    private AccountType type;      // ACTIVO, PASIVO, etc.
    private Integer level;         // 1, 2, 3, 4
    private String parentCode;
    private Nature nature;         // DEBITO, CREDITO
    private Boolean requiresThirdParty;
    private Boolean requiresCostCenter;
    private Boolean isActive;
    private Boolean isSystem;
}

enum AccountType {
    ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO, COSTO
}

enum Nature {
    DEBITO, CREDITO
}
```

### **AccountingVoucher (Comprobante)**
```java
public class AccountingVoucher {
    private Long id;
    private VoucherType type;
    private String number;
    private LocalDate date;
    private String description;
    private String reference;
    private VoucherStatus status;
    private List<AccountingEntry> entries;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private Integer fiscalYear;
    private Integer fiscalPeriod;
    
    public boolean isBalanced() {
        return totalDebit.equals(totalCredit);
    }
}

enum VoucherType {
    INGRESO, EGRESO, NOTA_CONTABLE, APERTURA, CIERRE
}

enum VoucherStatus {
    DRAFT, POSTED, VOID
}
```

### **AccountingEntry (Movimiento)**
```java
public class AccountingEntry {
    private Long id;
    private Long voucherId;
    private Integer lineNumber;
    private String accountCode;
    private Long thirdPartyId;
    private Long costCenterId;
    private String description;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal baseValue;
    private BigDecimal taxValue;
}
```

---

## 🔌 ENDPOINTS REST API

```java
// Cuentas
GET    /api/accounting/accounts             - Lista de cuentas
POST   /api/accounting/accounts             - Crear cuenta
GET    /api/accounting/accounts/{code}      - Detalle de cuenta
PUT    /api/accounting/accounts/{code}      - Actualizar cuenta
DELETE /api/accounting/accounts/{code}      - Eliminar cuenta
GET    /api/accounting/accounts/tree        - Estructura jerárquica

// Comprobantes
GET    /api/accounting/vouchers             - Lista de comprobantes
POST   /api/accounting/vouchers             - Crear comprobante
GET    /api/accounting/vouchers/{id}        - Detalle
PUT    /api/accounting/vouchers/{id}        - Actualizar
DELETE /api/accounting/vouchers/{id}        - Eliminar
POST   /api/accounting/vouchers/{id}/post   - Contabilizar
POST   /api/accounting/vouchers/{id}/void   - Anular

// Terceros
GET    /api/accounting/third-parties        - Lista
POST   /api/accounting/third-parties        - Crear
GET    /api/accounting/third-parties/{id}   - Detalle
GET    /api/accounting/third-parties/{id}/statement - Estado de cuenta

// Reportes
GET    /api/accounting/reports/trial-balance
GET    /api/accounting/reports/balance-sheet
GET    /api/accounting/reports/income-statement
GET    /api/accounting/reports/ledger?accountCode=1105
GET    /api/accounting/reports/journal?from=2025-01-01&to=2025-12-31
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Fundamentos (2 semanas)**
- [ ] Base de datos según esquema
- [ ] Cargar PUC colombiano completo
- [ ] CRUD de cuentas contables
- [ ] CRUD de terceros
- [ ] CRUD de centros de costo

### **Fase 2: Comprobantes (2 semanas)**
- [ ] Crear comprobantes
- [ ] Validación débito = crédito
- [ ] Consecutivos automáticos
- [ ] Contabilizar/Anular
- [ ] Adjuntar documentos

### **Fase 3: Procesos Contables (2 semanas)**
- [ ] Cálculo de retenciones
- [ ] Cierre de período
- [ ] Apertura de período
- [ ] Causaciones automáticas

### **Fase 4: Reportes (2 semanas)**
- [ ] Balance de prueba
- [ ] Balance general
- [ ] Estado de resultados
- [ ] Libro diario
- [ ] Libro mayor
- [ ] Auxiliares

### **Fase 5: Integraciones (1 semana)**
- [ ] Integración con facturación
- [ ] Integración con nómina
- [ ] Integración con inventarios
- [ ] Integración con bancos

---

## 🎓 REGLAS DE NEGOCIO

### **Validaciones Obligatorias:**
1. ✅ Débito SIEMPRE debe ser igual a Crédito
2. ✅ No se puede eliminar un comprobante contabilizado
3. ✅ El período fiscal debe estar abierto
4. ✅ Las cuentas de nivel 4 son las únicas movibles
5. ✅ Código de cuenta debe ser único
6. ✅ Tercero obligatorio si la cuenta lo requiere
7. ✅ NIT debe tener dígito de verificación válido
8. ✅ No se puede modificar un período cerrado

### **Reglas Contables:**
1. Los activos tienen naturaleza DÉBITO
2. Los pasivos tienen naturaleza CRÉDITO
3. El patrimonio tiene naturaleza CRÉDITO
4. Los ingresos tienen naturaleza CRÉDITO
5. Los gastos tienen naturaleza DÉBITO
6. Los costos tienen naturaleza DÉBITO

---

## 📚 RECURSOS Y REFERENCIAS

### **Normas:**
- DIAN: https://www.dian.gov.co
- Supersociedades: https://www.supersociedades.gov.co
- CTCP (Consejo Técnico de la Contaduría Pública)

### **PUC Oficial:**
- Decreto 2650 de 1993 (derogado para comerciantes)
- Decreto 2420 de 2015 (vigente)

---

**Desarrollado por:** CloudFly Accounting Module  
**Última actualización:** 2025-12-11  
**Versión:** 1.0.0
