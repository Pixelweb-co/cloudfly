# 🎨 ESPECIFICACIÓN FRONTEND - Módulo de Contabilidad

## 📁 ESTRUCTURA DE CARPETAS

```
frontend/src/
├── app/(dashboard)/
│   └── contabilidad/
│       ├── plan-cuentas/
│       │   └── page.tsx
│       ├── comprobantes/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── terceros/
│       │   └── page.tsx
│       ├── centros-costo/
│       │   └── page.tsx
│       ├── balance-prueba/
│       │   └── page.tsx
│       ├── libro-diario/
│       │   └── page.tsx
│       └── libro-mayor/
│           └── page.tsx
├── views/apps/contabilidad/
│   ├── plan-cuentas/
│   │   ├── index.tsx                      # Vista principal
│   │   ├── types.ts                       # Tipos TypeScript
│   │   ├── services/
│   │   │   └── api.ts                     # Llamadas API
│   │   └── components/
│   │       ├── AccountTree.tsx            # Árbol jerárquico
│   │       ├── AccountForm.tsx            # Formulario crear/editar
│   │       └── AccountSearch.tsx          # Búsqueda de cuentas
│   ├── comprobantes/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── components/
│   │       ├── ComprobanteLista.tsx       # Lista de comprobantes
│   │       ├── ComprobanteForm.tsx        # Formulario principal
│   │       ├── ComprobanteDetalle.tsx     # Tabla de movimientos
│   │       ├── MovimientoRow.tsx          # Fila editable
│   │       ├── TerceroSelector.tsx        # Selector de terceros
│   │       └── CuentaSelector.tsx         # Selector de cuentas
│   ├── terceros/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── components/
│   │       ├── TerceroLista.tsx
│   │       ├── TerceroForm.tsx
│   │       ├── TerceroDetalle.tsx
│   │       └── EstadoCuentaModal.tsx      # Estado de cuenta
│   ├── centros-costo/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── components/
│   │       ├── CostCenterTree.tsx
│   │       └── CostCenterForm.tsx
│   └── reportes/
│       ├── balance-prueba/
│       │   ├── index.tsx
│       │   └── components/
│       │       ├── BalanceTable.tsx
│       │       └── BalanceFilters.tsx
│       ├── libro-diario/
│       │   ├── index.tsx
│       │   └── components/
│       │       └── DiarioTable.tsx
│       └── libro-mayor/
│           ├── index.tsx
│           └── components/
│               ├── MayorFilters.tsx
│               └── MayorTable.tsx
└── types/apps/
    └── contabilidadTypes.ts               # Tipos globales
```

---

## 📝 TIPOS TYPESCRIPT

### **Archivo:** `types/apps/contabilidadTypes.ts`

```typescript
// ========== ENUMS ==========

export enum AccountType {
  ACTIVO = 'ACTIVO',
  PASIVO = 'PASIVO',
  PATRIMONIO = 'PATRIMONIO',
  INGRESO = 'INGRESO',
  GASTO = 'GASTO',
  COSTO = 'COSTO'
}

export enum AccountNature {
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO'
}

export enum VoucherType {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
  NOTA_CONTABLE = 'NOTA_CONTABLE',
  APERTURA = 'APERTURA',
  CIERRE = 'CIERRE'
}

export enum VoucherStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID'
}

export enum TaxType {
  RETEFUENTE = 'RETEFUENTE',
  RETEIVA = 'RETEIVA',
  RETEICA = 'RETEICA'
}

export enum PeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

// ========== INTERFACES ==========

export interface ChartOfAccount {
  id: number
  code: string
  name: string
  accountType: AccountType
  level: number
  parentCode?: string
  nature: AccountNature
  requiresThirdParty: boolean
  requiresCostCenter: boolean
  isActive: boolean
  isSystem: boolean
  createdAt?: string
  updatedAt?: string
  
  // Calculados
  fullName?: string
  children?: ChartOfAccount[]
}

export interface CostCenter {
  id: number
  code: string
  name: string
  description?: string
  parentId?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  
  // Calculados
  fullName?: string
  children?: CostCenter[]
}

export interface AccountingVoucher {
  id: number
  voucherType: VoucherType
  voucherNumber: string
  date: string
  description?: string
  reference?: string
  status: VoucherStatus
  tenantId: number
  createdBy?: number
  approvedBy?: number
  createdAt?: string
  postedAt?: string
  fiscalYear: number
  fiscalPeriod: number
  totalDebit: number
  totalCredit: number
  entries: AccountingEntry[]
  
  // Calculados
  isBalanced?: boolean
  difference?: number
}

export interface AccountingEntry {
  id?: number
  voucherId?: number
  lineNumber?: number
  accountCode: string
  thirdPartyId?: number
  costCenterId?: number
  description?: string
  debitAmount: number
  creditAmount: number
  baseValue?: number
  taxValue?: number
  
  // Relaciones expandidas
  account?: ChartOfAccount
  thirdParty?: Contact
  costCenter?: CostCenter
  
  // Para edición
  isEditing?: boolean
}

export interface TaxWithholding {
  id: number
  entryId: number
  taxType: TaxType
  taxCode?: string
  taxName?: string
  baseAmount: number
  taxRate: number
  taxAmount: number
}

export interface FiscalPeriod {
  id: number
  tenantId: number
  year: number
  period: number
  startDate: string
  endDate: string
  status: PeriodStatus
  closedAt?: string
  closedBy?: number
  
  // Calculados
  periodName?: string
}

export interface Contact {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  type: 'CLIENTE' | 'PROVEEDOR' | 'EMPLEADO' | 'OTRO'
  
  // Campos contables
  documentType?: string
  documentNumber?: string
  verificationDigit?: string
  businessName?: string
  tradeName?: string
  firstName?: string
  lastName?: string
  mobile?: string
  city?: string
  department?: string
  country?: string
  taxRegime?: string
  isTaxResponsible?: boolean
  isWithholdingAgent?: boolean
  applyWithholdingTax?: boolean
  applyVatWithholding?: boolean
  applyIcaWithholding?: boolean
  customWithholdingRate?: number
  defaultAccountCode?: string
  paymentTermsDays?: number
  creditLimit?: number
  currentBalance?: number
  isActive?: boolean
}

// ========== DTOs ==========

export interface CreateVoucherRequest {
  voucherType: VoucherType
  date: string
  description?: string
  reference?: string
  entries: CreateEntryRequest[]
}

export interface CreateEntryRequest {
  accountCode: string
  thirdPartyId?: number
  costCenterId?: number
  description?: string
  debitAmount: number
  creditAmount: number
  baseValue?: number
  taxValue?: number
}

export interface BalanceTrialRow {
  accountCode: string
  accountName: string
  previousDebit: number
  previousCredit: number
  currentDebit: number
  currentCredit: number
  debitBalance: number
  creditBalance: number
}

export interface LedgerEntry {
  date: string
  voucherNumber: string
  voucherType: VoucherType
  description: string
  reference?: string
  debitAmount: number
  creditAmount: number
  balance: number
}
```

---

## 🔌 SERVICIOS API

### **Archivo:** `views/apps/contabilidad/plan-cuentas/services/api.ts`

```typescript
import axios from 'axios'
import type { ChartOfAccount } from '@/types/apps/contabilidadTypes'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export class ChartOfAccountService {
  private static getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Obtener todas las cuentas
  static async getAll(): Promise<ChartOfAccount[]> {
    const response = await axios.get(`${BASE_URL}/api/accounting/accounts`, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Obtener árbol jerárquico
  static async getTree(): Promise<ChartOfAccount[]> {
    const response = await axios.get(`${BASE_URL}/api/accounting/accounts/tree`, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Obtener por código
  static async getByCode(code: string): Promise<ChartOfAccount> {
    const response = await axios.get(`${BASE_URL}/api/accounting/accounts/${code}`, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Crear cuenta
  static async create(account: Partial<ChartOfAccount>): Promise<ChartOfAccount> {
    const response = await axios.post(`${BASE_URL}/api/accounting/accounts`, account, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Actualizar cuenta
  static async update(code: string, account: Partial<ChartOfAccount>): Promise<ChartOfAccount> {
    const response = await axios.put(`${BASE_URL}/api/accounting/accounts/${code}`, account, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Eliminar cuenta
  static async delete(code: string): Promise<void> {
    await axios.delete(`${BASE_URL}/api/accounting/accounts/${code}`, {
      headers: this.getHeaders()
    })
  }

  // Buscar cuentas
  static async search(query: string): Promise<ChartOfAccount[]> {
    const response = await axios.get(`${BASE_URL}/api/accounting/accounts/search`, {
      params: { query },
      headers: this.getHeaders()
    })
    return response.data
  }
}
```

### **Archivo:** `views/apps/contabilidad/comprobantes/services/api.ts`

```typescript
import axios from 'axios'
import type { 
  AccountingVoucher, 
  CreateVoucherRequest,
  VoucherType,
  VoucherStatus 
} from '@/types/apps/contabilidadTypes'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export class VoucherService {
  private static getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Listar comprobantes
  static async getAll(filters?: {
    type?: VoucherType
    status?: VoucherStatus
    fromDate?: string
    toDate?: string
    fiscalYear?: number
    fiscalPeriod?: number
  }): Promise<AccountingVoucher[]> {
    const response = await axios.get(`${BASE_URL}/api/accounting/vouchers`, {
      params: filters,
      headers: this.getHeaders()
    })
    return response.data
  }

  // Obtener por ID
  static async getById(id: number): Promise<AccountingVoucher> {
    const response = await axios.get(`${BASE_URL}/api/accounting/vouchers/${id}`, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Crear comprobante
  static async create(voucher: CreateVoucherRequest): Promise<AccountingVoucher> {
    const response = await axios.post(`${BASE_URL}/api/accounting/vouchers`, voucher, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Actualizar comprobante
  static async update(id: number, voucher: Partial<CreateVoucherRequest>): Promise<AccountingVoucher> {
    const response = await axios.put(`${BASE_URL}/api/accounting/vouchers/${id}`, voucher, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Contabilizar comprobante
  static async post(id: number): Promise<AccountingVoucher> {
    const response = await axios.post(`${BASE_URL}/api/accounting/vouchers/${id}/post`, {}, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Anular comprobante
  static async void(id: number): Promise<AccountingVoucher> {
    const response = await axios.post(`${BASE_URL}/api/accounting/vouchers/${id}/void`, {}, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // Eliminar comprobante (solo borradores)
  static async delete(id: number): Promise<void> {
    await axios.delete(`${BASE_URL}/api/accounting/vouchers/${id}`, {
      headers: this.getHeaders()
    })
  }

  // Obtener siguiente número
  static async getNextNumber(type: VoucherType): Promise<string> {
    const response = await axios.get(`${BASE_URL}/api/accounting/vouchers/next-number`, {
      params: { type },
      headers: this.getHeaders()
    })
    return response.data
  }
}
```

---

## 🎨 COMPONENTES PRINCIPALES

### **1. Plan de Cuentas - Árbol Jerárquico**

**Archivo:** `views/apps/contabilidad/plan-cuentas/components/AccountTree.tsx`

```typescript
'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Edit, Trash2, Plus } from 'lucide-react'
import type { ChartOfAccount } from '@/types/apps/contabilidadTypes'

interface AccountTreeProps {
  accounts: ChartOfAccount[]
  onEdit?: (account: ChartOfAccount) => void
  onDelete?: (account: ChartOfAccount) => void
  onAdd?: (parentCode: string) => void
}

const AccountTree: React.FC<AccountTreeProps> = ({ accounts, onEdit, onDelete, onAdd }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  const renderAccount = (account: ChartOfAccount, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expanded.has(account.code)

    return (
      <div key={account.code}>
        <div 
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 group"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(account.code)} className="p-1">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-6" />
          )}
          
          <span className="font-mono text-sm text-gray-600">{account.code}</span>
          <span className="flex-1">{account.name}</span>
          
          <span className={`text-xs px-2 py-1 rounded ${
            account.nature === 'DEBITO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
          }`}>
            {account.nature}
          </span>

          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            {account.level < 4 && (
              <button
                onClick={() => onAdd?.(account.code)}
                className="p-1 hover:bg-blue-100 rounded"
                title="Agregar subcuenta"
              >
                <Plus size={16} className="text-blue-600" />
              </button>
            )}
            <button
              onClick={() => onEdit?.(account)}
              className="p-1 hover:bg-yellow-100 rounded"
              title="Editar"
            >
              <Edit size={16} className="text-yellow-600" />
            </button>
            {!account.isSystem && (
              <button
                onClick={() => onDelete?.(account)}
                className="p-1 hover:bg-red-100 rounded"
                title="Eliminar"
              >
                <Trash2 size={16} className="text-red-600" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          account.children!.map(child => renderAccount(child, level + 1))
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white">
      {accounts.map(account => renderAccount(account))}
    </div>
  )
}

export default AccountTree
```

---

### **2. Comprobante - Formulario**

**Archivo:** `views/apps/contabilidad/comprobantes/components/ComprobanteForm.tsx`

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Save, Send, X } from 'lucide-react'
import type { 
  AccountingVoucher, 
  AccountingEntry,
  VoucherType 
} from '@/types/apps/contabilidadTypes'
import MovimientoRow from './MovimientoRow'
import { VoucherService } from '../services/api'
import { toast } from 'react-hot-toast'

interface ComprobanteFormProps {
  voucher?: AccountingVoucher
  onSave?: (voucher: AccountingVoucher) => void
  onCancel?: () => void
}

const ComprobanteForm: React.FC<ComprobanteFormProps> = ({ voucher, onSave, onCancel }) => {
  const [voucherType, setVoucherType] = useState<VoucherType>('NOTA_CONTABLE')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (voucher) {
      setVoucherType(voucher.voucherType)
      setDate(voucher.date)
      setDescription(voucher.description || '')
      setReference(voucher.reference || '')
      setEntries(voucher.entries)
    } else {
      // Agregar 2 líneas vacías por defecto
      addEntry()
      addEntry()
    }
  }, [voucher])

  const addEntry = () => {
    setEntries(prev => [...prev, {
      accountCode: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    }])
  }

  const updateEntry = (index: number, entry: Partial<AccountingEntry>) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, ...entry } : e))
  }

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const totalDebit = entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0)
    const totalCredit = entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0)
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit }
  }

  const handleSave = async (post: boolean = false) => {
    const { totalDebit, totalCredit } = calculateTotals()
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error('El comprobante no está balanceado')
      return
    }

    setIsLoading(true)
    try {
      const data = {
        voucherType,
        date,
        description,
        reference,
        entries: entries.filter(e => e.accountCode)
      }

      let savedVoucher: AccountingVoucher
      if (voucher?.id) {
        savedVoucher = await VoucherService.update(voucher.id, data)
      } else {
        savedVoucher = await VoucherService.create(data)
      }

      if (post) {
        savedVoucher = await VoucherService.post(savedVoucher.id)
        toast.success('Comprobante contabilizado exitosamente')
      } else {
        toast.success('Comprobante guardado como borrador')
      }

      onSave?.(savedVoucher)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar comprobante')
    } finally {
      setIsLoading(false)
    }
  }

  const { totalDebit, totalCredit, difference } = calculateTotals()
  const isBalanced = Math.abs(difference) < 0.01

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4">
        <div>
         <label className="block text-sm font-medium mb-1">Tipo</label>
          <select 
            value={voucherType}
            onChange={e => setVoucherType(e.target.value as VoucherType)}
            className="w-full border rounded p-2"
          >
            <option value="INGRESO">Comprobante de Ingreso</option>
            <option value="EGRESO">Comprobante de Egreso</option>
            <option value="NOTA_CONTABLE">Nota Contable</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Referencia</label>
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="Ej: FAC-001"
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción general"
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Cuenta</th>
              <th className="px-4 py-2 text-left">Tercero</th>
              <th className="px-4 py-2 text-left">Centro Costo</th>
              <th className="px-4 py-2 text-left">Descripción</th>
              <th className="px-4 py-2 text-right">Débito</th>
              <th className="px-4 py-2 text-right">Crédito</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <MovimientoRow
                key={index}
                entry={entry}
                onChange={e => updateEntry(index, e)}
                onRemove={() => removeEntry(index)}
              />
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right">TOTALES:</td>
              <td className="px-4 py-2 text-right text-blue-600">
                ${totalDebit.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-right text-green-600">
                ${totalCredit.toFixed(2)}
              </td>
              <td></td>
            </tr>
            {!isBalanced && (
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-red-600">
                  DIFERENCIA:
                </td>
                <td colSpan={2} className="px-4 py-2 text-right text-red-600 font-bold">
                  ${Math.abs(difference).toFixed(2)}
                </td>
                <td></td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between">
        <button
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
        >
          <Plus size={16} />
          Agregar Línea
        </button>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={!isBalanced || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            <Save size={16} />
            Guardar Borrador
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={!isBalanced || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={16} />
            Guardar y Contabilizar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComprobanteForm
```

---

## 📊 PÁGINAS PRINCIPALES

### **Plan de Cuentas**

**Archivo:** `app/(dashboard)/contabilidad/plan-cuentas/page.tsx`

```typescript
import PlanCuentasView from '@/views/apps/contabilidad/plan-cuentas'

export const metadata = {
  title: 'Plan de Cuentas - Contabilidad',
  description: 'Gestión del Plan Único de Cuentas (PUC)'
}

export default function PlanCuentasPage() {
  return <PlanCuentasView />
}
```

### **Comprobantes**

**Archivo:** `app/(dashboard)/contabilidad/comprobantes/page.tsx`

```typescript
import ComprobantesView from '@/views/apps/contabilidad/comprobantes'

export const metadata = {
  title: 'Comprobantes Contables',
  description: 'Gestión de comprobantes contables'
}

export default function ComprobantesPage() {
  return <ComprobantesView />
}
```

---

## 🎯 UTILIDADES Y HELPERS

### **Archivo:** `utils/accounting.ts`

```typescript
/**
 * Calcula el dígito de verificación de un NIT colombiano
 */
export function calculateNitCheckDigit(nit: string): string {
  const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]
  const nitDigits = nit.replace(/\D/g, '').split('').reverse()
  
  let sum = 0
  for (let i = 0; i < nitDigits.length; i++) {
    sum += parseInt(nitDigits[i]) * weights[i]
  }
  
  const remainder = sum % 11
  return remainder > 1 ? String(11 - remainder) : String(remainder)
}

/**
 * Formatea un número como moneda colombiana
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Valida si un comprobante está balanceado
 */
export function isVoucherBalanced(totalDebit: number, totalCredit: number): boolean {
  return Math.abs(totalDebit - totalCredit) < 0.01
}
```

---

## 📦 PAQUETES NPM NECESARIOS

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.292.0",
    "react-hot-toast": "^2.4.1",
    "recharts": "^2.9.0",
    "@tanstack/react-table": "^8.10.0",
    "date-fns": "^2.30.0",
    "react-select": "^5.8.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0"
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Estructura Base (1 semana)**
- [ ] Crear estructura de carpetas
- [ ] Definir tipos TypeScript
- [ ] Crear servicios API
- [ ] Configurar rutas en app/
- [ ] Crear componentes base

### **Fase 2: Plan de Cuentas (3 días)**
- [ ] AccountTree component
- [ ] AccountForm component
- [ ] AccountSearch component
- [ ] Vista principal
- [ ] Integración con API

### **Fase 3: Comprobantes (1 semana)**
- [ ] ComprobanteForm component
- [ ] MovimientoRow component
- [ ] TerceroSelector component
- [ ] CuentaSelector component
- [ ] Validaciones de balance
- [ ] Vista principal

### **Fase 4: Terceros (3 días)**
- [ ] TerceroForm component
- [ ] EstadoCuenta component
- [ ] Integración con Contact existente
- [ ] Vista principal

### **Fase 5: Reportes (1 semana)**
- [ ] Balance de Prueba
- [ ] Libro Diario
- [ ] Libro Mayor
- [ ] Exportar a Excel/PDF

---

**Tiempo total estimado:** 3-4 semanas  
**Desarrolladores necesarios:** 1-2  
**Archivos a crear:** ~40-50 archivos
