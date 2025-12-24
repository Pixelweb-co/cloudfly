import { axiosInstance } from '@/utils/axiosInstance'
import type { Customer } from '@/types/customers'

const API_BASE = '/customers'

export const customerService = {
    /**
     * Get all customers
     */
    getAllCustomers: async (): Promise<Customer[]> => {
        const response = await axiosInstance.get<Customer[]>(API_BASE)
        return response.data
    },

    /**
     * Get active customers only
     */
    getActiveCustomers: async (): Promise<Customer[]> => {
        const response = await axiosInstance.get<Customer[]>(`${API_BASE}`)
        // Filter active customers (status = true)
        return response.data.filter(customer => customer.status === true)
    },

    /**
     * Get customer by ID
     */
    getCustomerById: async (id: number): Promise<Customer> => {
        const response = await axiosInstance.get<Customer>(`${API_BASE}/${id}`)
        return response.data
    }
}

export default customerService
