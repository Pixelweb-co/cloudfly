export type ChatbotType = 'SALES' | 'SUPPORT' | 'SCHEDULING' | 'SUBSCRIPTIONS'

export interface ChatbotConfig {
    id?: number
    tenantId?: number
    instanceName: string
    chatbotType: ChatbotType
    isActive: boolean
    n8nWebhookUrl: string
    context: string
    agentName?: string
    phoneNumber?: string
    apiKey?: string
    qrCode?: string
}

export interface ChatbotTypeConfig {
    id?: number
    typeName: string
    description: string
    webhookUrl: string
    status: boolean
    createdAt?: string
    updatedAt?: string
}
