/**
 * Servicio API para Modos de Operación DIAN
 */

import axios from 'axios'
import type { DianOperationMode, DianOperationModeRequest } from '@/types/dian'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const BASE_PATH = '/api/settings/dian/operation-modes'

// Helper para obtener tenantId (ajustar según tu implementación)
const getTenantId = (): number => {
    // Por ahora retornamos 1, pero deberías obtenerlo del contexto/localStorage/token
    if (typeof window !== 'undefined') {
        const storedTenant = localStorage.getItem('tenantId')
        return storedTenant ? parseInt(storedTenant, 10) : 1
    }
    return 1
}

export const dianOperationModeService = {
    /**
     * Lista todos los modos de operación
     */
    async getAll(companyId?: number): Promise<DianOperationMode[]> {
        const tenantId = getTenantId()
        const params: any = { tenantId }
        if (companyId) params.companyId = companyId

        const response = await axios.get(`${API_BASE_URL}${BASE_PATH}`, { params })
        return response.data
    },

    /**
     * Obtiene un modo por ID
     */
    async getById(id: number): Promise<DianOperationMode> {
        const tenantId = getTenantId()
        const response = await axios.get(`${API_BASE_URL}${BASE_PATH}/${id}`, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Crea un nuevo modo de operación
     */
    async create(data: DianOperationModeRequest): Promise<DianOperationMode> {
        const tenantId = getTenantId()
        const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, data, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Actualiza un modo existente
     */
    async update(id: number, data: DianOperationModeRequest): Promise<DianOperationMode> {
        const tenantId = getTenantId()
        const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, data, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Elimina un modo de operación
     */
    async delete(id: number): Promise<void> {
        const tenantId = getTenantId()
        await axios.delete(`${API_BASE_URL}${BASE_PATH}/${id}`, {
            params: { tenantId }
        })
    }
}
