export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export type QuoteItemType = {
    id?: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
    tax: number
    total: number
}

export type QuoteType = {
    id: number
    tenantId: number
    customerId: number | null
    customerName?: string
    quoteNumber: string
    quoteDate: string
    expirationDate: string | null
    status: QuoteStatus
    subtotal: number
    tax: number
    discount: number
    total: number
    notes: string | null
    terms: string | null
    createdBy: number
    items: QuoteItemType[]
}
