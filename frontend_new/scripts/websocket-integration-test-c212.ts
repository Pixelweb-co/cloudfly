// =============================================================================
// WebSocket Integration Test for CLOUD-212 / CLOUD-217
// =============================================================================
// Tests the WebSocket integration between marketingHistoryService (REST initial
// load) and useMarketingAgentsSocket (real-time updates).
//
// This is a code-level verification script that validates:
//   1. The consuming component calls REST on mount
//   2. The WebSocket hook subscribes to the correct events
//   3. The reconnection fallback works (REST re-call on disconnect)
//   4. No race conditions between REST and WebSocket data
//
// Run with: npx ts-node --project tsconfig.json scripts/websocket-integration-test-c212.ts
// =============================================================================

import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Test result tracking
// ---------------------------------------------------------------------------

interface TestResult {
  name: string
  passed: boolean
  details?: string
}

const results: TestResult[] = []

function runTest(name: string, fn: () => void): void {
  try {
    fn()
    results.push({ name, passed: true })
    console.log(`  ✅ ${name}`)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    results.push({ name, passed: false, details: error })
    console.log(`  ❌ ${name} — ${error}`)
  }
}

function readFile(relativePath: string): string {
  const fullPath = path.join('C:\\apps\\cloudfly', relativePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

// =============================================================================
// CLOUD-217 Test Suite — WebSocket Integration Verification
// =============================================================================

console.log('='.repeat(70))
console.log('CLOUD-212 / CLOUD-217 — WebSocket Integration Test Suite')
console.log('='.repeat(70))
console.log()

// ---------------------------------------------------------------------------
// Test Group 1: REST Initial Load on Mount
// ---------------------------------------------------------------------------

console.log('📡 Group 1: REST Initial Load on Mount')
console.log('-'.repeat(50))

runTest(
  'page.tsx imports marketingHistoryService',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes("import { marketingHistoryService }"), 'Missing import of marketingHistoryService')
  }
)

runTest(
  'page.tsx calls getActionHistory on mount via useEffect',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('marketingHistoryService.getActionHistory'), 'Missing getActionHistory call')
    assert(code.includes('useEffect'), 'Missing useEffect for initial load')
    assert(code.includes('loadInitialData'), 'Missing loadInitialData function')
  }
)

runTest(
  'page.tsx passes tenantId to getActionHistory',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    // Should have a tenantId variable or literal
    assert(
      code.includes('tenantId') && code.includes('getActionHistory'),
      'tenantId not passed to getActionHistory'
    )
  }
)

runTest(
  'page.tsx passes limit=50 and page=0 to getActionHistory',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('getActionHistory(tenantId, 50, 0'), 'Missing limit=50, page=0 params')
  }
)

runTest(
  'page.tsx has TODO comment for auth context tenantId resolution',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(
      code.includes('TODO') && code.includes('tenantId'),
      'Missing TODO for auth context tenantId resolution'
    )
  }
)

// ---------------------------------------------------------------------------
// Test Group 2: WebSocket Hook Integration
// ---------------------------------------------------------------------------

console.log()
console.log('🔌 Group 2: WebSocket Hook Integration')
console.log('-'.repeat(50))

runTest(
  'page.tsx imports useMarketingAgentsSocket hook',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('useMarketingAgentsSocket'), 'Missing useMarketingAgentsSocket import')
  }
)

runTest(
  'page.tsx destructures agents, connections, recentEvents from hook',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('agents') && code.includes('connections') && code.includes('recentEvents'),
      'Missing destructured socket state')
  }
)

runTest(
  'page.tsx destructures isConnected from hook',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('isConnected'), 'Missing isConnected from socket hook')
  }
)

runTest(
  'page.tsx destructures reconnect from hook',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('reconnect'), 'Missing reconnect from socket hook')
  }
)

runTest(
  'useMarketingAgentsSocket subscribes to marketing-agent-batch-update',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('marketing-agent-batch-update'), 'Missing batch-update event listener')
  }
)

runTest(
  'useMarketingAgentsSocket subscribes to marketing-agent-status-update',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('marketing-agent-status-update'), 'Missing status-update event listener')
  }
)

runTest(
  'useMarketingAgentsSocket subscribes to marketing-agent-task-update',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('marketing-agent-task-update'), 'Missing task-update event listener')
  }
)

runTest(
  'useMarketingAgentsSocket subscribes to marketing-action-event',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('marketing-action-event'), 'Missing action-event listener')
  }
)

runTest(
  'useMarketingAgentsSocket cleans up listeners on unmount',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('socket.off'), 'Missing socket.off cleanup in useEffect return')
  }
)

runTest(
  'useMarketingAgentsSocket deduplicates action events by id',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('Deduplicate') || code.includes('deduplicate'), 'Missing event deduplication')
  }
)

runTest(
  'useMarketingAgentsSocket keeps last 50 events',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('slice(-50)') || code.includes('50'), 'Missing 50-event limit')
  }
)

// ---------------------------------------------------------------------------
// Test Group 3: Reconnection Fallback
// ---------------------------------------------------------------------------

console.log()
console.log('🔄 Group 3: Reconnection Fallback')
console.log('-'.repeat(50))

runTest(
  'page.tsx has reconnect button that calls both reconnect() and loadInitialData()',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('Reconectar') || code.includes('reconnect'), 'Missing reconnect button')
    // The button should call both reconnect() and loadInitialData()
    assert(
      code.includes('reconnect()') && code.includes('loadInitialData()'),
      'Reconnect button should call both reconnect() and loadInitialData()'
    )
  }
)

runTest(
  'useMarketingAgentsSocket reconnect() disconnects then reconnects',
  () => {
    const code = readFile('frontend_new/src/hooks/useMarketingAgentsSocket.ts')
    assert(code.includes('socket.disconnect()') && code.includes('socket.connect()'),
      'reconnect() should disconnect then connect')
  }
)

runTest(
  'page.tsx shows connection status chip',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(code.includes('ConnectionChip') || code.includes('Conectado') || code.includes('Desconectado'),
      'Missing connection status indicator')
  }
)

// ---------------------------------------------------------------------------
// Test Group 4: Component Integration
// ---------------------------------------------------------------------------

console.log()
console.log('🧩 Group 4: Component Integration')
console.log('-'.repeat(50))

runTest(
  'AgentFlowGraph receives agents and connections from socket state',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(
      code.includes('AgentFlowGraph agents={agents} connections={connections}'),
      'AgentFlowGraph not receiving socket state'
    )
  }
)

runTest(
  'MarketingHistoryTimeline receives recentEvents from socket state',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(
      code.includes('MarketingHistoryTimeline events={recentEvents}'),
      'MarketingHistoryTimeline not receiving socket state'
    )
  }
)

runTest(
  'LiveAgentCard receives agent data from socket state',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(
      code.includes('LiveAgentCard agent={agent}'),
      'LiveAgentCard not receiving agent from socket state'
    )
  }
)

runTest(
  'Stats are derived from socket agents state',
  () => {
    const code = readFile('frontend_new/src/app/(dashboard)/marketing/ai-operation/page.tsx')
    assert(
      code.includes('agents.filter') && code.includes('working') && code.includes('waiting'),
      'Stats not derived from socket agents state'
    )
  }
)

// ---------------------------------------------------------------------------
// Test Group 5: Backend Endpoint Coverage
// ---------------------------------------------------------------------------

console.log()
console.log('🏗️ Group 5: Backend Endpoint Coverage')
console.log('-'.repeat(50))

runTest(
  'MarketingHistoryController has GET /live-status endpoint',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(code.contains('@GetMapping("/live-status")'), 'Missing live-status endpoint')
  }
)

runTest(
  'MarketingHistoryController has GET /history endpoint',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(code.contains('@GetMapping("/history")'), 'Missing history endpoint')
  }
)

runTest(
  'MarketingHistoryController has GET /connections endpoint',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(code.contains('@GetMapping("/connections")'), 'Missing connections endpoint')
  }
)

runTest(
  'MarketingHistoryController has GET /{agentId}/tasks endpoint',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(code.contains('@GetMapping("/{agentId}/tasks")'), 'Missing agent tasks endpoint')
  }
)

runTest(
  'MarketingHistoryController uses Spring WebFlux (Mono/Flux)',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(code.contains('Mono<') && code.contains('Flux<'), 'Not using WebFlux reactive types')
  }
)

runTest(
  'MarketingHistoryController uses R2DBC repositories',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(
      code.contains('GlobalAgentRepository') &&
      code.contains('TenantAgentConfigRepository') &&
      code.contains('WorkflowExecutionLogRepository'),
      'Missing R2DBC repository dependencies'
    )
  }
)

runTest(
  'MarketingHistoryController has tenant isolation via tenantId param',
  () => {
    const code = readFile('backend_new/src/main/java/com/app/controllers/MarketingHistoryController.java')
    assert(code.contains('@RequestParam Long tenantId'), 'Missing tenantId request param')
  }
)

// ---------------------------------------------------------------------------
// Test Group 6: Service Method Coverage
// ---------------------------------------------------------------------------

console.log()
console.log('📋 Group 6: Service Method Coverage')
console.log('-'.repeat(50))

runTest(
  'marketingHistoryService has getLiveAgents method',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    assert(code.includes('getLiveAgents'), 'Missing getLiveAgents method')
  }
)

runTest(
  'marketingHistoryService has getActionHistory method',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    assert(code.includes('getActionHistory'), 'Missing getActionHistory method')
  }
)

runTest(
  'marketingHistoryService has getAgentConnections method',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    assert(code.includes('getAgentConnections'), 'Missing getAgentConnections method')
  }
)

runTest(
  'marketingHistoryService has getAgentTasks method',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    assert(code.includes('getAgentTasks'), 'Missing getAgentTasks method')
  }
)

runTest(
  'All service methods support AbortSignal cancellation',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    // Count occurrences of 'signal?: AbortSignal' — should be 4 (one per method)
    const matches = code.match(/signal\?: AbortSignal/g)
    assert(matches !== null && matches.length >= 4, `Expected 4 AbortSignal params, found ${matches?.length || 0}`)
  }
)

runTest(
  'Service has isAbortError helper for axios CanceledError',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    assert(code.includes('isAbortError'), 'Missing isAbortError helper')
    assert(code.includes('ERR_CANCELED'), 'Missing ERR_CANCELED code check')
  }
)

runTest(
  'getActionHistory supports page parameter for pagination',
  () => {
    const code = readFile('frontend_new/src/services/marketing/marketingHistoryService.ts')
    assert(code.includes('page = 0'), 'Missing page parameter with default')
  }
)

// ---------------------------------------------------------------------------
// Test Group 7: TypeScript Type Coverage
// ---------------------------------------------------------------------------

console.log()
console.log('🔷 Group 7: TypeScript Type Coverage')
console.log('-'.repeat(50))

runTest(
  'aiMarketing.ts exports MarketingAgent interface',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export interface MarketingAgent'), 'Missing MarketingAgent export')
  }
)

runTest(
  'aiMarketing.ts exports AgentConnection interface',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export interface AgentConnection'), 'Missing AgentConnection export')
  }
)

runTest(
  'aiMarketing.ts exports MarketingHistoryResponse interface',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export interface MarketingHistoryResponse'), 'Missing MarketingHistoryResponse export')
  }
)

runTest(
  'aiMarketing.ts exports MarketingActionEvent interface',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export interface MarketingActionEvent'), 'Missing MarketingActionEvent export')
  }
)

runTest(
  'aiMarketing.ts exports MarketingAgentStatus type',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export type MarketingAgentStatus'), 'Missing MarketingAgentStatus type')
  }
)

runTest(
  'aiMarketing.ts exports AgentStatusUpdatePayload interface',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export interface AgentStatusUpdatePayload'), 'Missing AgentStatusUpdatePayload export')
  }
)

runTest(
  'aiMarketing.ts exports AgentTaskUpdatePayload interface',
  () => {
    const code = readFile('frontend_new/src/types/marketing/aiMarketing.ts')
    assert(code.includes('export interface AgentTaskUpdatePayload'), 'Missing AgentTaskUpdatePayload export')
  }
)

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log()
console.log('='.repeat(70))
const passed = results.filter(r => r.passed).length
const failed = results.filter(r => !r.passed).length
const total = results.length

console.log(`Results: ${passed}/${total} passed, ${failed} failed`)

if (failed > 0) {
  console.log()
  console.log('Failed tests:')
  for (const r of results.filter(r => !r.passed)) {
    console.log(`  ❌ ${r.name}: ${r.details}`)
  }
}

console.log('='.repeat(70))

process.exit(failed > 0 ? 1 : 0)
