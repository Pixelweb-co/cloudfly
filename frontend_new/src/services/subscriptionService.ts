import { axiosInstance } from '@/utils/axiosInstance'
import type {
    SubscriptionResponse,
    SubscriptionCreateRequest,
    SubscriptionModulesUpdateRequest,
    SubscriptionLimitsUpdateRequest
} from '@/types/subscriptions'

const API_BASE = '/api/v1/subscriptions'

export const subscriptionService = {
    /**
     * Create a new subscription for a tenant
     */
    createSubscription: async (request: SubscriptionCreateRequest): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.post<SubscriptionResponse>(API_BASE, request)
        return response.data
    },

    /**
     * Get subscription by ID
     */
    getSubscriptionById: async (id: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.get<SubscriptionResponse>(`${API_BASE}/${id}`)
        return response.data
    },

    /**
     * Get active subscription for a tenant
     */
    getActiveTenantSubscription: async (tenantId: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.get<SubscriptionResponse>(`${API_BASE}/tenant/${tenantId}/active`)
        return response.data
    },

    /**
     * Get all subscriptions for a tenant
     */
    getTenantSubscriptions: async (tenantId: number): Promise<SubscriptionResponse[]> => {
        const response = await axiosInstance.get<SubscriptionResponse[]>(`${API_BASE}/tenant/${tenantId}`)
        return response.data
    },

    /**
     * Update subscription modules
     */
    updateModules: async (id: number, request: SubscriptionModulesUpdateRequest): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.patch<SubscriptionResponse>(`${API_BASE}/${id}/modules`, request)
        return response.data
    },

    /**
     * Update subscription limits
     */
    updateLimits: async (id: number, request: SubscriptionLimitsUpdateRequest): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.patch<SubscriptionResponse>(`${API_BASE}/${id}/limits`, request)
        return response.data
    },

    /**
     * Add a module to subscription
     */
    addModule: async (id: number, moduleId: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.post<SubscriptionResponse>(`${API_BASE}/${id}/modules/${moduleId}`)
        return response.data
    },

    /**
     * Remove a module from subscription
     */
    removeModule: async (id: number, moduleId: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.delete<SubscriptionResponse>(`${API_BASE}/${id}/modules/${moduleId}`)
        return response.data
    },

    /**
     * Cancel subscription
     */
    cancelSubscription: async (id: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.patch<SubscriptionResponse>(`${API_BASE}/${id}/cancel`)
        return response.data
    },

    /**
     * Renew subscription
     */
    renewSubscription: async (id: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.post<SubscriptionResponse>(`${API_BASE}/${id}/renew`)
        return response.data
    },

    /**
     * Change subscription plan
     */
    changePlan: async (id: number, planId: number): Promise<SubscriptionResponse> => {
        const response = await axiosInstance.patch<SubscriptionResponse>(`${API_BASE}/${id}/change-plan/${planId}`)
        return response.data
    },

    /**
     * Get all active subscriptions (SUPERADMIN only)
     */
    getActiveSubscriptions: async (): Promise<SubscriptionResponse[]> => {
        const response = await axiosInstance.get<SubscriptionResponse[]>(`${API_BASE}/active`)
        return response.data
    }
}

export default subscriptionService
