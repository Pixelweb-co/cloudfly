import { axiosInstance } from '@/utils/axiosInstance'
import { PayrollReceipt, LiquidationResult, PaymentRequest } from '@/types/hr'

export interface PaymentResult {
    receiptId: number
    status: string
    paidAt: string
    paymentReference: string
}

export const payrollLiquidationService = {
    /**
     * Liquida un período completo
     */
    liquidatePeriod: async (periodId: number, customerId: number): Promise<LiquidationResult> => {
        const response = await axiosInstance.post(
            `/api/hr/payroll/periods/${periodId}/liquidate`,
            null,
            { params: { customerId } }
        )
        return response.data
    },

    /**
     * Paga un recibo individual
     */
    payReceipt: async (
        receiptId: number,
        customerId: number,
        paymentData: PaymentRequest
    ): Promise<PaymentResult> => {
        const response = await axiosInstance.post(
            `/api/hr/payroll/receipts/${receiptId}/pay`,
            paymentData,
            { params: { customerId } }
        )
        return response.data
    },

    /**
     * Obtiene los recibos de un período
     */
    getReceiptsByPeriod: async (periodId: number, customerId: number): Promise<PayrollReceipt[]> => {
        const response = await axiosInstance.get(
            `/api/hr/payroll/periods/${periodId}/receipts`,
            { params: { customerId } }
        )
        return response.data
    },

    /**
     * Obtiene un recibo por ID
     */
    getReceiptById: async (receiptId: number, customerId: number): Promise<PayrollReceipt> => {
        const response = await axiosInstance.get(
            `/api/hr/payroll/receipts/${receiptId}`,
            { params: { customerId } }
        )
        return response.data
    },

    /**
     * Descarga el PDF del recibo
     */
    downloadReceiptPDF: async (receiptId: number, customerId: number): Promise<Blob> => {
        const response = await axiosInstance.get(
            `/api/hr/payroll/receipts/${receiptId}/pdf`,
            {
                params: { customerId },
                responseType: 'blob'
            }
        )
        return response.data
    }
}

