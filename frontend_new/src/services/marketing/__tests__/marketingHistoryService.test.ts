// =============================================================================
// Unit Tests for marketingHistoryService (CLOUD-212)
// =============================================================================
// Tests cover:
//   1. All 4 exported methods exist with correct signatures
//   2. Methods call the correct API endpoints with correct query params
//   3. AbortSignal cancellation is handled silently
//   4. Non-abort errors return empty defaults
//   5. Backward compatibility (no signal param still works)
//   6. New MarketingHistoryResponse shape (events, total, hasMore)
// =============================================================================

// We mock axiosInstance so no real HTTP calls are made
const mockAxiosGet = jest.fn()

jest.mock('@/utils/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

// Import after mock is set up
import { marketingHistoryService } from '@/services/marketing/marketingHistoryService'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a resolved mock response */
function mockResponse<T>(data: T) {
  return Promise.resolve({ data })
}

/** Create a rejected mock error */
function mockError(message: string, name = 'Error', code?: string) {
  const error = new Error(message)
  error.name = name
  if (code) (error as any).code = code
  return Promise.reject(error)
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('marketingHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // =========================================================================
  // 1. Exports & Structure
  // =========================================================================

  describe('exports', () => {
    it('should export marketingHistoryService as an object', () => {
      expect(marketingHistoryService).toBeDefined()
      expect(typeof marketingHistoryService).toBe('object')
    })

    it('should export getLiveAgents method', () => {
      expect(typeof marketingHistoryService.getLiveAgents).toBe('function')
    })

    it('should export getActionHistory method', () => {
      expect(typeof marketingHistoryService.getActionHistory).toBe('function')
    })

    it('should export getAgentConnections method', () => {
      expect(typeof marketingHistoryService.getAgentConnections).toBe('function')
    })

    it('should export getAgentTasks method', () => {
      expect(typeof marketingHistoryService.getAgentTasks).toBe('function')
    })

    it('should have a default export', async () => {
      const mod = await import('@/services/marketing/marketingHistoryService')
      expect(mod.default).toBe(marketingHistoryService)
    })
  })

  // =========================================================================
  // 2. getLiveAgents
  // =========================================================================

  describe('getLiveAgents', () => {
    it('should call GET /api/v1/marketing/agents/live-status with tenantId', async () => {
      const fakeData = {
        agents: [{
          id: '1',
          name: 'Agent-1',
          displayName: 'Agente de Prueba',
          role: 'Test Role',
          status: 'idle' as const,
          currentTask: null,
          taskStartedAt: null,
          lastActivity: '2025-01-01T00:00:00Z',
          color: '#3b82f6',
          position: { x: 0, y: 0 }
        }],
        connections: [],
      }
      mockAxiosGet.mockReturnValueOnce(mockResponse(fakeData))

      const result = await marketingHistoryService.getLiveAgents(42)

      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
      const [url, config] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('/api/v1/marketing/agents/live-status')
      expect(url).toContain('tenantId=42')
      // When no signal is passed, axios receives { signal: undefined } — this is expected
      expect(config).toEqual({ signal: undefined })
      expect(result).toEqual(fakeData)
    })

    it('should include companyId when provided', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse({ agents: [], connections: [] }))

      await marketingHistoryService.getLiveAgents(42, 7)

      const [url] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('tenantId=42')
      expect(url).toContain('companyId=7')
    })

    it('should pass AbortSignal to axios config', async () => {
      const controller = new AbortController()
      mockAxiosGet.mockReturnValueOnce(mockResponse({ agents: [], connections: [] }))

      await marketingHistoryService.getLiveAgents(42, undefined, controller.signal)

      const [, config] = mockAxiosGet.mock.calls[0]
      expect(config).toEqual({ signal: controller.signal })
    })

    it('should return empty arrays on abort error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Aborted', 'AbortError'))

      const result = await marketingHistoryService.getLiveAgents(42)

      expect(result).toEqual({ agents: [], connections: [] })
    })

    it('should return empty arrays on axios CanceledError', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('canceled', 'CanceledError', 'ERR_CANCELED'))

      const result = await marketingHistoryService.getLiveAgents(42)

      expect(result).toEqual({ agents: [], connections: [] })
    })

    it('should return empty arrays on generic error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Network failure'))

      const result = await marketingHistoryService.getLiveAgents(42)

      expect(result).toEqual({ agents: [], connections: [] })
    })
  })

  // =========================================================================
  // 3. getActionHistory — Updated for new MarketingHistoryResponse shape
  // =========================================================================

  describe('getActionHistory', () => {
    it('should call GET /api/v1/marketing/agents/history with tenantId and limit', async () => {
      const fakeData = {
        events: [{
          id: 'evt-1',
          type: 'lead_search_started' as const,
          title: 'Búsqueda iniciada',
          description: 'Iniciando búsqueda de leads',
          agentId: 'agent-1',
          timestamp: '2025-01-01T00:00:00Z',
          metadata: {}
        }],
        total: 1,
        hasMore: false
      }
      mockAxiosGet.mockReturnValueOnce(mockResponse(fakeData))

      const result = await marketingHistoryService.getActionHistory(42)

      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
      const [url] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('/api/v1/marketing/agents/history')
      expect(url).toContain('tenantId=42')
      expect(url).toContain('limit=50') // default
      expect(url).toContain('page=0')   // default
      expect(result).toEqual(fakeData)
    })

    it('should pass custom limit and page', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse({
        events: [], total: 0, hasMore: false
      }))

      await marketingHistoryService.getActionHistory(42, 10, 2)

      const [url] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('limit=10')
      expect(url).toContain('page=2')
    })

    it('should include companyId when provided', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse({
        events: [], total: 0, hasMore: false
      }))

      await marketingHistoryService.getActionHistory(42, 50, 0, 7)

      const [url] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('companyId=7')
    })

    it('should pass AbortSignal to axios config', async () => {
      const controller = new AbortController()
      mockAxiosGet.mockReturnValueOnce(mockResponse({
        events: [], total: 0, hasMore: false
      }))

      await marketingHistoryService.getActionHistory(42, 50, 0, undefined, controller.signal)

      const [, config] = mockAxiosGet.mock.calls[0]
      expect(config).toEqual({ signal: controller.signal })
    })

    it('should return empty response on abort error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Aborted', 'AbortError'))

      const result = await marketingHistoryService.getActionHistory(42)

      expect(result.events).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should return empty response on generic error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Server error'))

      const result = await marketingHistoryService.getActionHistory(42)

      expect(result.events).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  // =========================================================================
  // 4. getAgentConnections
  // =========================================================================

  describe('getAgentConnections', () => {
    it('should call GET /api/v1/marketing/agents/connections with tenantId', async () => {
      const fakeData = [{
        id: 'conn-1',
        sourceAgentId: 'agent-1',
        targetAgentId: 'agent-2',
        label: 'feeds into',
        dataFlow: 'leads' as const,
        active: true
      }]
      mockAxiosGet.mockReturnValueOnce(mockResponse(fakeData))

      const result = await marketingHistoryService.getAgentConnections(42)

      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
      const [url] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('/api/v1/marketing/agents/connections')
      expect(url).toContain('tenantId=42')
      expect(result).toEqual(fakeData)
    })

    it('should pass AbortSignal to axios config', async () => {
      const controller = new AbortController()
      mockAxiosGet.mockReturnValueOnce(mockResponse([]))

      await marketingHistoryService.getAgentConnections(42, controller.signal)

      const [, config] = mockAxiosGet.mock.calls[0]
      expect(config).toEqual({ signal: controller.signal })
    })

    it('should return empty array on abort error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Aborted', 'AbortError'))

      const result = await marketingHistoryService.getAgentConnections(42)

      expect(result).toEqual([])
    })

    it('should return empty array on generic error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Network failure'))

      const result = await marketingHistoryService.getAgentConnections(42)

      expect(result).toEqual([])
    })
  })

  // =========================================================================
  // 5. getAgentTasks
  // =========================================================================

  describe('getAgentTasks', () => {
    it('should call GET /api/v1/marketing/agents/{agentId}/tasks', async () => {
      const fakeData = [
        {
          id: 'evt-1',
          type: 'lead_search_started' as const,
          title: 'Tarea de búsqueda',
          description: 'Buscando leads cualificados',
          agentId: 'agent-1',
          timestamp: '2025-01-01T00:00:00Z',
          metadata: {}
        },
      ]
      mockAxiosGet.mockReturnValueOnce(mockResponse(fakeData))

      const result = await marketingHistoryService.getAgentTasks('agent-1')

      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
      const [url] = mockAxiosGet.mock.calls[0]
      expect(url).toContain('/api/v1/marketing/agents/agent-1/tasks')
      expect(result).toEqual(fakeData)
    })

    it('should pass AbortSignal to axios config', async () => {
      const controller = new AbortController()
      mockAxiosGet.mockReturnValueOnce(mockResponse([]))

      await marketingHistoryService.getAgentTasks('agent-1', controller.signal)

      const [, config] = mockAxiosGet.mock.calls[0]
      expect(config).toEqual({ signal: controller.signal })
    })

    it('should return empty array on abort error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Aborted', 'AbortError'))

      const result = await marketingHistoryService.getAgentTasks('agent-1')

      expect(result).toEqual([])
    })

    it('should return empty array on generic error', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('Server error'))

      const result = await marketingHistoryService.getAgentTasks('agent-1')

      expect(result).toEqual([])
    })
  })

  // =========================================================================
  // 6. AbortError detection edge cases
  // =========================================================================

  describe('isAbortError detection', () => {
    it('should handle AbortError name', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('aborted', 'AbortError'))
      const result = await marketingHistoryService.getAgentTasks('x')
      expect(result).toEqual([])
    })

    it('should handle CanceledError name', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('canceled', 'CanceledError'))
      const result = await marketingHistoryService.getAgentTasks('x')
      expect(result).toEqual([])
    })

    it('should handle ERR_CANCELED code', async () => {
      mockAxiosGet.mockReturnValueOnce(mockError('canceled', 'Error', 'ERR_CANCELED'))
      const result = await marketingHistoryService.getAgentTasks('x')
      expect(result).toEqual([])
    })

    it('should NOT treat regular errors as abort errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockAxiosGet.mockReturnValueOnce(mockError('Network failure'))

      await marketingHistoryService.getAgentTasks('x')

      // console.error should have been called for non-abort errors
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  // =========================================================================
  // 7. Backward compatibility
  // =========================================================================

  describe('backward compatibility', () => {
    it('getLiveAgents works without signal', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse({ agents: [], connections: [] }))
      const result = await marketingHistoryService.getLiveAgents(1)
      expect(result).toEqual({ agents: [], connections: [] })
    })

    it('getActionHistory works without page, companyId, and signal', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse({
        events: [], total: 0, hasMore: false
      }))
      const result = await marketingHistoryService.getActionHistory(1)
      expect(result.events).toEqual([])
    })

    it('getAgentConnections works without signal', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse([]))
      const result = await marketingHistoryService.getAgentConnections(1)
      expect(result).toEqual([])
    })

    it('getAgentTasks works without signal', async () => {
      mockAxiosGet.mockReturnValueOnce(mockResponse([]))
      const result = await marketingHistoryService.getAgentTasks('agent-1')
      expect(result).toEqual([])
    })
  })
})
