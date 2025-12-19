import api from '@/utils/axiosInterceptor'

export interface PayrollConfiguration {
    id?: number
    customerId: number

    // Prestaciones Sociales
    aguinaldoDays: number
    vacationDaysPerYear: number
    vacationPremiumPercentage: number

    // Impuestos y Deducciones
    applyIsr: boolean
    applyImss: boolean
    imssWorkerPercentage: number
    imssEmployerPercentage: number

    // Salarios de Referencia
    minimumWage: number
    umaValue: number

    // Timbrado CFDI
    enableCfdiTimbrado: boolean
    pacProvider?: string
    pacApiKey?: string
    pacApiUrl?: string

    // Dispersión Bancaria
    bankLayoutFormat: string

    // Integración Contable
    enableAccountingIntegration: boolean
    payrollExpenseAccount?: string
    taxesPayableAccount?: string
    salariesPayableAccount?: string

    // Notificaciones
    sendReceiptsByEmail: boolean
    sendReceiptsByWhatsapp: boolean

    // Configuración Colombia
    healthPercentageEmployee: number
    healthPercentageEmployer: number
    pensionPercentageEmployee: number
    pensionPercentageEmployer: number
    solidarityFundPercentage: number
    arlPercentage: number
    transportAllowance: number
    parafiscalCajaPercentage: number
    parafiscalSenaPercentage: number
    parafiscalIcbfPercentage: number
}

const BASE_URL = '/api/hr/payroll/config'

export const payrollConfigService = {
    /**
     * Obtiene la configuración de nómina del tenant
     */
    async getConfig(customerId: number): Promise<PayrollConfiguration> {
        const response = await api.get(`${BASE_URL}?customerId=${customerId}`)
        return response.data
    },

    /**
     * Actualiza la configuración de nómina
     */
    async updateConfig(customerId: number, config: Partial<PayrollConfiguration>): Promise<PayrollConfiguration> {
        const response = await api.put(`${BASE_URL}?customerId=${customerId}`, config)
        return response.data
    },

    /**
     * Restaura la configuración a valores por defecto
     */
    async resetConfig(customerId: number): Promise<{ message: string; config: PayrollConfiguration }> {
        const response = await api.post(`${BASE_URL}/reset?customerId=${customerId}`)
        return response.data
    }
}
