import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/agents`;

export const agentService = {
  // Global Templates
  getTemplates: async (accessToken: string) => {
    const response = await axios.get(`${API_URL}/templates`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  createTemplate: async (template: any, accessToken: string) => {
    const response = await axios.post(`${API_URL}/templates`, template, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  // Tenant Personalization
  getMyAgents: async (accessToken: string) => {
    const response = await axios.get(`${API_URL}/my-agents`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  personalize: async (config: any, accessToken: string) => {
    const response = await axios.post(`${API_URL}/personalize`, config, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  updatePersonalization: async (id: number, config: any, accessToken: string) => {
    const response = await axios.put(`${API_URL}/personalize/${id}`, config, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }
};
