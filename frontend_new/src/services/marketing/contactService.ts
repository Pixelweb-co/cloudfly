import { axiosInstance } from '@/utils/axiosInstance';
import { Contact, ContactCreateRequest } from '@/types/marketing/contactTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co';

export const contactService = {
  getAllContacts: async (tenantId?: number, companyId?: number): Promise<Contact[]> => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId.toString());
    if (companyId) params.append('companyId', companyId.toString());
    
    const url = `/api/v1/contacts${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getContactById: async (id: number, companyId?: number): Promise<Contact> => {
    const url = `/api/v1/contacts/${id}${companyId ? `?companyId=${companyId}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  createContact: async (contact: ContactCreateRequest, companyId?: number): Promise<Contact> => {
    const url = `/api/v1/contacts${companyId ? `?companyId=${companyId}` : ''}`;
    const response = await axiosInstance.post(url, contact);
    return response.data;
  },

  updateContact: async (id: number, contact: ContactCreateRequest, companyId?: number): Promise<Contact> => {
    const url = `/api/v1/contacts/${id}${companyId ? `?companyId=${companyId}` : ''}`;
    const response = await axiosInstance.put(url, contact);
    return response.data;
  },

  deleteContact: async (id: number, companyId?: number): Promise<void> => {
    const url = `/api/v1/contacts/${id}${companyId ? `?companyId=${companyId}` : ''}`;
    await axiosInstance.delete(url);
  },

  checkPhoneAvailability: async (phone: string, companyId?: number): Promise<boolean> => {
    const params = new URLSearchParams();
    params.append('phone', phone);
    if (companyId) params.append('companyId', companyId.toString());
    
    const url = `/api/v1/contacts/check-phone?${params.toString()}`;
    const response = await axiosInstance.get(url);
    return response.data; // returns true if exists
  }
};
