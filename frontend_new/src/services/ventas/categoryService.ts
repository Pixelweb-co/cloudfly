import { axiosInstance } from '@/utils/axiosInstance';
import { Category } from '@/types/ventas/productTypes';
import { userMethods } from '@/utils/userMethods';

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    // Las categorías suelen ser globales por tenant/empresa.
    // El backend las sirve desde /categorias/customer/{tenantId}.
    const user = userMethods.getUserLogin();
    const tenantId = user?.customerId || user?.tenant_id;
    if (!tenantId) return [];
    
    const response = await axiosInstance.get(`/categorias/customer/${tenantId}`);
    return response.data;
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await axiosInstance.get(`/categorias/${id}`);
    return response.data;
  },

  createCategory: async (category: any): Promise<Category> => {
    const response = await axiosInstance.post('/categorias', category);
    return response.data;
  },

  updateCategory: async (id: number, category: any): Promise<Category> => {
    const response = await axiosInstance.post('/categorias', category);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categorias/${id}`);
  }
};
