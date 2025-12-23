import { PayrollReceipt } from '@/types/hr'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const payrollProcessingService = {
    async processPeriod(periodId: number, customerId: number) {
        const response = await fetch(
            `${API_BASE_URL}/api/hr/payroll/periods/${periodId}/process?customerId=${customerId}`,
            { method: 'POST' }
        )
        if (!response.ok) throw new Error('Failed to process payroll')
        return response.json()
    },

    async approvePeriod(periodId: number, customerId: number) {
        const response = await fetch(
            `${API_BASE_URL}/api/hr/payroll/periods/${periodId}/approve?customerId=${customerId}`,
            { method: 'POST' }
        )
        if (!response.ok) throw new Error('Failed to approve payroll')
        return response.json()
    },

    async payPeriod(periodId: number, customerId: number) {
        const response = await fetch(
            `${API_BASE_URL}/api/hr/payroll/periods/${periodId}/pay?customerId=${customerId}`,
            { method: 'POST' }
        )
        if (!response.ok) throw new Error('Failed to register payment')
        return response.json()
    },

    async getReceipts(periodId: number, customerId: number): Promise<PayrollReceipt[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/hr/payroll/periods/${periodId}/receipts?customerId=${customerId}`
        )
        if (!response.ok) throw new Error('Failed to fetch receipts')
        return response.json()
    },
}
