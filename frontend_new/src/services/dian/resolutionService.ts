/**
 * Servicio API para Resoluciones DIAN
 */

import axios from 'axios'
import type { DianResolution, DianResolutionRequest } from '@/types/dian'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const BASE_PATH = '/api/settings/dian/resolutions'

const getTenantId = (): number => {
    if (typeof window !== 'undefined') {
        const storedTenant = localStorage.getItem('tenantId')
        return storedTenant ? parseInt(storedTenant, 10) : 1
    }
    return 1
}

export const dianResolutionService = {
    /**
     * Lista todas las resoluciones
     */
    async getAll(companyId?: number): Promise<DianResolution[]> {
        const tenantId = getTenantId()
        const params: any = { tenantId }
        if (companyId) params.companyId = companyId

        const response = await axios.get(`${API_BASE_URL}${BASE_PATH}`, { params })
        return response.data
    },

    /**
     * Obtiene una resolución por ID
     */
    async getById(id: number): Promise<DianResolution> {
        const tenantId = getTenantId()
        const response = await axios.get(`${API_BASE_URL}${BASE_PATH}/${id}`, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Crea una nueva resolución
     */
    async create(data: DianResolutionRequest): Promise<DianResolution> {
        const tenantId = getTenantId()
        const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, data, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Actualiza una resolución existente
     */
    async update(id: number, data: DianResolutionRequest): Promise<DianResolution> {
        const tenantId = getTenantId()
        const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, data, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Elimina una resolución
     */
    async delete(id: number): Promise<void> {
        const tenantId = getTenantId()
        await axios.delete(`${API_BASE_URL}${BASE_PATH}/${id}`, {
            params: { tenantId }
        })
    }
}
