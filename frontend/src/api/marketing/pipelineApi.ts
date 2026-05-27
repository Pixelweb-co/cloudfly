import axios from 'axios'
import { Pipeline, PipelineCreateRequest, PipelineKanbanData, MoveConversationRequest } from '@/types/marketing/pipelineTypes'
import { ConversationPipelineState } from '@/types/marketing/pipelineTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const pipelineApi = {
  // Pipelines
  getAllPipelines: async (): Promise<Pipeline[]> => {
    const response = await axios.get(`${API_URL}/pipelines`)
    return response.data
  },

  getPipelineById: async (id: number): Promise<Pipeline> => {
    const response = await axios.get(`${API_URL}/pipelines/${id}`)
    return response.data
  },

  createPipeline: async (data: PipelineCreateRequest): Promise<Pipeline> => {
    const response = await axios.post(`${API_URL}/pipelines`, data)
    return response.data
  },

  deletePipeline: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/pipelines/${id}`)
  },

  // Kanban Data
  getKanbanData: async (id: number): Promise<PipelineKanbanData> => {
    const response = await axios.get(`${API_URL}/pipelines/${id}/kanban`)
    return response.data
  },

  // Conversations
  assignConversationToPipeline: async (
    conversationId: string,
    pipelineId: number,
    stageId: number
  ): Promise<ConversationPipelineState> => {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/pipeline/assign/${pipelineId}/${stageId}`
    )
    return response.data
  },

  moveConversation: async (
    conversationId: string,
    data: MoveConversationRequest
  ): Promise<ConversationPipelineState> => {
    const response = await axios.patch(
      `${API_URL}/conversations/${conversationId}/pipeline/move`,
      data
    )
    return response.data
  }
}
