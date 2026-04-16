import { axiosInstance } from '@/utils/axiosInstance'
import type { OrderType } from '@/types/ventas/orderTypes'

export const orderService = {
    list: async () => {
        const response = await axiosInstance.get<OrderType[]>('/orders')
        return response.data
    },

    getById: async (id: string | number) => {
        const response = await axiosInstance.get<OrderType>(`/orders/${id}`)
        return response.data
    },

    create: async (data: any) => {
        const response = await axiosInstance.post<OrderType>('/orders', data)
        return response.data
    },

    update: async (id: string | number, data: any) => {
        const response = await axiosInstance.put<OrderType>(`/orders/${id}`, data)
        return response.data
    },

    delete: async (id: string | number) => {
        const response = await axiosInstance.delete(`/orders/${id}`)
        return response.data
    }
}
