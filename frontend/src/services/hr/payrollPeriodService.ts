import axiosInstance from '@/utils/axiosInterceptor'
import { PayrollPeriod, PageResponse } from '@/types/hr'

export const payrollPeriodService = {
    async getAll(customerId: number, page: number = 0, size: number = 10): Promise<PageResponse<PayrollPeriod>> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<PageResponse<PayrollPeriod>>(
            `/api/hr/periods?customerId=${cid}&page=${page}&size=${size}`
        )
        return response.data
    },

    async create(period: Omit<PayrollPeriod, 'id' | 'periodName' | 'workingDays'>, customerId: number): Promise<PayrollPeriod> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.post<PayrollPeriod>(`/api/hr/periods?customerId=${cid}`, period)
        return response.data
    },

    async updateStatus(id: number, status: string, customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.patch(`/api/hr/periods/${id}/status?status=${status}&customerId=${cid}`)
    },
}
