import { axiosInstance } from '@/utils/axiosInstance';
import { Product, ProductCreateRequest } from '@/types/ventas/productTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co';

export const productService = {
  getAllProducts: async (tenantId?: number, companyId?: number): Promise<Product[]> => {
    const url = tenantId 
      ? `/api/v1/products/tenant/${tenantId}${companyId ? `?companyId=${companyId}` : ''}`
      : `/api/v1/products`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const url = `/api/v1/products/${id}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  createProduct: async (product: ProductCreateRequest): Promise<Product> => {
    const url = `/api/v1/products`;
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('activeCompanyId') : null;
    const enrichedProduct = { ...product, companyId: companyId ? parseInt(companyId) : product.companyId };
    const response = await axiosInstance.post(url, enrichedProduct);
    return response.data;
  },

  updateProduct: async (product: ProductCreateRequest): Promise<Product> => {
    const url = `/api/v1/products`;
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('activeCompanyId') : null;
    const enrichedProduct = { ...product, companyId: companyId ? parseInt(companyId) : product.companyId };
    const response = await axiosInstance.post(url, enrichedProduct);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    const url = `/api/v1/products/${id}`;
    await axiosInstance.delete(url);
  },
  
  getProductsByType: async (type: string): Promise<Product[]> => {
    const url = `/api/v1/products/type/${type}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
};
