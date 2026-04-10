import axios from 'axios';

const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://chat.cloudfly.com.co';

export interface ChatMessage {
  id: string | number;
  conversationId: string | number;
  contactId?: number;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  mediaUrl?: string;
  content?: string; // Support for legacy field from socket service
  sentAt: string;
  status?: string;
  createdAt?: string; // Support for legacy field
}

export const chatService = {
  /**
   * Get historical messages for a conversation
   * NEW: Points to chat.cloudfly.com.co directly for history
   */
  getMessages: async (contactUuid: string, tenantId: string | number): Promise<ChatMessage[]> => {
    const response = await axios.get(`${CHAT_API_URL}/api/chat/messages/${contactUuid}`, {
      params: { tenantId, limit: 50 }
    });
    
    // Normalize response: if it uses 'content' instead of 'body'
    return response.data.map((msg: any) => ({
      ...msg,
      body: msg.body || msg.content,
      sentAt: msg.sentAt || msg.createdAt || new Date().toISOString()
    }));
  },

  /**
   * Send a new message via the Java API (consistent with current backend flow)
   */
  sendMessage: async (data: {
    conversationId: string | number; // This is the phone
    contactId: number; 
    body: string;
    messageType?: string;
    mediaUrl?: string;
    platform?: string;
  }): Promise<ChatMessage> => {
    // Dynamic import to avoid circular dependency or issues with axiosInstance initial load
    const { axiosInstance } = await import('@/utils/axiosInstance');
    const response = await axiosInstance.post(`/api/v1/chat/send/${data.conversationId}`, {
      ...data,
      direction: 'OUTBOUND'
    });
    return response.data;
  }
};

