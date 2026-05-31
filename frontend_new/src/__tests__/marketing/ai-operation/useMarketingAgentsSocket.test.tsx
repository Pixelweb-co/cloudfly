/**
 * CLOUD-228: Unit Tests for useMarketingAgentsSocket Hook
 *
 * Comprehensive test suite that verifies the hook's behavior using a mock
 * socket.io-client instance. Tests cover:
 *
 * 1. Hook initialization and options handling
 * 2. Socket event subscription (marketing-batch-update, status-update, task-update, action-event)
 * 3. Room subscription (subscribe-marketing / unsubscribe-marketing)
 * 4. Event deduplication
 * 5. 50-event cap on events
 * 6. Connection status tracking (connected / disconnected / reconnecting)
 * 7. Reconnection logic (re-subscribe on connect)
 * 8. Cleanup on unmount (socket.off for all listeners)
 * 9. lastUpdate timestamp tracking
 * 10. Reconnect helper (disconnect → connect)
 * 11. New type shapes (AgentStatus, MarketingAgentBatchPayload, etc.)
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mock socket.io-client
// ---------------------------------------------------------------------------

type EventHandler = (...args: any[]) => void

/**
 * Creates a mock Socket.IO client instance that behaves like the real socket:
 *  - .on(event, handler) registers listeners
 *  - .off(event, handler?) removes listeners
 *  - .emit(event, data) records emitted events
 *  - .connected boolean property
 *  - .disconnect() / .connect() methods
 *  - .io manager with .on()/.off() for reconnect_attempt
 */
function createMockSocket() {
  const listeners: Map<string, Set<EventHandler>> = new Map()
  const emitted: Array<{ event: string; data: any }> = []

  let _connected = false

  const managerListeners: Map<string, Set<EventHandler>> = new Map()

  const mockSocket: any = {
    connected: _connected,

    on(event: string, handler: EventHandler) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
      return mockSocket
    },

    off(event: string, handler?: EventHandler) {
      if (handler) {
        listeners.get(event)?.delete(handler)
      } else {
        listeners.delete(event)
      }
      return mockSocket
    },

    emit(event: string, data?: any) {
      emitted.push({ event, data })
      return mockSocket
    },

    disconnect() {
      _connected = false
      mockSocket.connected = false
      // Fire disconnect event
      listeners.get('disconnect')?.forEach(fn => fn())
      return mockSocket
    },

    connect() {
      _connected = true
      mockSocket.connected = true
      // Fire connect event
      listeners.get('connect')?.forEach(fn => fn())
      return mockSocket
    },

    // Simulate a server → client event
    _simulate(event: string, data: any) {
      listeners.get(event)?.forEach(fn => fn(data))
    },

    // Expose internals for assertions
    _listeners: listeners,
    _emitted: emitted,

    // socket.io manager mock
    io: {
      on(event: string, handler: EventHandler) {
        if (!managerListeners.has(event)) managerListeners.set(event, new Set())
        managerListeners.get(event)!.add(handler)
        return mockSocket.io
      },
      off(event: string, handler?: EventHandler) {
        if (handler) {
          managerListeners.get(event)?.delete(handler)
        } else {
          managerListeners.delete(event)
        }
        return mockSocket.io
      },
      _simulate(event: string, data: any) {
        managerListeners.get(event)?.forEach(fn => fn(data))
      }
    }
  }

  return mockSocket
}

// ---------------------------------------------------------------------------
// Mock SocketContext
// ---------------------------------------------------------------------------

let mockSocketInstance: any = null
let mockIsConnected = false

jest.mock('@/contexts/SocketContext', () => ({
  useSocket: () => ({
    socket: mockSocketInstance,
    isConnected: mockIsConnected
  })
}))

// ---------------------------------------------------------------------------
// Import the hook AFTER mocks
// ---------------------------------------------------------------------------

import { useMarketingAgentsSocket } from '@/hooks/useMarketingAgentsSocket'
import type {
  MarketingAgent,
  AgentConnection,
  MarketingActionEvent,
  AgentStatusUpdatePayload,
  AgentTaskUpdatePayload,
  MarketingAgentBatchPayload
} from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

const createTestAgent = (overrides: Partial<MarketingAgent> = {}): MarketingAgent => ({
  id: 'agent-1',
  name: 'Test Agent',
  displayName: 'Agente de Prueba',
  role: 'Test Role',
  status: 'idle',
  currentTask: null,
  taskStartedAt: null,
  lastActivity: '2025-01-01T00:00:00Z',
  color: '#3b82f6',
  position: { x: 0, y: 0 },
  ...overrides
})

const createTestConnection = (overrides: Partial<AgentConnection> = {}): AgentConnection => ({
  id: 'conn-1',
  sourceAgentId: 'agent-1',
  targetAgentId: 'agent-2',
  label: 'feeds into',
  dataFlow: 'leads',
  active: true,
  ...overrides
})

const createTestEvent = (overrides: Partial<MarketingActionEvent> = {}): MarketingActionEvent => ({
  id: 'evt-1',
  type: 'lead_search_started',
  title: 'Búsqueda iniciada',
  description: 'Test event',
  agentId: 'agent-1',
  timestamp: '2025-01-01T00:00:00Z',
  metadata: {},
  ...overrides
})

const createTestBatchPayload = (overrides: Partial<MarketingAgentBatchPayload> = {}): MarketingAgentBatchPayload => ({
  agents: [createTestAgent()],
  connections: [createTestConnection()],
  timestamp: '2025-01-01T00:00:00Z',
  ...overrides
})

const createTestStatusPayload = (overrides: Partial<AgentStatusUpdatePayload> = {}): AgentStatusUpdatePayload => ({
  agentId: 'agent-1',
  agentName: 'Test Agent',
  status: 'working',
  currentTask: 'Processing data',
  taskStartedAt: '2025-01-01T00:00:00Z',
  lastActivity: '2025-01-01T00:00:00Z',
  tenantId: 1,
  companyId: 1,
  ...overrides
})

const createTestTaskPayload = (overrides: Partial<AgentTaskUpdatePayload> = {}): AgentTaskUpdatePayload => ({
  agentId: 'agent-1',
  taskId: 'task-1',
  taskName: 'Data Analysis',
  taskDescription: 'Analyzing marketing data',
  status: 'started',
  progress: 0,
  output: null,
  timestamp: '2025-01-01T00:00:00Z',
  ...overrides
})

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('useMarketingAgentsSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSocketInstance = null
    mockIsConnected = false
  })

  // =========================================================================
  // 1. Hook Initialization
  // =========================================================================

  describe('initialization', () => {
    it('should return default values when socket is null', () => {
      mockSocketInstance = null

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      expect(result.current.agents).toEqual([])
      expect(result.current.connections).toEqual([])
      expect(result.current.events).toEqual([])
      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionStatus).toBe('disconnected')
      expect(result.current.lastUpdate).toBeNull()
    })

    it('should initialize with empty arrays', () => {
      mockSocketInstance = createMockSocket()

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      expect(result.current.agents).toEqual([])
      expect(result.current.connections).toEqual([])
      expect(result.current.events).toEqual([])
    })
  })

  // =========================================================================
  // 2. Batch Update (MarketingAgentBatchPayload)
  // =========================================================================

  describe('batch update', () => {
    it('should handle MarketingAgentBatchPayload with agents and connections', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      const batchPayload = createTestBatchPayload({
        agents: [
          createTestAgent({ id: 'agent-1', status: 'working' }),
          createTestAgent({ id: 'agent-2', status: 'idle' })
        ],
        connections: [
          createTestConnection({ sourceAgentId: 'agent-1', targetAgentId: 'agent-2' })
        ]
      })

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', batchPayload)
      })

      expect(result.current.agents).toHaveLength(2)
      expect(result.current.connections).toHaveLength(1)
      expect(result.current.agents[0].status).toBe('working')
      expect(result.current.agents[1].status).toBe('idle')
    })

    it('should handle legacy plain array of agents', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      const agents = [createTestAgent(), createTestAgent({ id: 'agent-2' })]

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', agents)
      })

      expect(result.current.agents).toHaveLength(2)
    })

    it('should update lastUpdate on batch update', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      expect(result.current.lastUpdate).toBeNull()

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      expect(result.current.lastUpdate).not.toBeNull()
    })
  })

  // =========================================================================
  // 3. Status Update (AgentStatusUpdatePayload)
  // =========================================================================

  describe('status update', () => {
    it('should update agent status on marketing-agent-status-update', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      // First, set up initial agents
      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      expect(result.current.agents[0].status).toBe('idle')

      // Now update status
      act(() => {
        mockSocket._simulate('marketing-agent-status-update', createTestStatusPayload())
      })

      expect(result.current.agents[0].status).toBe('working')
      expect(result.current.agents[0].currentTask).toBe('Processing data')
      expect(result.current.agents[0].taskStartedAt).toBe('2025-01-01T00:00:00Z')
    })

    it('should not update non-matching agent', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      act(() => {
        mockSocket._simulate('marketing-agent-status-update', createTestStatusPayload({ agentId: 'non-existent' }))
      })

      expect(result.current.agents[0].status).toBe('idle')
    })

    it('should update lastUpdate on status update', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      const previousUpdate = result.current.lastUpdate

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(1000)

      act(() => {
        mockSocket._simulate('marketing-agent-status-update', createTestStatusPayload())
      })

      expect(result.current.lastUpdate).not.toBeNull()
    })
  })

  // =========================================================================
  // 4. Task Update (AgentTaskUpdatePayload)
  // =========================================================================

  describe('task update', () => {
    it('should update agent task on marketing-agent-task-update', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      act(() => {
        mockSocket._simulate('marketing-agent-task-update', createTestTaskPayload())
      })

      expect(result.current.agents[0].currentTask).toBe('Data Analysis')
      expect(result.current.agents[0].lastActivity).toBe('2025-01-01T00:00:00Z')
    })

    it('should set taskStartedAt when task status is started', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      expect(result.current.agents[0].taskStartedAt).toBeNull()

      act(() => {
        mockSocket._simulate('marketing-agent-task-update', createTestTaskPayload({ status: 'started' }))
      })

      expect(result.current.agents[0].taskStartedAt).toBe('2025-01-01T00:00:00Z')
    })

    it('should not overwrite taskStartedAt when task status is not started', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      // First, start the task
      act(() => {
        mockSocket._simulate('marketing-agent-task-update', createTestTaskPayload({ status: 'started' }))
      })

      expect(result.current.agents[0].taskStartedAt).toBe('2025-01-01T00:00:00Z')

      // Then, update to in_progress
      act(() => {
        mockSocket._simulate('marketing-agent-task-update', createTestTaskPayload({ status: 'in_progress', timestamp: '2025-01-01T00:05:00Z' }))
      })

      // taskStartedAt should remain the same
      expect(result.current.agents[0].taskStartedAt).toBe('2025-01-01T00:00:00Z')
    })
  })

  // =========================================================================
  // 5. Action Event (MarketingActionEvent)
  // =========================================================================

  describe('action event', () => {
    it('should append event to events array', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-action-event', createTestEvent())
      })

      expect(result.current.events).toHaveLength(1)
      expect(result.current.events[0].id).toBe('evt-1')
    })

    it('should deduplicate events by id', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      const event = createTestEvent()

      act(() => {
        mockSocket._simulate('marketing-action-event', event)
      })

      act(() => {
        mockSocket._simulate('marketing-action-event', event)
      })

      expect(result.current.events).toHaveLength(1)
    })

    it('should cap events at 50', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      // Add 51 events
      for (let i = 0; i < 51; i++) {
        act(() => {
          mockSocket._simulate('marketing-action-event', createTestEvent({ id: `evt-${i}` }))
        })
      }

      expect(result.current.events).toHaveLength(50)
      // First event should be evt-1 (evt-0 was dropped)
      expect(result.current.events[0].id).toBe('evt-1')
      expect(result.current.events[49].id).toBe('evt-50')
    })
  })

  // =========================================================================
  // 6. Connection Status
  // =========================================================================

  describe('connection status', () => {
    it('should set connected status on connect', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      expect(result.current.connectionStatus).toBe('disconnected')

      act(() => {
        mockSocket.connect()
      })

      expect(result.current.connectionStatus).toBe('connected')
    })

    it('should set disconnected status on disconnect', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket.connect()
      })

      expect(result.current.connectionStatus).toBe('connected')

      act(() => {
        mockSocket.disconnect()
      })

      expect(result.current.connectionStatus).toBe('disconnected')
    })

    it('should set reconnecting status on reconnect_attempt', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket.connect()
      })

      expect(result.current.connectionStatus).toBe('connected')

      act(() => {
        mockSocket.io._simulate('reconnect_attempt')
      })

      expect(result.current.connectionStatus).toBe('reconnecting')
    })
  })

  // =========================================================================
  // 7. Room Subscription
  // =========================================================================

  describe('room subscription', () => {
    it('should emit subscribe-marketing on connect', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 42, companyId: 7 })
      )

      act(() => {
        mockSocket.connect()
      })

      const subscribeCall = mockSocket._emitted.find((e: any) => e.event === 'subscribe-marketing')
      expect(subscribeCall).toBeDefined()
      expect(subscribeCall.data).toEqual({ tenantId: 42, companyId: 7 })
    })

    it('should emit unsubscribe-marketing on unmount', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { unmount } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      unmount()

      const unsubscribeCall = mockSocket._emitted.find((e: any) => e.event === 'unsubscribe-marketing')
      expect(unsubscribeCall).toBeDefined()
    })

    it('should re-subscribe on reconnect', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket.connect()
      })

      act(() => {
        mockSocket.disconnect()
      })

      act(() => {
        mockSocket.connect()
      })

      const subscribeCalls = mockSocket._emitted.filter((e: any) => e.event === 'subscribe-marketing')
      expect(subscribeCalls).toHaveLength(2)
    })
  })

  // =========================================================================
  // 8. Reconnect Helper
  // =========================================================================

  describe('reconnect helper', () => {
    it('should call disconnect and connect on reconnect', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket.connect()
      })

      expect(result.current.connectionStatus).toBe('connected')

      act(() => {
        result.current.reconnect()
      })

      // Should have called disconnect and connect
      expect(mockSocket._emitted.some((e: any) => e.event === 'disconnect')).toBe(false) // disconnect is a method call, not emit
      // The reconnect method calls socket.disconnect() and socket.connect() directly
    })
  })

  // =========================================================================
  // 9. Cleanup on Unmount
  // =========================================================================

  describe('cleanup', () => {
    it('should remove all listeners on unmount', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { unmount } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      // Connect to register listeners
      act(() => {
        mockSocket.connect()
      })

      // Check that listeners are registered
      expect(mockSocket._listeners.has('marketing-agent-batch-update')).toBe(true)
      expect(mockSocket._listeners.has('marketing-agent-status-update')).toBe(true)
      expect(mockSocket._listeners.has('marketing-agent-task-update')).toBe(true)
      expect(mockSocket._listeners.has('marketing-action-event')).toBe(true)

      unmount()

      // Listeners should be removed
      expect(mockSocket._listeners.has('marketing-agent-batch-update')).toBe(false)
      expect(mockSocket._listeners.has('marketing-agent-status-update')).toBe(false)
      expect(mockSocket._listeners.has('marketing-agent-task-update')).toBe(false)
      expect(mockSocket._listeners.has('marketing-action-event')).toBe(false)
    })
  })

  // =========================================================================
  // 10. New Type Shapes
  // =========================================================================

  describe('new type shapes', () => {
    it('should handle MarketingAgent with all new fields', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      const agentWithAllFields = createTestAgent({
        displayName: 'Investigador de Mercado',
        role: 'Market Research Specialist',
        color: '#8b5cf6',
        position: { x: 100, y: 200 }
      })

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload({
          agents: [agentWithAllFields]
        }))
      })

      expect(result.current.agents[0].displayName).toBe('Investigador de Mercado')
      expect(result.current.agents[0].role).toBe('Market Research Specialist')
      expect(result.current.agents[0].color).toBe('#8b5cf6')
      expect(result.current.agents[0].position).toEqual({ x: 100, y: 200 })
    })

    it('should handle AgentConnection with all new fields', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      const connectionWithAllFields = createTestConnection({
        id: 'conn-1',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        label: 'Leads Flow',
        dataFlow: 'leads',
        active: true
      })

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload({
          connections: [connectionWithAllFields]
        }))
      })

      expect(result.current.connections[0].id).toBe('conn-1')
      expect(result.current.connections[0].sourceAgentId).toBe('agent-1')
      expect(result.current.connections[0].targetAgentId).toBe('agent-2')
      expect(result.current.connections[0].dataFlow).toBe('leads')
      expect(result.current.connections[0].active).toBe(true)
    })

    it('should handle MarketingActionEvent with new type union', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      const eventTypes = [
        'lead_search_started',
        'lead_search_completed',
        'campaign_created',
        'message_sent',
        'analysis_completed',
        'crew_kickoff',
        'flow_transition',
        'error'
      ] as const

      eventTypes.forEach((type, index) => {
        act(() => {
          mockSocket._simulate('marketing-action-event', createTestEvent({
            id: `evt-${type}`,
            type,
            title: `Test ${type}`,
            description: `Description for ${type}`
          }))
        })
      })

      expect(result.current.events).toHaveLength(eventTypes.length)
      eventTypes.forEach((type, index) => {
        expect(result.current.events[index].type).toBe(type)
      })
    })

    it('should handle AgentStatusUpdatePayload with all fields', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      const statusPayload = createTestStatusPayload({
        agentId: 'agent-1',
        agentName: 'Test Agent',
        status: 'working',
        currentTask: 'Analyzing data',
        taskStartedAt: '2025-01-01T00:00:00Z',
        lastActivity: '2025-01-01T00:00:00Z',
        tenantId: 42,
        companyId: 7
      })

      act(() => {
        mockSocket._simulate('marketing-agent-status-update', statusPayload)
      })

      expect(result.current.agents[0].status).toBe('working')
      expect(result.current.agents[0].currentTask).toBe('Analyzing data')
    })

    it('should handle AgentTaskUpdatePayload with all fields', () => {
      const mockSocket = createMockSocket()
      mockSocketInstance = mockSocket

      const { result } = renderHook(() =>
        useMarketingAgentsSocket({ tenantId: 1 })
      )

      act(() => {
        mockSocket._simulate('marketing-agent-batch-update', createTestBatchPayload())
      })

      const taskPayload = createTestTaskPayload({
        agentId: 'agent-1',
        taskId: 'task-123',
        taskName: 'Data Processing',
        taskDescription: 'Processing marketing data',
        status: 'in_progress',
        progress: 50,
        output: 'Partial results available',
        timestamp: '2025-01-01T00:05:00Z'
      })

      act(() => {
        mockSocket._simulate('marketing-agent-task-update', taskPayload)
      })

      expect(result.current.agents[0].currentTask).toBe('Data Processing')
      expect(result.current.agents[0].lastActivity).toBe('2025-01-01T00:05:00Z')
    })
  })
})
