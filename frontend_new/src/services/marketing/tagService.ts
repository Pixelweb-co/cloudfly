import { axiosInstance } from '@/utils/axiosInstance';
import { Tag } from '@/types/marketing/contactTypes';

export const tagService = {
  getAllTags: async (): Promise<Tag[]> => {
    const url = `/api/v1/crm/tags`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  createTag: async (tag: { name: string; color: string }): Promise<Tag> => {
    const url = `/api/v1/crm/tags`;
    const response = await axiosInstance.post(url, tag);
    return response.data;
  },

  updateTag: async (id: number, tag: { name: string; color: string }): Promise<Tag> => {
    const url = `/api/v1/crm/tags/${id}`;
    const response = await axiosInstance.put(url, tag);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    const url = `/api/v1/crm/tags/${id}`;
    await axiosInstance.delete(url);
  },

  getContactTags: async (contactId: number): Promise<Tag[]> => {
    const url = `/api/v1/crm/contacts/${contactId}/tags`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  associateTags: async (contactId: number, tagIds: number[]): Promise<void> => {
    const url = `/api/v1/crm/contacts/${contactId}/tags`;
    await axiosInstance.post(url, { tagIds });
  },

  disassociateTag: async (contactId: number, tagId: number): Promise<void> => {
    const url = `/api/v1/crm/contacts/${contactId}/tags/${tagId}`;
    await axiosInstance.delete(url);
  }
};
