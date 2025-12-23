// Service for payroll cost reports
import axiosInstance from '@/utils/axiosInterceptor'
import type { PayrollCostByCostCenter, CostCenter } from '@/types/hr'

const BASE_URL = '/api/hr/reports'
const COST_CENTER_URL = '/cost-centers'

/**
 * Get payroll costs by cost center for a specific period
 */
export const getPayrollCostsByCostCenter = async (
    periodId: number,
    customerId: number
): Promise<PayrollCostByCostCenter> => {
    const response = await axiosInstance.get<PayrollCostByCostCenter>(
        `${BASE_URL}/cost-by-center/${periodId}`,
        { params: { customerId } }
    )
    return response.data
}

/**
 * Get payroll costs by cost center for a full year
 */
export const getPayrollCostsByCostCenterForYear = async (
    year: number,
    customerId: number
): Promise<PayrollCostByCostCenter[]> => {
    const response = await axiosInstance.get<PayrollCostByCostCenter[]>(
        `${BASE_URL}/cost-by-center/year/${year}`,
        { params: { customerId } }
    )
    return response.data
}

/**
 * Get all active cost centers
 */
export const getCostCenters = async (): Promise<CostCenter[]> => {
    const response = await axiosInstance.get<CostCenter[]>(COST_CENTER_URL)
    return response.data
}

/**
 * Get cost center by ID
 */
export const getCostCenterById = async (id: number): Promise<CostCenter> => {
    const response = await axiosInstance.get<CostCenter>(`${COST_CENTER_URL}/${id}`)
    return response.data
}

const payrollReportService = {
    getPayrollCostsByCostCenter,
    getPayrollCostsByCostCenterForYear,
    getCostCenters,
    getCostCenterById
}

export default payrollReportService
