/**
 * Tipos TypeScript para el módulo DIAN
 * Frontend - Cloudfly ERP
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum DianDocumentType {
    INVOICE = 'INVOICE',
    CREDIT_NOTE = 'CREDIT_NOTE',
    DEBIT_NOTE = 'DEBIT_NOTE',
    SUPPORT_DOCUMENT = 'SUPPORT_DOCUMENT',
    PAYROLL = 'PAYROLL'
}

export enum DianEnvironment {
    TEST = 'TEST',
    PRODUCTION = 'PRODUCTION'
}

export enum CertificateType {
    P12 = 'P12',
    PEM = 'PEM'
}

// ============================================================================
// INTERFACES - Operation Modes
// ============================================================================

export interface DianOperationMode {
    id: number
    tenantId: number
    companyId: number
    documentType: DianDocumentType
    environment: DianEnvironment
    softwareId: string
    pin: string
    testSetId?: string | null
    certificationProcess: boolean
    active: boolean
    createdAt: string
    updatedAt: string
}

export interface DianOperationModeRequest {
    companyId: number
    documentType: DianDocumentType
    environment: DianEnvironment
    softwareId: string
    pin: string
    testSetId?: string
    certificationProcess?: boolean
    active?: boolean
}

// ============================================================================
// INTERFACES - Certificates
// ============================================================================

export interface DianCertificate {
    id: number
    tenantId: number
    companyId: number
    alias: string
    type: CertificateType
    issuer?: string | null
    subject?: string | null
    serialNumber?: string | null
    validFrom?: string | null
    validTo?: string | null
    active: boolean
    isValid: boolean
    createdAt: string
    updatedAt: string
}

export interface DianCertificateRequest {
    companyId: number
    alias: string
    type: CertificateType
    password: string
    active?: boolean
}

// ============================================================================
// INTERFACES - Resolutions
// ============================================================================

export interface DianResolution {
    id: number
    tenantId: number
    companyId: number
    documentType: DianDocumentType
    prefix: string
    numberRangeFrom: number
    numberRangeTo: number
    currentNumber: number
    technicalKey: string
    resolutionNumber?: string | null
    validFrom: string  // LocalDate as string
    validTo: string    // LocalDate as string
    active: boolean
    isValid: boolean
    remainingNumbers: number
    createdAt: string
    updatedAt: string
}

export interface DianResolutionRequest {
    companyId: number
    documentType: DianDocumentType
    prefix: string
    numberRangeFrom: number
    numberRangeTo: number
    technicalKey: string
    resolutionNumber?: string
    validFrom: string  // formato: YYYY-MM-DD
    validTo: string    // formato: YYYY-MM-DD
    active?: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

export const DocumentTypeLabels: Record<DianDocumentType, string> = {
    [DianDocumentType.INVOICE]: 'Factura de Venta',
    [DianDocumentType.CREDIT_NOTE]: 'Nota Crédito',
    [DianDocumentType.DEBIT_NOTE]: 'Nota Débito',
    [DianDocumentType.SUPPORT_DOCUMENT]: 'Documento Soporte',
    [DianDocumentType.PAYROLL]: 'Nómina Electrónica'
}

export const EnvironmentLabels: Record<DianEnvironment, string> = {
    [DianEnvironment.TEST]: 'Pruebas/Habilitación',
    [DianEnvironment.PRODUCTION]: 'Producción'
}

export const CertificateTypeLabels: Record<CertificateType, string> = {
    [CertificateType.P12]: 'PKCS#12 (.p12, .pfx)',
    [CertificateType.PEM]: 'PEM (.pem)'
}
