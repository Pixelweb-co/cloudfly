import axiosInstance from '@/utils/axiosInterceptor'
import { PlanCreateRequest, PlanResponse } from '@/types/plans'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const planService = {
    getAllPlans: async (): Promise<PlanResponse[]> => {
        const response = await axiosInstance.get(`${API_URL}/api/v1/plans`)
        return response.data
    },

    getActivePlans: async (): Promise<PlanResponse[]> => {
        const response = await axiosInstance.get(`${API_URL}/api/v1/plans/active`)
        return response.data
    },

    getPlanById: async (id: number): Promise<PlanResponse> => {
        const response = await axiosInstance.get(`${API_URL}/api/v1/plans/${id}`)
        return response.data
    },

    createPlan: async (plan: PlanCreateRequest): Promise<PlanResponse> => {
        const response = await axiosInstance.post(`${API_URL}/api/v1/plans`, plan)
        return response.data
    },

    updatePlan: async (id: number, plan: PlanCreateRequest): Promise<PlanResponse> => {
        const response = await axiosInstance.put(`${API_URL}/api/v1/plans/${id}`, plan)
        return response.data
    },

    deletePlan: async (id: number): Promise<void> => {
        await axiosInstance.delete(`${API_URL}/api/v1/plans/${id}`)
    },

    togglePlanStatus: async (id: number): Promise<PlanResponse> => {
        const response = await axiosInstance.patch(`${API_URL}/api/v1/plans/${id}/toggle-status`)
        return response.data
    }
}
