import axios from '@/utils/axiosInstance';
import { PortfolioDocument, PortfolioPayment, PortfolioSummary } from '@/types/portfolio';

// Placeholder types if not yet created (will be created in next step)
// We assume axios instance is configured with base URL

const BASE_URL = '/portfolio';

export const portfolioService = {
    // Obtener documentos (CxC) de un tenant
    getReceivables: async (tenantId: number, contactId?: number): Promise<PortfolioDocument[]> => {
        const params = { tenantId, contactId };
        const response = await axios.get(`${BASE_URL}/receivables`, { params });
        return response.data;
    },

    // Obtener resumen (totales)
    getTotalReceivables: async (tenantId: number): Promise<number> => {
        const response = await axios.get(`${BASE_URL}/summary/receivables`, { params: { tenantId } });
        return response.data;
    },

    // Registrar un pago
    createPayment: async (payment: any): Promise<PortfolioPayment> => {
        // payment should implement PortfolioPaymentRequestDTO structure
        const response = await axios.post(`${BASE_URL}/payments`, payment);
        return response.data;
    }
};
