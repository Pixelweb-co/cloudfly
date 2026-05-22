import { axiosInstance } from '@/utils/axiosInstance';
import { Workflow, WorkflowExecutionLog, WorkflowPaginatedResponse } from '@/types/automation/workflowTypes';

export interface WorkflowFilterParams {
  name?: string;
  triggerEvent?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}

export const workflowService = {
  getWorkflows: async (params?: WorkflowFilterParams): Promise<WorkflowPaginatedResponse> => {
    const url = `/api/v1/workflows`;
    
    // Construct query parameters
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.name) queryParams.append('name', params.name);
      if (params.triggerEvent) queryParams.append('triggerEvent', params.triggerEvent);
      if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params.page !== undefined) queryParams.append('page', String(params.page));
      if (params.size !== undefined) queryParams.append('size', String(params.size));
    }
    
    const queryString = queryParams.toString();
    const finalUrl = queryString ? `${url}?${queryString}` : url;
    
    const response = await axiosInstance.get(finalUrl);
    return response.data;
  },

  getWorkflowById: async (id: number): Promise<Workflow> => {
    const url = `/api/v1/workflows/${id}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  createWorkflow: async (workflow: Omit<Workflow, 'id' | 'tenantId' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<Workflow> => {
    const url = `/api/v1/workflows`;
    const response = await axiosInstance.post(url, workflow);
    return response.data;
  },

  updateWorkflow: async (id: number, workflow: Omit<Workflow, 'id' | 'tenantId' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<Workflow> => {
    const url = `/api/v1/workflows/${id}`;
    const response = await axiosInstance.put(url, workflow);
    return response.data;
  },

  deleteWorkflow: async (id: number): Promise<void> => {
    const url = `/api/v1/workflows/${id}`;
    await axiosInstance.delete(url);
  },

  toggleStatus: async (id: number): Promise<Workflow> => {
    const url = `/api/v1/workflows/${id}/toggle-status`;
    const response = await axiosInstance.patch(url);
    return response.data;
  },

  getExecutionLogs: async (id: number): Promise<WorkflowExecutionLog[]> => {
    const url = `/api/v1/workflows/${id}/logs`;
    const response = await axiosInstance.get(url);
    return response.data;
  }
};
