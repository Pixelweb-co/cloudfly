export type ChatbotType = 'SALES' | 'SUPPORT' | 'SCHEDULING'

export interface ChatbotConfig {
    id?: number
    tenantId?: number
    instanceName: string
    chatbotType: ChatbotType
    isActive: boolean
    n8nWebhookUrl: string
    context: string
    apiKey?: string
    qrCode?: string
}
