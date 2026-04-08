import { axiosInstance } from '@/utils/axiosInstance'
import type { Pipeline, CreatePipelineDto, PipelineKanbanCard, MoveConversationDto } from '@/types/marketing/pipelineTypes'

export const pipelineService = {
  getAllPipelines: async (companyId?: number): Promise<Pipeline[]> => {
    const url = companyId ? `/api/pipelines?companyId=${companyId}` : '/api/pipelines'
    const response = await axiosInstance.get(url)
    
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
  },

  getKanbanData: async (id: number): Promise<Record<string, PipelineKanbanCard[]>> => {
    const response = await axiosInstance.get(`/api/pipelines/${id}/kanban`)
    
    return response.data
  },

  moveConversation: async (id: string, data: MoveConversationDto): Promise<void> => {
    await axiosInstance.post('/api/pipelines/move-conversation', data)
  },

  assignConversationToPipeline: async (conversationId: string, pipelineId: number, stageId: number): Promise<void> => {
    await axiosInstance.post(`/api/pipelines/${pipelineId}/assign-conversation`, { conversationId, stageId })
  }
}
