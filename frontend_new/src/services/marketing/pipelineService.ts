import { axiosInstance } from '@/utils/axiosInstance'
import type { Pipeline, CreatePipelineDto } from '@/types/marketing/pipelineTypes'

export const pipelineService = {
  getAllPipelines: async (): Promise<Pipeline[]> => {
    const response = await axiosInstance.get('/api/pipelines')
    
    return response.data
  },

  getPipelineById: async (id: number): Promise<Pipeline> => {
    const response = await axiosInstance.get(`/api/pipelines/${id}`)
    
    return response.data
  },

  createPipeline: async (data: CreatePipelineDto): Promise<Pipeline> => {
    const response = await axiosInstance.post('/api/pipelines', data)
    
    return response.data
  },

  updatePipeline: async (id: number, data: Partial<CreatePipelineDto>): Promise<Pipeline> => {
    const response = await axiosInstance.put(`/api/pipelines/${id}`, data)
    
    return response.data
  },

  deletePipeline: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/pipelines/${id}`)
  },

  toggleStatus: async (id: number): Promise<Pipeline> => {
    const response = await axiosInstance.patch(`/api/pipelines/${id}/toggle-status`)
    
    return response.data
  }
}
