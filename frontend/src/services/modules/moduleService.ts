import { axiosInstance } from '@/utils/axiosInstance'
import { ModuleDTO, ModuleCreateRequest } from '@/types/modules'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const moduleService = {
    getAllModules: async (): Promise<ModuleDTO[]> => {
        const response = await axiosInstance.get('/api/rbac/modules-list')
        return response.data
    },

    getModuleById: async (id: number): Promise<ModuleDTO> => {
        const response = await axiosInstance.get(`/api/rbac/modules/${id}`)
        return response.data
    },

    createModule: async (data: ModuleCreateRequest): Promise<ModuleDTO> => {
        const response = await axiosInstance.post('/api/rbac/modules', data)
        return response.data
    },

    updateModule: async (id: number, data: ModuleCreateRequest): Promise<ModuleDTO> => {
        const response = await axiosInstance.put(`/api/rbac/modules/${id}`, data)
        return response.data
    },

    deleteModule: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/rbac/modules/${id}`)
    }
}
