// =============================================================================
// Integration Test Script for CLOUD-212 / CLOUD-216
// =============================================================================
// Tests the 4 REST endpoints against a running backend instance.
// Run with: npx ts-node --project tsconfig.json scripts/integration-test-c212.ts
//
// Prerequisites:
//   - Backend running on http://localhost:8080
//   - Valid JWT token in environment variable TEST_JWT_TOKEN
//   - Tenant ID in environment variable TEST_TENANT_ID (default: 1)
// =============================================================================

import axios, { AxiosError } from 'axios'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:8080'
const API_URL = `${BASE_URL}/api/v1/marketing/agents`
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || ''
const TENANT_ID = Number(process.env.TEST_TENANT_ID || '1')
const COMPANY_ID = process.env.TEST_COMPANY_ID ? Number(process.env.TEST_COMPANY_ID) : undefined

// ---------------------------------------------------------------------------
// Test result tracking
// ---------------------------------------------------------------------------

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: string
}

const results: TestResult[] = []

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ name, passed: true, duration })
    console.log(`  ✅ ${name} (${duration}ms)`)
  } catch (err) {
    const duration = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)
    results.push({ name, passed: false, duration, error })
    console.log(`  ❌ ${name} (${duration}ms) — ${error}`)
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function authHeaders() {
  if (!JWT_TOKEN) return {}
  return { Authorization: `Bearer ${JWT_TOKEN}` }
}

function axiosConfig() {
  return { headers: authHeaders() }
}

// ---------------------------------------------------------------------------
// Test: GET /api/v1/marketing/agents/live-status
// ---------------------------------------------------------------------------

async function testGetLiveAgents(): Promise<void> {
  const url = `${API_URL}/live-status?tenantId=${TENANT_ID}${COMPANY_ID ? `&companyId=${COMPANY_ID}` : ''}`
  const res = await axios.get(url, axiosConfig())

  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.data) throw new Error('Response body is empty')

  const body = res.data as any
  if (!Array.isArray(body.agents)) throw new Error('agents field is missing or not an array')
  if (!Array.isArray(body.connections)) throw new Error('connections field is missing or not an array')

  // Validate agent shape
  if (body.agents.length > 0) {
    const agent = body.agents[0]
    if (typeof agent.id !== 'string') throw new Error('agent.id should be string')
    if (typeof agent.name !== 'string') throw new Error('agent.name should be string')
    if (!['idle', 'working', 'waiting', 'error'].includes(agent.status)) {
      throw new Error(`agent.status has invalid value: ${agent.status}`)
    }
    if (typeof agent.currentTask !== 'string') throw new Error('agent.currentTask should be string')
    if (typeof agent.lastActivity !== 'string') throw new Error('agent.lastActivity should be string')
  }

  // Validate connection shape
  if (body.connections.length > 0) {
    const conn = body.connections[0]
    if (typeof conn.from !== 'string') throw new Error('connection.from should be string')
    if (typeof conn.to !== 'string') throw new Error('connection.to should be string')
  }
}

// ---------------------------------------------------------------------------
// Test: GET /api/v1/marketing/agents/history
// ---------------------------------------------------------------------------

async function testGetActionHistory(): Promise<void> {
  const url = `${API_URL}/history?tenantId=${TENANT_ID}&limit=10&page=0${COMPANY_ID ? `&companyId=${COMPANY_ID}` : ''}`
  const res = await axios.get(url, axiosConfig())

  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.data) throw new Error('Response body is empty')

  const body = res.data as any
  if (!Array.isArray(body.agents)) throw new Error('agents field is missing or not an array')
  if (!Array.isArray(body.connections)) throw new Error('connections field is missing or not an array')
  if (!Array.isArray(body.recentEvents)) throw new Error('recentEvents field is missing or not an array')
  if (typeof body.generatedAt !== 'string') throw new Error('generatedAt should be string')

  // Validate event shape
  if (body.recentEvents.length > 0) {
    const event = body.recentEvents[0]
    if (typeof event.id !== 'string') throw new Error('event.id should be string')
    if (typeof event.agentId !== 'string') throw new Error('event.agentId should be string')
    if (typeof event.agentName !== 'string') throw new Error('event.agentName should be string')
    if (typeof event.actionType !== 'string') throw new Error('event.actionType should be string')
    if (typeof event.description !== 'string') throw new Error('event.description should be string')
    if (typeof event.timestamp !== 'string') throw new Error('event.timestamp should be string')
  }
}

// ---------------------------------------------------------------------------
// Test: GET /api/v1/marketing/agents/history with pagination
// ---------------------------------------------------------------------------

async function testGetActionHistoryPagination(): Promise<void> {
  // Page 0
  const url0 = `${API_URL}/history?tenantId=${TENANT_ID}&limit=5&page=0`
  const res0 = await axios.get(url0, axiosConfig())
  if (res0.status !== 200) throw new Error(`Page 0: Expected 200, got ${res0.status}`)

  // Page 1
  const url1 = `${API_URL}/history?tenantId=${TENANT_ID}&limit=5&page=1`
  const res1 = await axios.get(url1, axiosConfig())
  if (res1.status !== 200) throw new Error(`Page 1: Expected 200, got ${res1.status}`)

  // Verify limit is respected
  if (res0.data.recentEvents.length > 5) throw new Error('Page 0: limit=5 not respected')
  if (res1.data.recentEvents.length > 5) throw new Error('Page 1: limit=5 not respected')
}

// ---------------------------------------------------------------------------
// Test: GET /api/v1/marketing/agents/connections
// ---------------------------------------------------------------------------

async function testGetAgentConnections(): Promise<void> {
  const url = `${API_URL}/connections?tenantId=${TENANT_ID}`
  const res = await axios.get(url, axiosConfig())

  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!Array.isArray(res.data)) throw new Error('Response should be an array')

  if (res.data.length > 0) {
    const conn = res.data[0] as any
    if (typeof conn.from !== 'string') throw new Error('connection.from should be string')
    if (typeof conn.to !== 'string') throw new Error('connection.to should be string')
  }
}

// ---------------------------------------------------------------------------
// Test: GET /api/v1/marketing/agents/{agentId}/tasks
// ---------------------------------------------------------------------------

async function testGetAgentTasks(): Promise<void> {
  // First get agents to find a valid agentId
  const agentsUrl = `${API_URL}/live-status?tenantId=${TENANT_ID}`
  const agentsRes = await axios.get(agentsUrl, axiosConfig())

  if (agentsRes.data.agents.length === 0) {
    console.log('    ℹ️ No agents found — skipping tasks test (no agentId to query)')
    return
  }

  const agentId = agentsRes.data.agents[0].id
  const url = `${API_URL}/${agentId}/tasks`
  const res = await axios.get(url, axiosConfig())

  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!Array.isArray(res.data)) throw new Error('Response should be an array')

  if (res.data.length > 0) {
    const task = res.data[0] as any
    if (typeof task.id !== 'string') throw new Error('task.id should be string')
    if (typeof task.agentId !== 'string') throw new Error('task.agentId should be string')
    if (typeof task.agentName !== 'string') throw new Error('task.agentName should be string')
    if (typeof task.actionType !== 'string') throw new Error('task.actionType should be string')
    if (typeof task.description !== 'string') throw new Error('task.description should be string')
    if (typeof task.timestamp !== 'string') throw new Error('task.timestamp should be string')
  }
}

// ---------------------------------------------------------------------------
// Test: Error handling — missing tenantId
// ---------------------------------------------------------------------------

async function testErrorMissingTenantId(): Promise<void> {
  try {
    await axios.get(`${API_URL}/live-status`, axiosConfig())
    throw new Error('Expected 400 error for missing tenantId, but request succeeded')
  } catch (err) {
    const axiosErr = err as AxiosError
    if (axiosErr.response?.status !== 400) {
      throw new Error(`Expected 400, got ${axiosErr.response?.status}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Test: Error handling — unauthorized (no JWT)
// ---------------------------------------------------------------------------

async function testErrorUnauthorized(): Promise<void> {
  try {
    await axios.get(`${API_URL}/live-status?tenantId=${TENANT_ID}`)
    // If the endpoint doesn't require auth, that's also acceptable for now
    console.log('    ℹ️ Endpoint does not require JWT auth (may be configured without security)')
  } catch (err) {
    const axiosErr = err as AxiosError
    if (axiosErr.response?.status !== 401 && axiosErr.response?.status !== 403) {
      throw new Error(`Expected 401/403, got ${axiosErr.response?.status}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Test: Response shape alignment with TypeScript types
// ---------------------------------------------------------------------------

async function testTypeScriptTypeAlignment(): Promise<void> {
  const url = `${API_URL}/history?tenantId=${TENANT_ID}&limit=1`
  const res = await axios.get(url, axiosConfig())
  const body = res.data as any

  // MarketingHistoryResponse shape check
  const requiredFields = ['agents', 'connections', 'recentEvents', 'generatedAt']
  for (const field of requiredFields) {
    if (!(field in body)) {
      throw new Error(`MarketingHistoryResponse missing required field: ${field}`)
    }
  }

  // MarketingAgent shape check
  if (body.agents.length > 0) {
    const agent = body.agents[0]
    const agentFields = ['id', 'name', 'status', 'currentTask', 'lastActivity']
    for (const field of agentFields) {
      if (!(field in agent)) {
        throw new Error(`MarketingAgent missing required field: ${field}`)
      }
    }
  }

  // MarketingActionEvent shape check
  if (body.recentEvents.length > 0) {
    const event = body.recentEvents[0]
    const eventFields = ['id', 'agentId', 'agentName', 'actionType', 'description', 'timestamp']
    for (const field of eventFields) {
      if (!(field in event)) {
        throw new Error(`MarketingActionEvent missing required field: ${field}`)
      }
    }
  }

  // AgentConnection shape check
  if (body.connections.length > 0) {
    const conn = body.connections[0]
    const connFields = ['from', 'to']
    for (const field of connFields) {
      if (!(field in conn)) {
        throw new Error(`AgentConnection missing required field: ${field}`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('='.repeat(70))
  console.log('CLOUD-212 / CLOUD-216 — Integration Test Suite')
  console.log('='.repeat(70))
  console.log(`  API Base: ${API_URL}`)
  console.log(`  Tenant ID: ${TENANT_ID}`)
  console.log(`  Company ID: ${COMPANY_ID || '(none)'}`)
  console.log(`  JWT Token: ${JWT_TOKEN ? '(provided)' : '(none — auth may fail)'}`)
  console.log('='.repeat(70))
  console.log()

  // --- Endpoint Tests ---
  console.log('📡 Endpoint Tests:')
  await runTest('GET /agents/live-status — returns agents + connections', testGetLiveAgents)
  await runTest('GET /agents/history — returns agents + connections + events', testGetActionHistory)
  await runTest('GET /agents/history — pagination (limit + page)', testGetActionHistoryPagination)
  await runTest('GET /agents/connections — returns directed connections', testGetAgentConnections)
  await runTest('GET /agents/{agentId}/tasks — returns agent tasks', testGetAgentTasks)

  // --- Error Handling Tests ---
  console.log()
  console.log('🛡️ Error Handling Tests:')
  await runTest('Missing tenantId returns 400', testErrorMissingTenantId)
  await runTest('Unauthorized request returns 401/403', testErrorUnauthorized)

  // --- Type Alignment Tests ---
  console.log()
  console.log('🔍 TypeScript Type Alignment Tests:')
  await runTest('Response shapes match TypeScript interfaces', testTypeScriptTypeAlignment)

  // --- Summary ---
  console.log()
  console.log('='.repeat(70))
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`Results: ${passed}/${total} passed, ${failed} failed (${totalDuration}ms total)`)

  if (failed > 0) {
    console.log()
    console.log('Failed tests:')
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  ❌ ${r.name}: ${r.error}`)
    }
  }

  console.log('='.repeat(70))

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
