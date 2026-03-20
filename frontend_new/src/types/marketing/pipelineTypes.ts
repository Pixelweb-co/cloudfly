export interface Stage {
    id: number
    name: string
    color?: string
    order: number
    pipelineId: number
}

export interface Pipeline {
    id: number
    name: string
    description?: string
    color?: string
    type: string
    isActive: boolean
    isDefault: boolean
    customerId: number
    companyId: number
    createdAt: string
    updatedAt: string
    stages?: Stage[]
}

export interface CreatePipelineDto {
    name: string
    description?: string
    color?: string
    type: string
    isActive?: boolean
    isDefault?: boolean
}
