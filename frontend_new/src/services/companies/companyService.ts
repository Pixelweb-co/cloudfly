import { axiosInstance } from '@/utils/axiosInstance'
import type { CompanyDTO, CompanyCreateRequest } from '@/types/companies'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const companyService = {
    getAllCompanies: async (): Promise<CompanyDTO[]> => {
        const response = await axiosInstance.get('/api/v1/companies')
        return response.data
    },

    getCompanyById: async (id: number): Promise<CompanyDTO> => {
        const response = await axiosInstance.get(`/api/v1/companies/${id}`)
        return response.data
    },

    createCompany: async (data: CompanyCreateRequest): Promise<CompanyDTO> => {
        const response = await axiosInstance.post('/api/v1/companies', data)
        return response.data
    },

    updateCompany: async (id: number, data: CompanyCreateRequest): Promise<CompanyDTO> => {
        const response = await axiosInstance.put(`/api/v1/companies/${id}`, data)
        return response.data
    },

    deleteCompany: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/v1/companies/${id}`)
    }
}
