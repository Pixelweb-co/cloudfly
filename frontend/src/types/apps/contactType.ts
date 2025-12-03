// Contact Type Definition
export type ContactType = {
    id: number
    name: string
    email: string | null
    phone: string | null
    address: string | null
    taxId: string | null
    type: 'LEAD' | 'POTENTIAL_CUSTOMER' | 'CUSTOMER' | 'SUPPLIER' | 'OTHER'
    tenantId: number
    createdAt?: string
    updatedAt?: string
}

export type ContactTypeWithAction = ContactType & {
    action?: string
}
