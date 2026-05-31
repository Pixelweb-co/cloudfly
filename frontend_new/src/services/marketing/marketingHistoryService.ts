import axiosInstance from '@/utils/axiosInstance'
import type {
  MarketingAgent,
  AgentConnection,
  MarketingHistoryResponse,
  MarketingActionEvent
} from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Base URL helper
// ---------------------------------------------------------------------------

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketing`

// ---------------------------------------------------------------------------
// marketingHistoryService
// ---------------------------------------------------------------------------

/**
 * REST service for fetching the initial marketing dashboard data
 * (agents, connections, and recent history).
 *
 * These endpoints are called once on mount to provide the initial state
 * before WebSocket events start flowing in.
 *
 * All methods support optional AbortSignal for request cancellation
 * on component unmount.
 *
 * Specification: CLOUD-212 (System Architect)
 */
export const marketingHistoryService = {

  /**
   * Fetch current agent states (for initial load / reconnection fallback).
   * GET /api/v1/marketing/agents/live-status?tenantId={}&companyId={}
   *
   * @param tenantId  - Mandatory tenant identifier
   * @param companyId - Optional company identifier for scoped queries
   * @param signal    - Optional AbortSignal for request cancellation
   * @returns Object containing agents array and connections array
   */
  async getLiveAgents(
    tenantId: number,
    companyId?: number,
    signal?: AbortSignal
  ): Promise<{ agents: MarketingAgent[]; connections: AgentConnection[] }> {
    try {
      const params = new URLSearchParams()
      params.append('tenantId', String(tenantId))
      if (companyId) params.append('companyId', String(companyId))

      const { data } = await axiosInstance.get<{
        agents: MarketingAgent[]
        connections: AgentConnection[]
      }>(`${API_URL}/agents/live-status?${params}`, { signal })

      return data
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return { agents: [], connections: [] }
      }
      console.error('[marketingHistoryService] getLiveAgents error:', error)
      return { agents: [], connections: [] }
    }
  },

  /**
   * Fetch action history for the timeline.
   * GET /api/v1/marketing/agents/history?tenantId={}&limit={}&page={}&companyId={}
   *
   * @param tenantId  - Mandatory tenant identifier
   * @param limit     - Maximum number of events to return (default: 50)
   * @param page      - Page number for pagination (default: 0)
   * @param companyId - Optional company identifier for scoped queries
   * @param signal    - Optional AbortSignal for request cancellation
   * @returns MarketingHistoryResponse with recent action events
   */
  async getActionHistory(
    tenantId: number,
    limit = 50,
    page = 0,
    companyId?: number,
    signal?: AbortSignal
  ): Promise<MarketingHistoryResponse> {
    try {
      const params = new URLSearchParams()
      params.append('tenantId', String(tenantId))
      params.append('limit', String(limit))
      params.append('page', String(page))
      if (companyId) params.append('companyId', String(companyId))

      const { data } = await axiosInstance.get<MarketingHistoryResponse>(
        `${API_URL}/agents/history?${params}`,
        { signal }
      )

      return data
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return { agents: [], connections: [], recentEvents: [], generatedAt: new Date().toISOString() }
      }
      console.error('[marketingHistoryService] getActionHistory error:', error)
      return { agents: [], connections: [], recentEvents: [], generatedAt: new Date().toISOString() }
    }
  },

  /**
   * Fetch agent connections for the flow graph.
   * GET /api/v1/marketing/agents/connections?tenantId={}
   *
   * @param tenantId - Mandatory tenant identifier
   * @param signal   - Optional AbortSignal for request cancellation
   * @returns Array of directed agent connections
   */
  async getAgentConnections(
    tenantId: number,
    signal?: AbortSignal
  ): Promise<AgentConnection[]> {
    try {
      const { data } = await axiosInstance.get<AgentConnection[]>(
        `${API_URL}/agents/connections?tenantId=${tenantId}`,
        { signal }
      )

      return data
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return []
      }
      console.error('[marketingHistoryService] getAgentConnections error:', error)
      return []
    }
  },

  /**
   * Fetch tasks for a specific agent.
   * GET /api/v1/marketing/agents/{agentId}/tasks
   *
   * @param agentId - Unique agent identifier
   * @param signal  - Optional AbortSignal for request cancellation
   * @returns Array of marketing action events for the agent
   */
  async getAgentTasks(
    agentId: string,
    signal?: AbortSignal
  ): Promise<MarketingActionEvent[]> {
    try {
      const { data } = await axiosInstance.get<MarketingActionEvent[]>(
        `${API_URL}/agents/${agentId}/tasks`,
        { signal }
      )

      return data
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return []
      }
      console.error('[marketingHistoryService] getAgentTasks error:', error)
      return []
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect whether an error originates from an aborted request.
 * Axios wraps the DOMException in a CanceledError (axios >= 0.22) or
 * exposes the raw AbortError name.
 */
function isAbortError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const name = (error as { name?: string }).name
    if (name === 'AbortError' || name === 'CanceledError') return true
    // axios CanceledError sets code to 'ERR_CANCELED'
    const code = (error as { code?: string }).code
    if (code === 'ERR_CANCELED') return true
  }
  return false
}

export default marketingHistoryService
