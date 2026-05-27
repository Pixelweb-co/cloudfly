import { axiosInstance } from '@/utils/axiosInstance';
import { SendingList } from '@/types/marketing/sendingListTypes';

export const sendingListService = {
  getAll: async (): Promise<SendingList[]> => {
    const response = await axiosInstance.get('/api/v1/marketing/lists');
    return response.data;
  },

  getById: async (id: number): Promise<SendingList> => {
    const response = await axiosInstance.get(`/api/v1/marketing/lists/${id}`);
    return response.data;
  },

  create: async (data: Partial<SendingList>): Promise<SendingList> => {
    const response = await axiosInstance.post('/api/v1/marketing/lists', data);
    return response.data;
  },

  update: async (id: number, data: Partial<SendingList>): Promise<SendingList> => {
    const response = await axiosInstance.put(`/api/v1/marketing/lists/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/marketing/lists/${id}`);
  },

  addContact: async (listId: number, contactId: number): Promise<void> => {
    await axiosInstance.post(`/api/v1/marketing/lists/${listId}/contacts/${contactId}`);
  },

  removeContact: async (listId: number, contactId: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/marketing/lists/${listId}/contacts/${contactId}`);
  },

  getContacts: async (listId: number): Promise<Contact[]> => {
    const response = await axiosInstance.get(`/api/v1/marketing/lists/${listId}/contacts`);
    return response.data;
  }
};
