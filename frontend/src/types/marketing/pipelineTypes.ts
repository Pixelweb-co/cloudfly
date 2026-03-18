export type PipelineType = 'MARKETING' | 'SALES' | 'SUPPORT' | 'CUSTOM'
export type PipelineStageOutcome = 'WON' | 'LOST' | 'OPEN'
export type ConversationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface PipelineStage {
    id: number
    name: string
    description?: string
    color: string
    position: number
    isInitial: boolean
    isFinal: boolean
    outcome: PipelineStageOutcome
    timeoutHours?: number
}

export interface Pipeline {
    id: number
    name: string
    description?: string
    type: PipelineType
    color: string
    icon?: string
    isActive: boolean
    isDefault: boolean
    displayOrder: number
    stages: PipelineStage[]
    createdAt: string
}

export interface ConversationPipelineState {
    id: number
    conversationId: string
    contactId?: number
    pipelineId: number
    pipelineName: string
    currentStageId: number
    currentStageName: string
    stageColor: string
    priority: ConversationPriority
    enteredStageAt: string
    isActive: boolean
}

export interface PipelineCreateRequest {
    name: string
    description?: string
    type: PipelineType
    color: string
    icon?: string
    isDefault: boolean
    displayOrder?: number
    stages: PipelineStageCreateRequest[]
}

export interface PipelineStageCreateRequest {
    name: string
    description?: string
    color: string
    position: number
    isInitial: boolean
    isFinal: boolean
    outcome: PipelineStageOutcome
    timeoutHours?: number
}

export interface MoveConversationRequest {
    contactId?: number
    conversationId?: string
    toStageId: number
    reason?: string
}

export interface PipelineKanbanCard {
    contactId?: number
    name: string
    avatarUrl?: string
    conversationId: string
    stage: string
    priority: ConversationPriority
}

export type PipelineKanbanData = Record<string, PipelineKanbanCard[]>

export interface PipelineMetrics {
    totalPipelines: number
    activePipelines: number
    defaultPipelines: number
    totalConversations: number
}
