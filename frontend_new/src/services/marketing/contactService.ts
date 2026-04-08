import axios from 'axios';
import { Contact, ContactCreateRequest } from '@/types/marketing/contactTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co';

export const contactService = {
  getAllContacts: async (tenantId?: number, companyId?: number): Promise<Contact[]> => {
    const params: any = {};
    if (tenantId) params.tenantId = tenantId;
    if (companyId) params.companyId = companyId;
    
    const response = await axios.get(`${API_URL}/api/v1/contacts`, { params });
    return response.data;
  },

  getContactById: async (id: number, companyId?: number): Promise<Contact> => {
    const params = companyId ? { companyId } : {};
    const response = await axios.get(`${API_URL}/api/v1/contacts/${id}`, { params });
    return response.data;
  },

  createContact: async (contact: ContactCreateRequest, companyId?: number): Promise<Contact> => {
    const params = companyId ? { companyId } : {};
    const response = await axios.post(`${API_URL}/api/v1/contacts`, contact, { params });
    return response.data;
  },

  updateContact: async (id: number, contact: ContactCreateRequest, companyId?: number): Promise<Contact> => {
    const params = companyId ? { companyId } : {};
    const response = await axios.put(`${API_URL}/api/v1/contacts/${id}`, contact, { params });
    return response.data;
  },

  deleteContact: async (id: number, companyId?: number): Promise<void> => {
    const params = companyId ? { companyId } : {};
    await axios.delete(`${API_URL}/api/v1/contacts/${id}`, { params });
  }
};
