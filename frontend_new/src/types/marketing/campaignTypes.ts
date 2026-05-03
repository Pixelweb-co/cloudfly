export interface Campaign {
  id: number;
  tenantId: number;
  companyId: number;
  name: string;
  description?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  channelId: number;
  sendingListId?: number;
  pipelineId?: number;
  pipelineStage?: string;
  message?: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  mediaCaption?: string;
  productId?: number;
  categoryId?: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignSendLog {
  id: number;
  campaignId: number;
  contactId: number;
  destination?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
  providerMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}
