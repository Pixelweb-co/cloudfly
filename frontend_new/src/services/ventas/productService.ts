import { axiosInstance } from '@/utils/axiosInstance';
import { Product, ProductCreateRequest } from '@/types/ventas/productTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co';

export const productService = {
  getAllProducts: async (tenantId?: number, companyId?: number): Promise<Product[]> => {
    // Para MySQL R2DBC las vistas suelen agruparse por tenantId en el nuevo backend,
    // que funcionalmente es equivalent al company_id aislando la data corporativa.
    const effectiveId = companyId || tenantId;
    const url = `/productos${effectiveId ? `/tenant/${effectiveId}` : ''}`;
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
    const response = await axiosInstance.post(url, product);
    return response.data;
  },

  updateProduct: async (product: ProductCreateRequest): Promise<Product> => {
    const url = `/productos`;
    // Mismo endpoint POST usado como upsert en Node.js base
    const response = await axiosInstance.post(url, product);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    const url = `/productos/${id}`;
    await axiosInstance.delete(url);
  }
};
