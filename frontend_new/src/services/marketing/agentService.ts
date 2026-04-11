import axiosInstance from '@/utils/axiosInstance';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/agents`;

export const agentService = {
  // Global Templates
  getTemplates: async () => {
    const response = await axiosInstance.get('/api/v1/agents/templates');
    return response.data;
  },

  createTemplate: async (template: any) => {
    const response = await axiosInstance.post('/api/v1/agents/templates', template);
    return response.data;
  },

  // Tenant Personalization
  getMyAgents: async () => {
    const response = await axiosInstance.get('/api/v1/agents/my-agents');
    return response.data;
  },

  personalize: async (config: any) => {
    const response = await axiosInstance.post('/api/v1/agents/personalize', config);
    return response.data;
  },

  updatePersonalization: async (id: number, config: any) => {
    const response = await axiosInstance.put(`/api/v1/agents/personalize/${id}`, config);
    return response.data;
  }
};
