export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED'

export type InvoiceItemType = {
    id?: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
    tax: number
    total: number
    // DIAN fields
    descriptionDian?: string
    unitMeasure?: string
    taxRate?: number
}

export type InvoiceType = {
    id: number
    tenantId: number
    customerId: number | null
    customerName?: string
    orderId?: number
    invoiceNumber: string
    issueDate: string
    dueDate: string | null
    status: InvoiceStatus
    subtotal: number
    tax: number
    discount: number
    total: number
    notes: string | null
    createdBy: number
    items: InvoiceItemType[]
    // DIAN fields
    cufe?: string
    qrCode?: string
    dianStatus?: string // PENDING, SENT, ACCEPTED, REJECTED
    dianResponse?: string
    paymentMeans?: string
    paymentMethod?: string
}
