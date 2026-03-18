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
  }
};
