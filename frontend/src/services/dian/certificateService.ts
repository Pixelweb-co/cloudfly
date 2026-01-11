/**
 * Servicio API para Certificados DIAN
 */

import axios from 'axios'
import type { DianCertificate, DianCertificateRequest } from '@/types/dian'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const BASE_PATH = '/api/settings/dian/certificates'

const getTenantId = (): number => {
    if (typeof window !== 'undefined') {
        const storedTenant = localStorage.getItem('tenantId')
        return storedTenant ? parseInt(storedTenant, 10) : 1
    }
    return 1
}

export const dianCertificateService = {
    /**
     * Lista todos los certificados
     */
    async getAll(companyId?: number): Promise<DianCertificate[]> {
        const tenantId = getTenantId()
        const params: any = { tenantId }
        if (companyId) params.companyId = companyId

        const response = await axios.get(`${API_BASE_URL}${BASE_PATH}`, { params })
        return response.data
    },

    /**
     * Obtiene un certificado por ID
     */
    async getById(id: number): Promise<DianCertificate> {
        const tenantId = getTenantId()
        const response = await axios.get(`${API_BASE_URL}${BASE_PATH}/${id}`, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Sube un nuevo certificado
     */
    async upload(file: File, data: DianCertificateRequest): Promise<DianCertificate> {
        const tenantId = getTenantId()

        const formData = new FormData()
        formData.append('file', file)
        formData.append('data', JSON.stringify(data))

        const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, formData, {
            params: { tenantId },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    },

    /**
     * Activa un certificado
     */
    async activate(id: number): Promise<DianCertificate> {
        const tenantId = getTenantId()
        const response = await axios.patch(`${API_BASE_URL}${BASE_PATH}/${id}/activate`, null, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Desactiva un certificado
     */
    async deactivate(id: number): Promise<DianCertificate> {
        const tenantId = getTenantId()
        const response = await axios.patch(`${API_BASE_URL}${BASE_PATH}/${id}/deactivate`, null, {
            params: { tenantId }
        })
        return response.data
    },

    /**
     * Elimina un certificado
     */
    async delete(id: number): Promise<void> {
        const tenantId = getTenantId()
        await axios.delete(`${API_BASE_URL}${BASE_PATH}/${id}`, {
            params: { tenantId }
        })
    }
}
