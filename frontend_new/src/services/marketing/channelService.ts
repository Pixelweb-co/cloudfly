import axios from 'axios';
import { Channel } from '@/types/marketing';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/v1/marketing/channels';

export const channelService = {
  getChannels: async (accessToken: string) => {
    const response = await axios.get<Channel[]>(API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  createChannel: async (channel: Channel, accessToken: string) => {
    const response = await axios.post<Channel>(API_URL, channel, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  getChannelById: async (id: number, accessToken: string) => {
    const response = await axios.get<Channel>(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  getChannelConfigStatus: async (accessToken: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/channel-config/status`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  activateWhatsAppChannel: async (accessToken: string) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/channel-config/activate`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  saveChannelConfig: async (config: any, accessToken: string) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/channel-config/config`, config, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },
  
  deleteChannel: async (id: number, accessToken: string) => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }
};
