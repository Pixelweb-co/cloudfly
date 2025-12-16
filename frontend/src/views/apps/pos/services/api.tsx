import axiosInstance from '@/utils/axiosInterceptor'
import { ProductType } from '@/types/apps/productType'
import { OrderRequest, OrderResponse, Contact } from '../types'
import { userMethods } from '@/utils/userMethods'

const getTenantId = (): number => {
  const user = userMethods.getUserLogin();
  if (!user) return 0;
  return user.tenantId || (user.customer ? user.customer.id : 1);
}

/**
 * Servicio de Productos para POS
 */
export const ProductService = {
  /**
   * Obtener todos los productos del tenant actual
   */
  getAll: async (): Promise<ProductType[]> => {
    try {
      const tenantId = getTenantId()
      const response = await axiosInstance.get<ProductType[]>(`/productos/tenant/${tenantId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener productos:', error)
      throw error
    }
  },

  /**
   * Buscar producto por código de barras (para scanners)
   */
  getByBarcode: async (barcode: string): Promise<ProductType | null> => {
    try {
      const tenantId = getTenantId()
      const response = await axiosInstance.get<ProductType>(`/productos/barcode/${barcode}`, {
        params: { tenantId }
      })
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Producto con código de barras ${barcode} no encontrado`)
        return null
      }
      console.error('Error al buscar producto por barcode:', error)
      throw error
    }
  },

  /**
   * Buscar productos por nombre (autocompletado)
   */
  searchByName: async (query: string): Promise<ProductType[]> => {
    try {
      if (!query || query.trim().length < 2) {
        return []
      }

      const tenantId = getTenantId()
      const response = await axiosInstance.get<ProductType[]>('/productos/search', {
        params: { query, tenantId }
      })
      return response.data
    } catch (error) {
      console.error('Error al buscar productos por nombre:', error)
      return []
    }
  },

  /**
   * Obtener producto por ID
   */
  getById: async (id: number): Promise<ProductType | null> => {
    try {
      const response = await axiosInstance.get<ProductType>(`/productos/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('Error al obtener producto:', error)
      throw error
    }
  }
}

/**
 * Servicio de Órdenes para POS
 */
export const OrderService = {
  /**
   * Crear nueva orden (procesar venta)
   */
  create: async (orderRequest: OrderRequest): Promise<OrderResponse> => {
    try {
      const response = await axiosInstance.post<OrderResponse>('/orders', orderRequest)
      return response.data
    } catch (error: any) {
      console.error('Error al crear orden:', error)

      // Manejar errores específicos
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }

      throw new Error('Error al procesar la venta. Por favor intente nuevamente.')
    }
  },

  /**
   * Obtener orden por ID
   */
  getById: async (id: number): Promise<OrderResponse | null> => {
    try {
      const response = await axiosInstance.get<OrderResponse>(`/orders/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('Error al obtener orden:', error)
      throw error
    }
  },

  /**
   * Obtener todas las órdenes del tenant
   */
  getAll: async (): Promise<OrderResponse[]> => {
    try {
      const tenantId = getTenantId()
      const response = await axiosInstance.get<OrderResponse[]>(`/orders/tenant/${tenantId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener órdenes:', error)
      throw error
    }
  },

  /**
   * Buscar orden por número de factura
   */
  getByInvoice: async (invoiceNumber: string): Promise<OrderResponse | null> => {
    try {
      const response = await axiosInstance.get<OrderResponse>(`/orders/invoice/${invoiceNumber}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('Error al buscar orden por factura:', error)
      throw error
    }
  },

  /**
   * Obtener órdenes por rango de fechas
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<OrderResponse[]> => {
    try {
      const tenantId = getTenantId()
      const response = await axiosInstance.get<OrderResponse[]>(`/orders/tenant/${tenantId}/by-date`, {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener órdenes por fecha:', error)
      throw error
    }
  },

  /**
   * Cancelar orden (restaura inventario)
   */
  cancel: async (id: number): Promise<OrderResponse> => {
    try {
      const response = await axiosInstance.post<OrderResponse>(`/orders/${id}/cancel`)
      return response.data
    } catch (error: any) {
      console.error('Error al cancelar orden:', error)

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }

      throw new Error('Error al cancelar la orden.')
    }
  }
}

/**
 * Servicio de Contactos (Clientes)
 */
export const ContactService = {
  getAll: async (tenantId: number): Promise<Contact[]> => {
    try {
      const response = await axiosInstance.get(`/contacts/tenant/${tenantId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching contacts:', error)
      throw error
    }
  },

  search: async (tenantId: number, query: string): Promise<Contact[]> => {
    try {
      // Intenta buscar por nombre
      const response = await axiosInstance.get(`/contacts/search`, {
        params: { tenantId, name: query }
      })
      return response.data
    } catch (error) {
      console.error('Error searching contacts:', error)
      return []
    }
  },

  create: async (contact: Partial<Contact>): Promise<Contact> => {
    try {
      const response = await axiosInstance.post('/contacts', contact)
      return response.data
    } catch (error) {
      console.error('Error creating contact:', error)
      throw error
    }
  }
}

/**
 * Servicio de Categorías (opcional para POS)
 */
export const CategoryService = {
  /**
   * Obtener todas las categorías del tenant
   */
  getAll: async (): Promise<any[]> => {
    try {
      const tenantId = getTenantId()
      const response = await axiosInstance.get(`/categorias/customer/${tenantId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener categorías:', error)
      return []
    }
  }
}