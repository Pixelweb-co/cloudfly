import { axiosInstance as api } from '@/utils/axiosInstance'

export interface PayrollNovelty {
    id?: number
    employeeId: number
    employeeName?: string
    payrollPeriodId?: number
    periodName?: string
    type: string
    description: string
    date: string
    amount?: number
    quantity?: number
    status?: 'PENDING' | 'PROCESSED' | 'CANCELLED'
}

const BASE_URL = '/api/hr/novelties'

export const noveltyService = {
    getAll: async (customerId: number, page: number = 0, size: number = 10) => {
        const response = await api.get(`${BASE_URL}?customerId=${customerId}&page=${page}&size=${size}`)
        return response.data
    },

    create: async (novelty: PayrollNovelty, customerId: number) => {
        const response = await api.post(`${BASE_URL}?customerId=${customerId}`, novelty)
        return response.data
    },

    delete: async (id: number, customerId: number) => {
        await api.delete(`${BASE_URL}/${id}?customerId=${customerId}`)
    }
}
