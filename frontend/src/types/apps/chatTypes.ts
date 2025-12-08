// Tipos para el módulo de Chat Omnicanal

export type MessageDirection = 'INBOUND' | 'OUTBOUND'

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'CONTACT'
  | 'STICKER'

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export type MessagePlatform = 'WHATSAPP' | 'FACEBOOK_MESSENGER' | 'INSTAGRAM_DM' | 'TELEGRAM'

export type ContactStage = 'LEAD' | 'POTENTIAL' | 'CLIENT'

export interface Message {
  id: number
  conversationId: string
  contactId?: number
  direction: MessageDirection
  messageType: MessageType
  body?: string
  mediaUrl?: string
  title?: string
  displayName?: string
  status: MessageStatus
  sentAt: string
  deliveredAt?: string
  readAt?: string
  createdAt: string
  externalMessageId?: string
  externalQuotedMessageId?: string
}

export interface ContactCard {
  contactId: number
  name: string
  avatarUrl?: string
  externalId: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  stage: ContactStage
  conversationId: string
  platform: MessagePlatform
}

export interface ContactGroup {
  groups: {
    LEAD: ContactCard[]
    POTENTIAL: ContactCard[]
    CLIENT: ContactCard[]
  }
}

export interface SendMessageRequest {
  conversationId: string
  tenantId: number
  fromUserId?: number
  direction: MessageDirection
  messageType?: MessageType
  body?: string
  mediaUrl?: string
  title?: string
  externalQuotedMessageId?: string
}
