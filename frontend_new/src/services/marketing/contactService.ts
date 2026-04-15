import { axiosInstance } from '@/utils/axiosInstance';
import { Contact, ContactCreateRequest } from '@/types/marketing/contactTypes';

export const contactService = {
  getAllContacts: async (): Promise<Contact[]> => {
    // El backend resuelve automáticamente tenant y company vía token/headers
    const url = `/api/v1/contacts`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getContactById: async (id: number): Promise<Contact> => {
    const url = `/api/v1/contacts/${id}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  createContact: async (contact: ContactCreateRequest): Promise<Contact> => {
    const url = `/api/v1/contacts`;
    const response = await axiosInstance.post(url, contact);
    return response.data;
  },

  updateContact: async (id: number, contact: ContactCreateRequest): Promise<Contact> => {
    const url = `/api/v1/contacts/${id}`;
    const response = await axiosInstance.put(url, contact);
    return response.data;
  },

  deleteContact: async (id: number): Promise<void> => {
    const url = `/api/v1/contacts/${id}`;
    await axiosInstance.delete(url);
  },

  checkPhoneAvailability: async (phone: string): Promise<boolean> => {
    const url = `/api/v1/contacts/check-phone?phone=${phone}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  checkEmailAvailability: async (email: string): Promise<boolean> => {
    const url = `/api/v1/contacts/check-email?email=${email}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
};
