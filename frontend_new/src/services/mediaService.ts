import axios from 'axios'
import { userMethods } from '@/utils/userMethods'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface Media {
  id: number
  tenantId: number
  filename: string
  originalName: string
  contentType: string
  size: number
  url: string
  createdAt: string
}

export const mediaService = {
  getMedia: async (): Promise<Media[]> => {
    const user = userMethods.getUserLogin()
    const tenantId = user?.customerId || user?.tenant_id
    const response = await axios.get(`${API_URL}/api/v1/media`, {
      params: { tenantId }
    })
    return response.data
  },

  searchMedia: async (query: string): Promise<Media[]> => {
    const user = userMethods.getUserLogin()
    const tenantId = user?.customerId || user?.tenant_id
    const response = await axios.get(`${API_URL}/api/v1/media/search`, {
      params: { tenantId, query }
    })
    return response.data
  },

  uploadMedia: async (file: File): Promise<Media> => {
    const user = userMethods.getUserLogin()
    const tenantId = user?.customerId || user?.tenant_id
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axios.post(`${API_URL}/api/v1/media`, formData, {
      params: { tenantId },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  deleteMedia: async (id: number): Promise<void> => {
    const user = userMethods.getUserLogin()
    const tenantId = user?.customerId || user?.tenant_id
    await axios.delete(`${API_URL}/api/v1/media/${id}`, {
      params: { tenantId }
    })
  }
}
