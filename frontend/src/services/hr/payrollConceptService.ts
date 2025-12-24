import { axiosInstance } from '@/utils/axiosInstance'
import { PayrollConcept } from '@/types/hr'

export const payrollConceptService = {
    // Get all concepts
    async getAll(customerId: number, type?: 'PERCEPCION' | 'DEDUCCION'): Promise<PayrollConcept[]> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const url = type
            ? `/api/hr/concepts?customerId=${cid}&type=${type}`
            : `/api/hr/concepts?customerId=${cid}`

        const response = await axiosInstance.get<PayrollConcept[]>(url)
        return response.data
    },

    // Get concept by ID
    async getById(id: number, customerId: number): Promise<PayrollConcept> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<PayrollConcept>(`/api/hr/concepts/${id}?customerId=${cid}`)
        return response.data
    },

    // Create concept
    async create(concept: Omit<PayrollConcept, 'id'>, customerId: number): Promise<PayrollConcept> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.post<PayrollConcept>(`/api/hr/concepts?customerId=${cid}`, concept)
        return response.data
    },

    // Update concept
    async update(id: number, concept: Partial<PayrollConcept>, customerId: number): Promise<PayrollConcept> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.put<PayrollConcept>(`/api/hr/concepts/${id}?customerId=${cid}`, concept)
        return response.data
    },

    // Delete concept
    async delete(id: number, customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.delete(`/api/hr/concepts/${id}?customerId=${cid}`)
    },

    // Initialize default concepts
    async initializeDefaults(customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.post(`/api/hr/concepts/initialize?customerId=${cid}`)
    },
}
