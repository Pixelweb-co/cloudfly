'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import type {
  MarketingAgent,
  AgentConnection,
  MarketingActionEvent,
  AgentStatusUpdatePayload,
  AgentTaskUpdatePayload,
  MarketingAgentBatchPayload,
  AgentStatus
} from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Options & Return Types
// ---------------------------------------------------------------------------

export interface UseMarketingAgentsSocketOptions {
  tenantId: number;
  companyId?: number;
}

export interface UseMarketingAgentsSocketReturn {
  /** Current list of marketing agents with live status */
  agents: MarketingAgent[];
  /** Directed connections between agents for the flow graph */
  connections: AgentConnection[];
  /** Recent action events for the history timeline */
  events: MarketingActionEvent[];
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Detailed connection status */
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  /** ISO-8601 timestamp of the last received event, or null */
  lastUpdate: string | null;
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
 *   • marketing-batch-update        – initial / periodic full snapshot (MarketingAgentBatchPayload)
 *   • marketing-agent-status-update – single agent status change (AgentStatusUpdatePayload)
 *   • marketing-agent-task-update   – single agent task change (AgentTaskUpdatePayload)
 *   • marketing-action-event        – new action for the history timeline (MarketingActionEvent)
 *
 * Client → Server:
 *   • subscribe-marketing  – join room marketing_{tenantId}
 *   • unsubscribe-marketing – leave room
 */
export const useMarketingAgentsSocket = (
  options: UseMarketingAgentsSocketOptions
): UseMarketingAgentsSocketReturn => {
  const { socket, isConnected } = useSocket()

  const [agents, setAgents] = useState<MarketingAgent[]>([])
  const [connections, setConnections] = useState<AgentConnection[]>([])
  const [events, setEvents] = useState<MarketingActionEvent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // Track whether we are currently reconnecting (to set 'reconnecting' status)
  const reconnectingRef = useRef(false)

  // -----------------------------------------------------------------------
  // Helper: update lastUpdate timestamp
  // -----------------------------------------------------------------------

  const touchLastUpdate = useCallback(() => {
    setLastUpdate(new Date().toISOString())
  }, [])

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  /**
   * Replace the full agent list AND connections (initial load or periodic refresh).
   * Accepts either MarketingAgentBatchPayload or legacy plain array of agents.
   */
  const handleBatchUpdate = useCallback((payload: MarketingAgentBatchPayload | MarketingAgent[]) => {
    if (Array.isArray(payload)) {
      // Legacy: plain array of agents
      setAgents(payload)
    } else if (payload && typeof payload === 'object') {
      // New spec: MarketingAgentBatchPayload
      if (Array.isArray(payload.agents)) setAgents(payload.agents)
      if (Array.isArray(payload.connections)) setConnections(payload.connections)
    }
    touchLastUpdate()
  }, [touchLastUpdate])

  /**
   * Update a single agent's status based on AgentStatusUpdatePayload.
   * Fields updated: status, currentTask, taskStartedAt, lastActivity.
   */
  const handleStatusUpdate = useCallback((payload: AgentStatusUpdatePayload) => {
    if (!payload?.agentId) return
    setAgents(prev =>
      prev.map(agent =>
        agent.id === payload.agentId
          ? {
              ...agent,
              status: payload.status,
              currentTask: payload.currentTask,
              taskStartedAt: payload.taskStartedAt,
              lastActivity: payload.lastActivity
            }
          : agent
      )
    )
    touchLastUpdate()
  }, [touchLastUpdate])

  /**
   * Update a single agent's task based on AgentTaskUpdatePayload.
   * Fields updated: currentTask (from taskName), lastActivity (from timestamp).
   */
  const handleTaskUpdate = useCallback((payload: AgentTaskUpdatePayload) => {
    if (!payload?.agentId) return
    setAgents(prev =>
      prev.map(agent =>
        agent.id === payload.agentId
          ? {
              ...agent,
              currentTask: payload.taskName,
              taskStartedAt: payload.status === 'started' ? payload.timestamp : agent.taskStartedAt,
              lastActivity: payload.timestamp
            }
          : agent
      )
    )
    touchLastUpdate()
  }, [touchLastUpdate])

  /** Append a new action event to the timeline (keep last 50) */
  const handleActionEvent = useCallback((payload: MarketingActionEvent) => {
    if (!payload?.id) return
    setEvents(prev => {
      // Deduplicate by id
      if (prev.some(ev => ev.id === payload.id)) return prev
      const updated = [...prev, payload]
      // Keep only the last 50 events
      return updated.slice(-50)
    })
    touchLastUpdate()
  }, [touchLastUpdate])

  // -----------------------------------------------------------------------
  // Subscribe / unsubscribe marketing room
  // -----------------------------------------------------------------------

  const subscribe = useCallback(() => {
    if (!socket) return
    socket.emit('subscribe-marketing', {
      tenantId: options.tenantId,
      companyId: options.companyId
    })
  }, [socket, options.tenantId, options.companyId])

  const unsubscribe = useCallback(() => {
    if (!socket) return
    socket.emit('unsubscribe-marketing', {
      tenantId: options.tenantId,
      companyId: options.companyId
    })
  }, [socket, options.tenantId, options.companyId])

  // -----------------------------------------------------------------------
  // Socket event listeners (marketing events)
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
  // Connection status tracking + room subscription
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!socket) return

    const onConnect = () => {
      setConnectionStatus('connected')
      reconnectingRef.current = false
      // Re-subscribe on (re)connect
      subscribe()
    }

    const onDisconnect = () => {
      if (reconnectingRef.current) {
        setConnectionStatus('reconnecting')
      } else {
        setConnectionStatus('disconnected')
      }
    }

    const onReconnecting = () => {
      reconnectingRef.current = true
      setConnectionStatus('reconnecting')
    }

    // Listen for socket.io built-in events
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // socket.io-client does not have a built-in 'reconnecting' event on the socket instance,
    // but we can detect reconnection attempts via the socket.io manager
    const manager = (socket as any).io
    if (manager && manager.on) {
      manager.on('reconnect_attempt', onReconnecting)
    }

    // If already connected, subscribe immediately
    if (socket.connected) {
      setConnectionStatus('connected')
      subscribe()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      if (manager && manager.off) {
        manager.off('reconnect_attempt', onReconnecting)
      }
      // Unsubscribe on unmount
      unsubscribe()
    }
  }, [socket, subscribe, unsubscribe])

  // -----------------------------------------------------------------------
  // Reconnect helper
  // -----------------------------------------------------------------------

  const reconnect = useCallback(() => {
    if (!socket) return
    reconnectingRef.current = true
    setConnectionStatus('reconnecting')
    socket.disconnect()
    socket.connect()
  }, [socket])

  return {
    agents,
    connections,
    events,
    isConnected,
    connectionStatus,
    lastUpdate,
    reconnect
  }
}
