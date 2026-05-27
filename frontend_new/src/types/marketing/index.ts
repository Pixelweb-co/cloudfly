export type ChannelPlatform = 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'WEB';
export type ChannelProvider = 'EVOLUTION_API' | 'META_API' | 'TWILIO' | 'CUSTOM';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type AdPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
export type AdFormat = 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL';

export interface Channel {
  id?: number;
  tenantId: number;
  companyId: number;
  name: string;
  platform: ChannelPlatform;
  provider: ChannelProvider;
  botIntegrationId?: number;
  status: boolean;
  settingsJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingCampaign {
  id?: number;
  tenantId: number;
  companyId: number;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  targetPipelineId?: number;
  targetStageId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignAd {
  id?: number;
  campaignId: number;
  companyId: number;
  name: string;
  platform: AdPlatform;
  format: AdFormat;
  mediaUrl?: string;
  destinationUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
