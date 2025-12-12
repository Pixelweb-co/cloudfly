# 📋 ACTUALIZACIÓN - Integración Contable

## ✅ CAMBIOS REALIZADOS (2025-12-11 20:07)

### **1. Entidad Contact - Backend** ✅

**Archivo:** `backend/src/main/java/com/app/starter1/persistence/entity/Contact.java`

**Campos agregados para Contabilidad:**

#### **Identificación:**
- `documentType` - Tipo documento: CC, NIT, CE, PASAPORTE
- `documentNumber` - Número sin dígito de verificación
- `verificationDigit` - Dígito de verificación para NIT

#### **Información Fiscal:**
- `businessName` - Razón social (empresas)
- `tradeName` - Nombre comercial
- `firstName` - Primer nombre (personas)
- `lastName` - Apellido
- `mobile` - Celular
- `city` - Ciudad
- `department` - Departamento (Colombia)
- `country` - País (default: "Colombia")
- `taxRegime` - Régimen: SIMPLIFICADO, COMÚN, GRAN_CONTRIBUYENTE

#### **Responsabilidades Tributarias:**
- `isTaxResponsible` - Responsable de IVA
- `isWithholdingAgent` - Agente de retención
- `applyWithholdingTax` - Aplica Retención en la Fuente
- `applyVatWithholding` - Aplica ReteIVA
- `applyIcaWithholding` - Aplica ReteICA
- `customWithholdingRate` - Porcentaje personalizado

#### **Configuración Contable:**
- `defaultAccountCode` - Cuenta contable por defecto (Ej: "1305" para clientes)
- `paymentTermsDays` - Plazo de pago en días
- `creditLimit` - Límite de crédito
- `currentBalance` - Saldo actual (deuda)
- `isActive` - Activo/Inactivo

---

### **2. Menú Frontend - Módulo Contabilidad** ✅

**Archivo:** `frontend/src/components/layout/vertical/verticalMenuData.json`

**Nuevo módulo agregado:** 📊 **Contabilidad**

**Sub-menús:**
1. **Plan de Cuentas** → `/contabilidad/plan-cuentas`
2. **Comprobantes** → `/contabilidad/comprobantes`
3. **Terceros** → `/contabilidad/terceros`
4. **Centros de Costo** → `/contabilidad/centros-costo`
5. **Balance de Prueba** → `/contabilidad/balance-prueba`
6. **Libro Diario** → `/contabilidad/libro-diario`
7. **Libro Mayor** → `/contabilidad/libro-mayor`

**Roles permitidos:** SUPERADMIN, ADMIN

---

## 🔄 PRÓXIMOS PASOS

### **Base de Datos:**
```sql
-- Ejecutar migración para agregar columnas a contacts
ALTER TABLE contacts 
ADD COLUMN document_type VARCHAR(20),
ADD COLUMN document_number VARCHAR(20),
ADD COLUMN verification_digit CHAR(1),
ADD COLUMN business_name VARCHAR(255),
ADD COLUMN trade_name VARCHAR(255),
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100),
ADD COLUMN mobile VARCHAR(20),
ADD COLUMN city VARCHAR(100),
ADD COLUMN department VARCHAR(100),
ADD COLUMN country VARCHAR(50) DEFAULT 'Colombia',
ADD COLUMN tax_regime VARCHAR(50),
ADD COLUMN is_tax_responsible BOOLEAN DEFAULT FALSE,
ADD COLUMN is_withholding_agent BOOLEAN DEFAULT FALSE,
ADD COLUMN apply_withholding_tax BOOLEAN DEFAULT FALSE,
ADD COLUMN apply_vat_withholding BOOLEAN DEFAULT FALSE,
ADD COLUMN apply_ica_withholding BOOLEAN DEFAULT FALSE,
ADD COLUMN custom_withholding_rate DECIMAL(5,2),
ADD COLUMN default_account_code VARCHAR(10),
ADD COLUMN payment_terms_days INT DEFAULT 0,
ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0.0,
ADD COLUMN current_balance DECIMAL(15,2) DEFAULT 0.0,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Índices recomendados
CREATE INDEX idx_contacts_document ON contacts(document_type, document_number);
CREATE INDEX idx_contacts_tax_regime ON contacts(tax_regime);
CREATE INDEX idx_contacts_active ON contacts(is_active);
```

### **Crear Entidades Contables:**

1. **ChartOfAccount** (Plan de Cuentas)
2. **AccountingVoucher** (Comprobantes)
3. **AccountingEntry** (Movimientos contables)
4. **CostCenter** (Centros de costo)
5. **TaxWithholding** (Retenciones)
6. **FiscalPeriod** (Períodos fiscales)

Ver especificación completa en: `docs/MODULO_CONTABILIDAD_COLOMBIA.md`

---

### **Controllers Backend:**

```java
@RestController
@RequestMapping("/api/accounting")
public class AccountingController {
    
    // Plan de Cuentas
    @GetMapping("/accounts")
    public ResponseEntity<List<ChartOfAccount>> getAccounts() { }
    
    @PostMapping("/accounts")
    public ResponseEntity<ChartOfAccount> createAccount(@RequestBody ChartOfAccount account) { }
    
    // Comprobantes
    @GetMapping("/vouchers")
    public ResponseEntity<List<AccountingVoucher>> getVouchers() { }
    
    @PostMapping("/vouchers")
    public ResponseEntity<AccountingVoucher> createVoucher(@RequestBody AccountingVoucher voucher) { }
    
    @PostMapping("/vouchers/{id}/post")
    public ResponseEntity<Void> postVoucher(@PathVariable Long id) { }
    
    // Terceros (usa Contact existente pero con filtros contables)
    @GetMapping("/third-parties")
    public ResponseEntity<List<Contact>> getThirdParties() { }
    
    // Reportes
    @GetMapping("/reports/trial-balance")
    public ResponseEntity<TrialBalanceReport> getTrialBalance(
        @RequestParam Integer year,
        @RequestParam Integer period
    ) { }
}
```

---

### **Views Frontend:**

Crear carpeta: `frontend/src/views/apps/contabilidad/`

**Estructura:**
```
contabilidad/
├── plan-cuentas/
│   ├── index.tsx
│   └── components/
│       ├── AccountTree.tsx
│       └── AccountForm.tsx
├── comprobantes/
│   ├── index.tsx
│   └── components/
│       ├── VoucherList.tsx
│       ├── VoucherForm.tsx
│       └── VoucherEntries.tsx
├── terceros/
│   ├── index.tsx
│   └── components/
│       ├── ThirdPartyList.tsx
│       └── ThirdPartyForm.tsx
├── centros-costo/
│   ├── index.tsx
│   └── components/
│       └── CostCenterTree.tsx
└── reportes/
    ├── balance-prueba/
    ├── libro-diario/
    └── libro-mayor/
```

---

## 📊 INTEGRACIÓN CON OTROS MÓDULOS

### **Productos:**
- Agregar campos contables:
  - `incomeAccountCode` - Cuenta de ingreso (Ej: 4135)
  - `costAccountCode` - Cuenta de costo (Ej: 6135)
  - `inventoryAccountCode` - Cuenta de inventario (Ej: 1435)

### **Cotizaciones y Órdenes:**
- Al crear: No afecta contabilidad (solo proyección)
- Al aprobar: Genera movimiento contable

### **Facturas:**
- Al crear factura → Genera comprobante contable automático:
```
Débito: 1305 - Clientes          $100,000
Crédito: 4135 - Ventas           $ 84,034
Crédito: 2408 - IVA por pagar    $ 15,966
```

---

## ✅ VALIDACIONES IMPLEMENTADAS (Recomendado)

### **Contact (Tercero):**
1. Si `documentType = 'NIT'` → `verificationDigit` es obligatorio
2. Calcular automáticamente dígito de verificación
3. Si `type = 'PROVEEDOR'` → `defaultAccountCode` sugerido: "2205"
4. Si `type = 'CLIENTE'` → `defaultAccountCode` sugerido: "1305"
5. `documentNumber` debe ser único por `documentType`

### **Comprobante Contable:**
1. Total Débito = Total Crédito (obligatorio)
2. Al menos 2 movimientos
3. Puede tener máximo 1 movimiento por cuenta si no requiere tercero
4. Período fiscal debe estar ABIERTO

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Fundamentos** (Esta semana)
- [x] Contact con campos contables
- [x] Menú de Contabilidad
- [ ] Crear schema de base de datos
- [ ] Migración de Contact
- [ ] Entidad ChartOfAccount
- [ ] Cargar PUC colombiano

### **Fase 2: Comprobantes** (Próxima semana)
- [ ] Entidad AccountingVoucher
- [ ] Entidad AccountingEntry
- [ ] Controller y Service
- [ ] Vista de comprobantes
- [ ] Validación débito = crédito

### **Fase 3: Reportes** (En 2 semanas)
- [ ] Balance de Prueba
- [ ] Libro Diario
- [ ] Libro Mayor
- [ ] Exportar a Excel

### **Fase 4: Integración** (En 3 semanas)
- [ ] Auto-contabilizar facturas
- [ ] Auto-contabilizar pagos
- [ ] Auto-contabilizar nómina
- [ ] Cierre de período

---

## 📚 RECURSOS

- **Especificación:** `docs/MODULO_CONTABILIDAD_COLOMBIA.md`
- **PUC Oficial:** Decreto 2420 de 2015
- **DIAN:** https://www.dian.gov.co
- **Contact actualizado:** `backend/.../entity/Contact.java`
- **Menú:** `frontend/.../verticalMenuData.json`

---

**Fecha:** 2025-12-11  
**Autor:** CloudFly Team  
**Estado:** ✅ Contact y Menú actualizados
