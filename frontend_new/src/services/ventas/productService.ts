import { axiosInstance } from '@/utils/axiosInstance';
import { Product, ProductCreateRequest } from '@/types/ventas/productTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co';

export const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    const url = `/productos`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const url = `/productos/${id}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  createProduct: async (product: ProductCreateRequest): Promise<Product> => {
    const url = `/productos`;
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('activeCompanyId') : null;
    const enrichedProduct = { ...product, companyId: companyId ? parseInt(companyId) : product.companyId };
    const response = await axiosInstance.post(url, enrichedProduct);
    return response.data;
  },

  updateProduct: async (product: ProductCreateRequest): Promise<Product> => {
    const url = `/productos`;
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('activeCompanyId') : null;
    const enrichedProduct = { ...product, companyId: companyId ? parseInt(companyId) : product.companyId };
    // Mismo endpoint POST usado como upsert en Node.js base
    const response = await axiosInstance.post(url, enrichedProduct);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    const url = `/productos/${id}`;
    await axiosInstance.delete(url);
  }
};
