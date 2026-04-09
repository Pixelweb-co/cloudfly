import { axiosInstance } from '@/utils/axiosInstance';

export interface ChatMessage {
  id: string | number;
  conversationId: string | number;
  contactId?: number;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  mediaUrl?: string;
  sentAt: string;
  status?: string;
}

export const chatService = {
  /**
   * Get historical messages for a conversation
   */
  getMessages: async (conversationId: string | number): Promise<ChatMessage[]> => {
    const response = await axiosInstance.get(`/api/v1/chat/messages/${conversationId}`);
    return response.data;
  },

  /**
   * Send a new message via the Java API (which then talks to Evolution API)
   */
  sendMessage: async (data: {
    conversationId: string | number;
    body: string;
    messageType?: string;
    mediaUrl?: string;
    platform?: string;
  }): Promise<ChatMessage> => {
    const response = await axiosInstance.post(`/api/v1/chat/send/${data.conversationId}`, {
      ...data,
      direction: 'OUTBOUND'
    });
    return response.data;
  }
};
