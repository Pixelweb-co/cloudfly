export interface PlanValues {
    name: string
    description: string
    price: number
    durationDays: number
    isActive?: boolean
    aiTokensLimit?: number
    electronicDocsLimit?: number
    usersLimit?: number
    allowOverage?: boolean
    aiOveragePricePer1k?: number
    docOveragePriceUnit?: number
    moduleIds?: number[]
}

export interface PlanResponse extends PlanValues {
    id: number
    createdAt: string
    updatedAt: string
    moduleNames?: string[]
}

export type PlanCreateRequest = Omit<PlanValues, 'isActive'>
