// ============================================================
// CLOUD-207: Marketing Agent Live Dashboard Types — FINAL SPEC
// ============================================================
// This file is the single source of truth for all TypeScript types
// used by the Marketing Live Dashboard feature (CLOUD-200).
//
// Consumed by:
//   • useMarketingAgentsSocket hook  (CLOUD-213)
//   • marketingHistoryService        (CLOUD-212)
//   • page.tsx and all UI components (CLOUD-202–CLOUD-206)
//
// Last updated: 2025-07-19 — System Architect specification
// ============================================================

// ============================================================
// CLOUD-199 Types (existing — DO NOT MODIFY)
// ============================================================

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

/**
 * Union type for all possible real-time statuses of a marketing agent.
 * Used across the dashboard for status badges, color coding, and filtering.
 *
 * 'idle'     — Agent is online but not currently working on any task.
 * 'working'  — Agent is actively executing a task.
 * 'waiting'  — Agent is paused, waiting for input or a dependency.
 * 'error'    — Agent encountered an error and cannot proceed.
 * 'completed'— Agent has finished its current task successfully.
 */
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error' | 'completed';

/**
 * A single marketing agent with live status information.
 * This is the core entity displayed on the dashboard.
 */
export interface MarketingAgent {
  /** Unique agent identifier (e.g., "researcher", "icp_agent", "copywriter") */
  id: string;
  /** Internal code/name for the agent */
  name: string;
  /** Human-readable display name (e.g., "Investigador de Mercado") */
  displayName: string;
  /** Role description of the agent */
  role: string;
  /** Current real-time status */
  status: AgentStatus;
  /** Description of the current task, or null if idle */
  currentTask: string | null;
  /** ISO-8601 timestamp when the current task started, or null */
  taskStartedAt: string | null;
  /** ISO-8601 timestamp of the last activity */
  lastActivity: string;
  /** Optional avatar URL */
  avatar?: string;
  /** Hex color for the agent's visual representation */
  color: string;
  /** Position in the flow graph (x, y coordinates) */
  position: { x: number; y: number };
}

/**
 * Directed connection between two agents in the flow graph.
 * Represents the data/workflow relationship between agents.
 */
export interface AgentConnection {
  /** Unique connection identifier */
  id: string;
  /** Source agent id */
  sourceAgentId: string;
  /** Target agent id */
  targetAgentId: string;
  /** Optional label describing the relationship */
  label: string;
  /** Type of data flowing between agents */
  dataFlow: 'leads' | 'analysis' | 'messages' | 'context';
  /** Whether the connection is currently active */
  active: boolean;
}

/**
 * A marketing action event for the history timeline.
 * Represents a significant action performed by an agent.
 */
export interface MarketingActionEvent {
  /** Unique event identifier */
  id: string;
  /** Type of action performed — maps to timeline color coding */
  type: 'lead_search_started' | 'lead_search_completed' | 'campaign_created' |
        'message_sent' | 'analysis_completed' | 'crew_kickoff' | 'flow_transition' | 'error';
  /** Short title for the event */
  title: string;
  /** Human-readable description of the event */
  description: string;
  /** Agent that performed the action */
  agentId: string;
  /** ISO-8601 timestamp of the event */
  timestamp: string;
  /** Optional metadata for additional context */
  metadata: Record<string, any>;
}

/**
 * Response shape for the marketing history REST endpoint.
 * Used for paginated history queries.
 */
export interface MarketingHistoryResponse {
  /** Array of action events */
  events: MarketingActionEvent[];
  /** Total number of events available */
  total: number;
  /** Whether there are more events to load */
  hasMore: boolean;
}

/**
 * Payload emitted via WebSocket when an agent's status changes.
 */
export interface AgentStatusUpdatePayload {
  /** Agent identifier */
  agentId: string;
  /** Agent display name (denormalized for convenience) */
  agentName: string;
  /** New status */
  status: AgentStatus;
  /** Current task description, or null */
  currentTask: string | null;
  /** ISO-8601 timestamp when the task started, or null */
  taskStartedAt: string | null;
  /** ISO-8601 timestamp of the last activity */
  lastActivity: string;
  /** Tenant identifier for multi-tenant filtering */
  tenantId: number;
  /** Company identifier for scoped queries */
  companyId: number;
}

/**
 * Payload emitted via WebSocket when an agent's task changes.
 */
export interface AgentTaskUpdatePayload {
  /** Agent identifier */
  agentId: string;
  /** Task identifier */
  taskId: string;
  /** Task name */
  taskName: string;
  /** Task description */
  taskDescription: string;
  /** Task status */
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  /** Task progress (0-100) */
  progress: number;
  /** Task output, or null */
  output: string | null;
  /** ISO-8601 timestamp */
  timestamp: string;
}

/**
 * Batch payload for initial full snapshot or periodic refresh.
 * Contains the complete state of all agents and connections.
 */
export interface MarketingAgentBatchPayload {
  /** Array of all marketing agents */
  agents: MarketingAgent[];
  /** Array of all agent connections */
  connections: AgentConnection[];
  /** ISO-8601 timestamp of the snapshot */
  timestamp: string;
}
