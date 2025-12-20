// Types for HR & Payroll Module

export interface Employee {
    id: number
    firstName: string
    lastName: string
    fullName: string
    rfc?: string
    curp?: string
    nationalId?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    birthDate?: string

    employeeNumber?: string
    hireDate: string
    terminationDate?: string
    department?: string
    jobTitle?: string
    contractType?: string

    baseSalary: number
    paymentFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHECK'

    bankName?: string
    bankAccount?: string
    clabe?: string

    // Seguridad Social (Colombia)
    nss?: string // Número de Seguro Social
    eps?: string // EPS (Entidad Promotora de Salud)
    arl?: string // ARL (Administradora de Riesgos Laborales)
    afp?: string // AFP (Fondo de Pensiones)
    cesantiasBox?: string // Caja de Cesantías

    // Tipo de Salario y Prestaciones (Colombia)
    salaryType?: 'ORDINARIO' | 'INTEGRAL'
    hasTransportAllowance?: boolean
    contractTypeEnum?: 'INDEFINIDO' | 'FIJO' | 'OBRA_LABOR' | 'TEMPORAL' | 'APRENDIZAJE' | 'PRESTACION_SERVICIOS'

    // Campos adicionales para nómina Colombia
    arlRiskLevel?: 'RIESGO_I' | 'RIESGO_II' | 'RIESGO_III' | 'RIESGO_IV' | 'RIESGO_V'
    cajaCompensacion?: string
    workSchedule?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HORAS'
    monthlyWorkedDays?: number
    hasFamilySubsidy?: boolean

    isActive: boolean
    notes?: string
}

export interface EmployeeCreate {
    firstName: string
    lastName: string
    rfc?: string
    curp?: string
    nationalId?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    birthDate?: string

    employeeNumber?: string
    hireDate: string
    terminationDate?: string
    department?: string
    jobTitle?: string
    contractType?: string

    baseSalary: number
    paymentFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CHECK'

    bankName?: string
    bankAccount?: string
    clabe?: string

    isActive?: boolean
    notes?: string
}

export interface PayrollConcept {
    id: number
    conceptType: 'PERCEPCION' | 'DEDUCCION'
    code: string
    name: string
    description?: string
    satCode?: string
    isTaxable: boolean
    isImssSubject: boolean
    calculationFormula?: string
    isSystemConcept: boolean
    isActive: boolean
}

export interface PayrollPeriod {
    id: number
    periodType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    periodNumber: number
    year: number
    startDate: string
    endDate: string
    paymentDate: string
    status: 'OPEN' | 'LIQUIDATED' | 'PARTIALLY_PAID' | 'PAID' | 'CLOSED'
    description?: string
    periodName: string
    workingDays: number
    // Empleados asignados
    employeeIds?: number[]
    employeeCount?: number
    // Totales de nómina
    totalPayroll?: number
    elapsedPayroll?: number
}

export interface DevengosDTO {
    salario: number
    horasExtras: number
    comisiones: number
    auxilioTransporte: number
    bonos: number
    otros: number
    total: number
}

export interface DeduccionesDTO {
    salud: number
    pension: number
    otras: number
    total: number
}

export interface CostosEmpleadorDTO {
    saludEmpleador: number
    pensionEmpleador: number
    arl: number
    sena: number
    icbf: number
    cajaCompensacion: number
    total: number
}

export interface ProvisionesDTO {
    prima: number
    cesantias: number
    interesesCesantias: number
    vacaciones: number
    total: number
}

export interface PayrollReceipt {
    id: number
    employeeId: number
    employeeName: string
    employeeEmail?: string
    periodId: number
    periodName: string
    receiptNumber: string
    calculationDate: string

    // Días trabajados
    regularDays: number
    absenceDays: number
    overtimeHours: number

    // Salarios base
    baseSalary: number
    dailySalary: number

    // Detalle
    devengos?: DevengosDTO
    deducciones?: DeduccionesDTO
    costosEmpleador?: CostosEmpleadorDTO
    provisiones?: ProvisionesDTO

    // Totales
    totalPerceptions: number
    totalDeductions: number
    netPay: number
    totalEmployerCosts?: number
    totalProvisions?: number
    totalCost?: number

    status: 'PENDING' | 'PAID' | 'CANCELLED'
    paidAt?: string
    paymentReference?: string
    paymentMethod?: string
    notes?: string

    // Archivos
    pdfPath?: string

    // Auxiliares
    isPaid: boolean
}

// ... (PageResponse existing content)
export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
}

export interface LiquidationResult {
    periodId: number
    status: string
    receiptsGenerated: number
    totalNetPay: number
    liquidatedAt?: string
    // Optional fields if backend sends them
    totalEmployees?: number
    noveltiesProcessed?: number
}

export interface PaymentRequest {
    paymentReference: string
    paymentMethod: string
    notes?: string
}

