// Types for POS Module

import { ProductType } from '@/types/apps/productType'

// Contact Types
export enum ContactType {
    LEAD = 'LEAD',
    POTENTIAL_CUSTOMER = 'POTENTIAL_CUSTOMER',
    CUSTOMER = 'CUSTOMER',
    SUPPLIER = 'SUPPLIER',
    OTHER = 'OTHER'
}

export interface Contact {
    id: number
    name: string
    email?: string
    phone?: string
    address?: string
    taxId?: string
    type: ContactType
    tenantId: number
}

// Order Types
export interface OrderItem {
    productId: number
    quantity: number
    discount: number
}

export interface OrderItemRequest {
    productId: number
    quantity: number
    discount: number
}

export interface OrderRequest {
    tenantId: number
    customerId: number | null
    items: OrderItemRequest[]
    paymentMethod: PaymentMethod
    tax: number
    discount: number
    createdBy?: string
}

export interface OrderItemResponse {
    id: number
    productId: number
    productName: string
    sku: string
    barcode: string
    unitPrice: number
    quantity: number
    discount: number
    subtotal: number
}

export interface OrderResponse {
    id: number
    tenantId: number
    customerId?: number | null
    invoiceNumber: string
    subtotal: number
    tax: number
    discount: number
    total: number
    paymentMethod: string
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED'
    createdBy?: number
    items: OrderItemResponse[]
    createdAt: string
    updatedAt: string
}

// Local Cart Types (Frontend)
export interface CartItem extends ProductType {
    quantity: number
    discount: number
}

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER'

// Legacy types (for backward compatibility)
export type Product = ProductType
export interface Order {
    items: Array<{
        productId: number
        quantity: number
        price: number
    }>
    total: number
    paymentMethod: string
    timestamp: string
}
