export type ChannelConfigType = 'SALES' | 'SUPPORT' | 'SCHEDULING' | 'SUBSCRIPTIONS' | 'AI' | 'FLOW'

export interface ChannelConfig {
    id?: number
    tenantId?: number
    instanceName: string
    channelType: ChannelConfigType
    isActive: boolean
    n8nWebhookUrl: string
    context: string
    agentName?: string
    phoneNumber?: string
    apiKey?: string
    qrCode?: string
}

export interface ChannelTypeConfig {
    id?: number
    typeName: string
    description: string
    webhookUrl: string
    status: boolean
    createdAt?: string
    updatedAt?: string
}

