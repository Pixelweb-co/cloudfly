import { axiosInstance } from '@/utils/axiosInstance'
import type { DaneCode } from '@/types/customers'

const API_URL = '/api/settings/dane'

export const daneService = {
    /**
     * Get all DANE codes
     */
    async getAll(): Promise<DaneCode[]> {
        const response = await axiosInstance.get<DaneCode[]>(API_URL)
        return response.data
    },

    /**
     * Get all departments
     */
    async getDepartamentos(): Promise<DaneCode[]> {
        const response = await axiosInstance.get<DaneCode[]>(`${API_URL}/departamentos`)
        return response.data
    },

    /**
     * Get cities by department code
     */
    async getCiudadesByDepartamento(codigoDepartamento: string): Promise<DaneCode[]> {
        const response = await axiosInstance.get<DaneCode[]>(`${API_URL}/ciudades/${codigoDepartamento}`)
        return response.data
    },

    /**
     * Get DANE code by codigo
     */
    async getByCodigo(codigo: string): Promise<DaneCode> {
        const response = await axiosInstance.get<DaneCode>(`${API_URL}/codigo/${codigo}`)
        return response.data
    },

    /**
     * Create new DANE code
     */
    async create(data: Partial<DaneCode>): Promise<DaneCode> {
        const response = await axiosInstance.post<DaneCode>(API_URL, data)
        return response.data
    },

    /**
     * Update DANE code
     */
    async update(id: number, data: Partial<DaneCode>): Promise<DaneCode> {
        const response = await axiosInstance.put<DaneCode>(`${API_URL}/${id}`, data)
        return response.data
    },

    /**
     * Delete (deactivate) DANE code
     */
    async delete(id: number): Promise<void> {
        await axiosInstance.delete(`${API_URL}/${id}`)
    }
}
