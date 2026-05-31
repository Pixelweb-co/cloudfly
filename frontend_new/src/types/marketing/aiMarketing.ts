// AI Marketing Operation Types - CLOUD-199

export interface DiscoveredEntity {
  id?: number;
  entity_name: string;
  table_names: string[];
  description?: string;
  business_domain?: string;
  discovered_at?: string;
  updated_at?: string;
}

export interface DiscoveredRelationship {
  id?: number;
  source_entity: string;
  target_entity: string;
  relationship_type?: string;
  foreign_key_info?: ForeignKeyInfo;
  discovered_at?: string;
}

export interface ForeignKeyInfo {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  updateRule?: string;
  deleteRule?: string;
}

export interface SchemaVersion {
  id?: number;
  version_hash: string;
  schema_snapshot: SchemaSnapshot;
  changes_detected?: ChangeDetection;
  created_at?: string;
}

export interface SchemaSnapshot {
  tables: TableInfo[];
  views: ViewInfo[];
  procedures: ProcedureInfo[];
  capturedAt: string;
}

export interface TableInfo {
  name: string;
  engine?: string;
  rows?: number;
  comment?: string;
  columns: ColumnInfo[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyInfo[];
  indexes: string[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  key?: string;
  extra?: string;
  comment?: string;
}

export interface ViewInfo {
  name: string;
  definition?: string;
}

export interface ProcedureInfo {
  name: string;
  type?: string;
  created?: string;
  lastAltered?: string;
}

export interface ChangeDetection {
  newTables: string[];
  droppedTables: string[];
  modifiedTables: string[];
  detectedAt: string;
}

export interface DomainCatalogEntry {
  id?: number;
  catalog_name: string;
  catalog_data: DomainCatalogData;
  entity_count: number;
  relationship_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface DomainCatalogData {
  entities: EntityEntry[];
  generatedAt: string;
}

export interface EntityEntry {
  name: string;
  table: string;
  columns: { name: string; type: string }[];
  primaryKeys: string[];
  foreignKeys: { column: string; references: string }[];
  indexes: string[];
  rowCount: number;
}

export interface DomainMap {
  [entityName: string]: {
    tables: string[];
    relationships: string[];
    discoveredAt: string;
  };
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
}

export interface GraphNode {
  id: string;
  type: 'table' | 'entity';
  label?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  column?: string;
}

export interface TenantInfo {
  customer: CustomerInfo;
  company: CompanyInfo;
}

export interface CustomerInfo {
  id: number;
  name?: string;
  email?: string;
  subscription_status?: string;
  [key: string]: any;
}

export interface CompanyInfo {
  id: number;
  name?: string;
  tenantId?: number;
  [key: string]: any;
}

export interface CompanyAnalysis {
  companyId: number;
  companyName: string;
  previousAnalysis?: AnalysisMetadata;
  previousStrategies?: Strategy[];
  previousBacklog?: BacklogItem[];
  previousOpportunities?: Opportunity[];
  isNewAnalysis: boolean;
  generatedAt: string;
}

export interface AnalysisMetadata {
  id?: number;
  companyId: number;
  analysisType: string;
  summary: string;
  score?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface Strategy {
  id?: number;
  companyId: number;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  expectedImpact?: string;
  createdAt?: string;
}

export interface BacklogItem {
  id?: number;
  companyId: number;
  title: string;
  description: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  createdAt?: string;
}

export interface Opportunity {
  id?: number;
  companyId: number;
  title: string;
  description: string;
  potentialRevenue?: number;
  probability?: number;
  stage: 'IDENTIFIED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  createdAt?: string;
}

export interface LearningCycle {
  id?: number;
  cycleType: 'SCHEMA_CHANGE' | 'NEW_TABLE' | 'DROPPED_TABLE' | 'MODIFIED_TABLE';
  description: string;
  details?: Record<string, any>;
  resolved: boolean;
  createdAt?: string;
}

export interface DiscoveryStats {
  totalTables: number;
  totalEntities: number;
  totalRelationships: number;
  totalViews: number;
  totalProcedures: number;
  activeTenants: number;
  lastDiscoveryAt?: string;
  lastAnalysisAt?: string;
  lastLearningAt?: string;
}

export type DiscoveryStatus = 'idle' | 'discovering' | 'completed' | 'error';
export type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error';
export type LearningStatus = 'idle' | 'learning' | 'completed' | 'error';

// ============================================================
// CLOUD-207: Marketing Agent Live Dashboard Types
// ============================================================

/** Possible real-time statuses for a marketing agent */
export type MarketingAgentStatus = 'idle' | 'working' | 'waiting' | 'error';

/** A single marketing agent with live status */
export interface MarketingAgent {
  /** Unique agent identifier */
  id: string;
  /** Display name */
  name: string;
  /** Current real-time status */
  status: MarketingAgentStatus;
  /** Human-readable description of the current task */
  currentTask: string;
  /** ISO-8601 timestamp of the last activity */
  lastActivity: string;
  /** Optional avatar URL */
  avatarUrl?: string;
}

/** Payload emitted when an agent changes status */
export interface AgentStatusUpdatePayload {
  agentId: string;
  status: MarketingAgentStatus;
  lastActivity: string;
}

/** Payload emitted when an agent changes its current task */
export interface AgentTaskUpdatePayload {
  agentId: string;
  currentTask: string;
  lastActivity: string;
}

/** Directed connection between two agents in the flow graph */
export interface AgentConnection {
  /** Source agent id */
  from: string;
  /** Target agent id */
  to: string;
  /** Optional label describing the relationship */
  label?: string;
}

/** A marketing action event for the history timeline */
export interface MarketingActionEvent {
  /** Unique event id */
  id: string;
  /** Agent that performed the action */
  agentId: string;
  /** Agent display name (denormalised for convenience) */
  agentName: string;
  /** Type of action performed */
  actionType: string;
  /** Human-readable description */
  description: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/** Response shape for the marketing history REST endpoint */
export interface MarketingHistoryResponse {
  agents: MarketingAgent[];
  connections: AgentConnection[];
  recentEvents: MarketingActionEvent[];
  generatedAt: string;
}
