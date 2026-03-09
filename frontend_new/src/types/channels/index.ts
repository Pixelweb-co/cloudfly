// Types for Channels Module

export type ChannelType = 'whatsapp' | 'facebook' | 'instagram' | 'tiktok'

export interface Channel {
    id: string
    type: ChannelType
    name: string
    isActive: boolean
    isConnected: boolean
    phoneNumber?: string
    pageId?: string
    username?: string
    lastSync?: string
    icon: string
    color: string
    description: string
}

export interface ChannelDTO {
    id: number
    customerId: number
    type: string // Backend usa WHATSAPP, FACEBOOK, etc.
    name: string
    isActive: boolean
    isConnected: boolean
    phoneNumber?: string
    pageId?: string
    username?: string
    instanceName?: string
    webhookUrl?: string
    lastSync?: string
    lastError?: string
    createdAt: string
    updatedAt: string
}

export interface ChannelCreateRequest {
    type: string
    name: string
    phoneNumber?: string
    pageId?: string
    username?: string
    accessToken?: string
    instanceName?: string
    webhookUrl?: string
    apiKey?: string
    configuration?: string
}

export interface ChatbotConfig {
    phoneNumber: string
    agentName: string
    context: string
    isActive: boolean
}

export interface AvailableChannel {
    type: ChannelType
    name: string
    icon: string
    color: string
    description: string
}
