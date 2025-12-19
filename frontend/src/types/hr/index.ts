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
    status: 'OPEN' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CLOSED'
    description?: string
    periodName: string
    workingDays: number
}

export interface PayrollReceipt {
    id: number
    employeeId: number
    employeeName: string
    periodId: number
    periodName: string
    receiptNumber: string
    calculationDate: string

    regularDays: number
    absenceDays: number
    overtimeHours: number

    baseSalary: number
    dailySalary: number

    totalPerceptions: number
    totalDeductions: number
    netPay: number

    isrAmount: number
    imssAmount: number

    status: 'CALCULATED' | 'APPROVED' | 'STAMPED' | 'PAID' | 'CANCELLED'
    uuid?: string
    isPaid: boolean
    isStamped: boolean
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
}
