export type PipelineType = 'SALES' | 'SUPPORT' | 'MARKETING' | 'CUSTOM'

export interface Stage {
    id: number
    name: string
    color?: string
    position: number
    pipelineId: number
    description?: string
    isInitial?: boolean
    isFinal?: boolean
    outcome?: 'OPEN' | 'WON' | 'LOST'
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
    stages?: Stage[]
}

export interface PipelineKanbanCard {
    conversationId: string
    name: string
    avatarUrl?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    stage: string
    contactId?: number
    lastMessage?: string
    updatedAt: string
}

export interface MoveConversationDto {
    conversationId: string
    contactId?: number
    toStageId: number
    reason?: string
}
