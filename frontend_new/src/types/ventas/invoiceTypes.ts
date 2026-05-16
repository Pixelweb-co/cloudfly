export type InvoiceStatus = 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'VENCIDA'
export type BillingType = 'PAGO_UNICO' | 'RECURRENTE'
export type BillingPeriod = 'MENSUAL' | 'SEMESTRAL' | 'ANUAL'


export type InvoiceType = {
    id: number
    tenantId: number
    subscriptionId?: number
    invoiceNumber: string
    issueDate: string
    dueDate: string
    status: InvoiceStatus
    billingType: BillingType
    billingPeriod?: BillingPeriod

    subtotal: number
    tax: number
    total: number
    currency: string
    pdfUrl?: string
    billingPeriodStart?: string
    billingPeriodEnd?: string
    createdAt: string
    updatedAt: string
}
