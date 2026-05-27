import axiosInstance from '@/utils/axiosInstance';
import { Channel } from '@/types/marketing';

export const channelService = {
  getChannels: async () => {
    const response = await axiosInstance.get<Channel[]>('/api/v1/marketing/channels');
    return response.data;
  },

  createChannel: async (channel: Channel) => {
    const response = await axiosInstance.post<Channel>('/api/v1/marketing/channels', channel);
    return response.data;
  },

  getChannelById: async (id: number) => {
    const response = await axiosInstance.get<Channel>(`/api/v1/marketing/channels/${id}`);
    return response.data;
  },

  getChannelConfigStatus: async () => {
    const response = await axiosInstance.get('/api/channel-config/status');
    return response.data;
  },

  activateWhatsAppChannel: async () => {
    const response = await axiosInstance.post('/api/channel-config/activate', {});
    return response.data;
  },

  getWhatsAppQrCode: async () => {
    const response = await axiosInstance.get('/api/channel-config/qr');
    return response.data;
  },

  saveChannelConfig: async (config: any) => {
    const response = await axiosInstance.post('/api/channel-config/config', config);
    return response.data;
  },
  
  deleteChannel: async (id: number) => {
    await axiosInstance.delete(`/api/v1/marketing/channels/${id}`);
  }
};
