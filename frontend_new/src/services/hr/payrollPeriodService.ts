import { axiosInstance } from '@/utils/axiosInstance'
import { PayrollPeriod, PageResponse } from '@/types/hr'

export const payrollPeriodService = {
    async getAll(customerId: number, page: number = 0, size: number = 10): Promise<PageResponse<PayrollPeriod>> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<PageResponse<PayrollPeriod>>(
            `/api/hr/periods?customerId=${cid}&page=${page}&size=${size}`
        )
        return response.data
    },

    async getCurrent(customerId: number): Promise<PayrollPeriod | null> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        try {
            const response = await axiosInstance.get<PayrollPeriod>(`/api/hr/periods/current?customerId=${cid}`)
            return response.data
        } catch (error: any) {
            if (error.response?.status === 204) {
                return null
            }
            throw error
        }
    },

    async hasOpenPeriod(customerId: number): Promise<boolean> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<{ hasOpen: boolean }>(`/api/hr/periods/has-open?customerId=${cid}`)
        return response.data.hasOpen
    },

    async getById(id: number, customerId: number): Promise<PayrollPeriod> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<PayrollPeriod>(`/api/hr/periods/${id}?customerId=${cid}`)
        return response.data
    },

    async create(period: Omit<PayrollPeriod, 'id' | 'periodName' | 'workingDays'>, customerId: number): Promise<PayrollPeriod> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.post<PayrollPeriod>(`/api/hr/periods?customerId=${cid}`, period)
        return response.data
    },

    async update(id: number, period: Partial<PayrollPeriod>, customerId: number): Promise<PayrollPeriod> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.put<PayrollPeriod>(`/api/hr/periods/${id}?customerId=${cid}`, period)
        return response.data
    },

    async updateStatus(id: number, status: string, customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.patch(`/api/hr/periods/${id}/status?status=${status}&customerId=${cid}`)
    },

    async delete(id: number, customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.delete(`/api/hr/periods/${id}?customerId=${cid}`)
    },
}
