// types/apps/contabilidadTypes.ts

// ============== ENUMS ==============

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

export enum AccountNature {
    DEBITO = 'DEBITO',
    CREDITO = 'CREDITO'
}

// ============== LIBRO DIARIO ==============

export interface LibroDiarioRow {
    date: string
    voucherType: VoucherType
    voucherNumber: string
    voucherId: number
    accountCode: string
    accountName: string
    thirdPartyId?: number
    thirdPartyName?: string
    description: string
    debitAmount: number
    creditAmount: number
}

export interface LibroDiarioDTO {
    fromDate: string
    toDate: string
    entries: LibroDiarioRow[]
    totalDebit: number
    totalCredit: number
    totalEntries: number
}

// ============== LIBRO MAYOR ==============

export interface LibroMayorRow {
    date: string
    voucherType: VoucherType
    voucherNumber: string
    voucherId: number
    description: string
    thirdPartyId?: number
    thirdPartyName?: string
    debitAmount: number
    creditAmount: number
    balance: number
}

export interface LibroMayorDTO {
    accountCode: string
    accountName: string
    nature: AccountNature
    fromDate: string
    toDate: string
    initialBalance: number
    entries: LibroMayorRow[]
    totalDebit: number
    totalCredit: number
    finalBalance: number
    totalEntries: number
}

// ============== BALANCE GENERAL ==============

export interface BalanceAccount {
    code: string
    name: string
    balance: number
    level: number
}

export interface BalanceSection {
    name: string
    accounts: BalanceAccount[]
    total: number
}

export interface BalanceGeneralDTO {
    asOfDate: string
    activosCorrientes: BalanceSection
    activosNoCorrientes: BalanceSection
    pasivosCorrientes: BalanceSection
    pasivosNoCorrientes: BalanceSection
    patrimonio: BalanceSection
    totalActivos: number
    totalPasivos: number
    totalPatrimonio: number
}

// ============== ESTADO DE RESULTADOS ==============

export interface EstadoResultadosDTO {
    fromDate: string
    toDate: string
    ingresosOperacionales: number
    ingresosNoOperacionales: number
    totalIngresos: number
    costoVentas: number
    utilidadBruta: number
    gastosOperacionales: number
    gastosNoOperacionales: number
    totalGastos: number
    utilidadNeta: number
}

// ============== FILTERS ==============

export interface ReportFilters {
    fromDate: Date | null
    toDate: Date | null
    voucherType?: VoucherType
    accountCode?: string
}
