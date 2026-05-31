'use client'

import { useEffect, useCallback, useState } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import type {
  MarketingAgent,
  AgentConnection,
  MarketingActionEvent,
  AgentStatusUpdatePayload,
  AgentTaskUpdatePayload
} from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Hook return shape
// ---------------------------------------------------------------------------

export interface UseMarketingAgentsSocketReturn {
  /** Current list of marketing agents with live status */
  agents: MarketingAgent[];
  /** Directed connections between agents for the flow graph */
  connections: AgentConnection[];
  /** Recent action events for the history timeline */
  recentEvents: MarketingActionEvent[];
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Manually reconnect (useful after network issues) */
  reconnect: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom React hook that extends the shared SocketContext to listen for
 * marketing-specific real-time events.
 *
 * Expected socket events (server → client):
 *   • marketing-agent-batch-update  – initial / periodic full snapshot
 *   • marketing-agent-status-update – single agent status change
 *   • marketing-agent-task-update   – single agent task change
 *   • marketing-action-event        – new action for the history timeline
 */
export const useMarketingAgentsSocket = (): UseMarketingAgentsSocketReturn => {
  const { socket, isConnected } = useSocket()

  const [agents, setAgents] = useState<MarketingAgent[]>([])
  const [connections, setConnections] = useState<AgentConnection[]>([])
  const [recentEvents, setRecentEvents] = useState<MarketingActionEvent[]>([])

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  /** Replace the full agent list (initial load or periodic refresh) */
  const handleBatchUpdate = useCallback((payload: MarketingAgent[]) => {
    if (!Array.isArray(payload)) return
    setAgents(payload)
  }, [])

  /** Update a single agent's status */
  const handleStatusUpdate = useCallback((payload: AgentStatusUpdatePayload) => {
    if (!payload?.agentId) return
    setAgents(prev =>
      prev.map(agent =>
        agent.id === payload.agentId
          ? { ...agent, status: payload.status, lastActivity: payload.lastActivity }
          : agent
      )
    )
  }, [])

  /** Update a single agent's current task */
  const handleTaskUpdate = useCallback((payload: AgentTaskUpdatePayload) => {
    if (!payload?.agentId) return
    setAgents(prev =>
      prev.map(agent =>
        agent.id === payload.agentId
          ? { ...agent, currentTask: payload.currentTask, lastActivity: payload.lastActivity }
          : agent
      )
    )
  }, [])

  /** Append a new action event to the timeline (keep last 50) */
  const handleActionEvent = useCallback((payload: MarketingActionEvent) => {
    if (!payload?.id) return
    setRecentEvents(prev => {
      // Deduplicate by id
      if (prev.some(ev => ev.id === payload.id)) return prev
      const updated = [...prev, payload]
      // Keep only the last 50 events
      return updated.slice(-50)
    })
  }, [])

  // -----------------------------------------------------------------------
  // Subscribe / unsubscribe socket listeners
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!socket) return

    socket.on('marketing-agent-batch-update', handleBatchUpdate)
    socket.on('marketing-agent-status-update', handleStatusUpdate)
    socket.on('marketing-agent-task-update', handleTaskUpdate)
    socket.on('marketing-action-event', handleActionEvent)

    return () => {
      socket.off('marketing-agent-batch-update', handleBatchUpdate)
      socket.off('marketing-agent-status-update', handleStatusUpdate)
      socket.off('marketing-agent-task-update', handleTaskUpdate)
      socket.off('marketing-action-event', handleActionEvent)
    }
  }, [socket, handleBatchUpdate, handleStatusUpdate, handleTaskUpdate, handleActionEvent])

  // -----------------------------------------------------------------------
  // Reconnect helper
  // -----------------------------------------------------------------------

  const reconnect = useCallback(() => {
    if (!socket) return
    socket.disconnect()
    socket.connect()
  }, [socket])

  return {
    agents,
    connections,
    recentEvents,
    isConnected,
    reconnect
  }
}
