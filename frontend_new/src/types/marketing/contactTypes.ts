export interface Tag {
  id: number;
  tenantId: number;
  companyId: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  uuid?: string;
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
  assignedUserIds?: string;
  tags?: Tag[];
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
  assignedUserIds?: string;
  tenantId?: number;
  companyId?: number;
  tagIds?: number[];
}
