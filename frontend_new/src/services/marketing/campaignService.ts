import { axiosInstance } from '@/utils/axiosInstance';
import { Campaign } from '@/types/marketing/campaignTypes';

export const campaignService = {
  getAll: async (): Promise<Campaign[]> => {
    const response = await axiosInstance.get('/api/v1/marketing/campaigns');
    return response.data;
  },

  getById: async (id: number): Promise<Campaign> => {
    const response = await axiosInstance.get(`/api/v1/marketing/campaigns/${id}`);
    return response.data;
  },

  create: async (data: Partial<Campaign>): Promise<Campaign> => {
    const response = await axiosInstance.post('/api/v1/marketing/campaigns', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Campaign>): Promise<Campaign> => {
    const response = await axiosInstance.put(`/api/v1/marketing/campaigns/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Campaign> => {
    const response = await axiosInstance.patch(`/api/v1/marketing/campaigns/${id}/status`, { status });
    return response.data;
  }
};
