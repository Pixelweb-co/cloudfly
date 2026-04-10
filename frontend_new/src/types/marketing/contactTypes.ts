export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  type: string;
  stage: string;
  avatarUrl?: string;
  tenantId: number;
  companyId: number;
  pipelineId?: number;
  stageId?: number;
  documentType?: string;
  documentNumber?: string;
  isActive: boolean;
  chatbotEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  type: string;
  stage?: string;
  pipelineId?: number;
  stageId?: number;
  documentType?: string;
  documentNumber?: string;
  isActive?: boolean;
  tenantId?: number;
  companyId?: number;
}
