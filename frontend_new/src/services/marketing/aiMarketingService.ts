import axiosInstance from '@/utils/axiosInstance';
import type {
  DiscoveryStats,
  DomainMap,
  RelationshipGraph,
  EntityEntry,
  TenantInfo,
  CompanyAnalysis,
  Strategy,
  BacklogItem,
  Opportunity,
  LearningCycle,
  DiscoveredEntity,
  DiscoveredRelationship,
  ChangeDetection
} from '@/types/marketing/aiMarketing';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai-marketing`;

export const aiMarketingService = {
  // Schema Discovery
  runDiscovery: async () => {
    const response = await axiosInstance.post(`${API_URL}/discover`);
    return response.data;
  },

  getDiscoveryStats: async (): Promise<DiscoveryStats> => {
    const response = await axiosInstance.get(`${API_URL}/discovery/stats`);
    return response.data;
  },

  getDomainMap: async (): Promise<DomainMap> => {
    const response = await axiosInstance.get(`${API_URL}/discovery/domain-map`);
    return response.data;
  },

  getEntityCatalog: async (): Promise<EntityEntry[]> => {
    const response = await axiosInstance.get(`${API_URL}/discovery/entity-catalog`);
    return response.data;
  },

  getRelationshipGraph: async (): Promise<RelationshipGraph> => {
    const response = await axiosInstance.get(`${API_URL}/discovery/relationship-graph`);
    return response.data;
  },

  // Tenant Resolution
  getActiveTenants: async (): Promise<TenantInfo[]> => {
    const response = await axiosInstance.get(`${API_URL}/tenants/active`);
    return response.data;
  },

  getTenantContext: async (companyId: number): Promise<TenantInfo> => {
    const response = await axiosInstance.get(`${API_URL}/tenants/${companyId}/context`);
    return response.data;
  },

  // Company Analysis
  runAnalysis: async (companyId?: number): Promise<CompanyAnalysis> => {
    const response = await axiosInstance.post(`${API_URL}/analyze`, { companyId });
    return response.data;
  },

  getAnalysisHistory: async (companyId: number): Promise<CompanyAnalysis[]> => {
    const response = await axiosInstance.get(`${API_URL}/analysis/${companyId}/history`);
    return response.data;
  },

  getStrategies: async (companyId: number): Promise<Strategy[]> => {
    const response = await axiosInstance.get(`${API_URL}/analysis/${companyId}/strategies`);
    return response.data;
  },

  getBacklog: async (companyId: number): Promise<BacklogItem[]> => {
    const response = await axiosInstance.get(`${API_URL}/analysis/${companyId}/backlog`);
    return response.data;
  },

  getOpportunities: async (companyId: number): Promise<Opportunity[]> => {
    const response = await axiosInstance.get(`${API_URL}/analysis/${companyId}/opportunities`);
    return response.data;
  },

  // Self-Learning
  runLearningCycle: async () => {
    const response = await axiosInstance.post(`${API_URL}/learn`);
    return response.data;
  },

  getLearningHistory: async (): Promise<LearningCycle[]> => {
    const response = await axiosInstance.get(`${API_URL}/learning/history`);
    return response.data;
  },

  getSchemaChanges: async (): Promise<ChangeDetection> => {
    const response = await axiosInstance.get(`${API_URL}/learning/schema-changes`);
    return response.data;
  },

  // Domain Knowledge Store
  getDiscoveredEntities: async (): Promise<DiscoveredEntity[]> => {
    const response = await axiosInstance.get(`${API_URL}/domain/entities`);
    return response.data;
  },

  getDiscoveredRelationships: async (): Promise<DiscoveredRelationship[]> => {
    const response = await axiosInstance.get(`${API_URL}/domain/relationships`);
    return response.data;
  },

  // Full Pipeline
  runFullPipeline: async () => {
    const response = await axiosInstance.post(`${API_URL}/pipeline/full`);
    return response.data;
  },

  getPipelineStatus: async () => {
    const response = await axiosInstance.get(`${API_URL}/pipeline/status`);
    return response.data;
  }
};

export default aiMarketingService;
