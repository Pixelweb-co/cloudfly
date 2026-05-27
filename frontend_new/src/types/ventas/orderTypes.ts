export type OrderStatus = 'PROCESANDO' | 'DESPACHADO' | 'ENTREGADO' | 'FACTURADO'

export type OrderItemType = {
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

export type OrderType = {
    id: number
    tenantId: number
    customerId: number | null
    customerName?: string
    orderNumber: string
    orderDate: string
    expirationDate: string | null
    status: OrderStatus
    subtotal: number
    tax: number
    discount: number
    total: number
    notes: string | null
    terms: string | null
    createdBy: number
    items: OrderItemType[]
}
