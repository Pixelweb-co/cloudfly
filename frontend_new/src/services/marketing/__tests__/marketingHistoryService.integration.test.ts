// =============================================================================
// Integration Test Script for marketingHistoryService (CLOUD-216)
// =============================================================================
// NOTE: This is a MANUAL integration test script template.
// It documents the exact curl commands and expected responses for each endpoint.
// Run these commands against a live backend with a valid JWT token.
//
// Prerequisites:
//   1. All containers running: docker-compose -f docker-compose-full-vps.yml up -d
//   2. Valid JWT token obtained from POST /api/v1/auth/login
//   3. MySQL has data in global_agents, tenant_agent_configs, workflow_execution_logs
// =============================================================================

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_BASE = 'https://api.cloudfly.com.co/api/v1/marketing'
// Replace with a valid JWT token from your auth flow
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json',
}

// ---------------------------------------------------------------------------
// Test Case 1: GET /agents/live-status?tenantId=1
// ---------------------------------------------------------------------------
// Expected: 200 OK
// Response shape: { agents: MarketingAgent[], connections: AgentConnection[] }
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1" | jq .
//
// Expected response:
// {
//   "agents": [
//     {
//       "id": "1",
//       "name": "Lead Search Agent",
//       "status": "idle",
//       "currentTask": "Waiting for tasks",
//       "lastActivity": "2025-01-01T00:00:00",
//       "avatarUrl": null
//     }
//   ],
//   "connections": [
//     {
//       "from": "1",
//       "to": "2",
//       "label": "feeds into"
//     }
//   ]
// }

// ---------------------------------------------------------------------------
// Test Case 2: GET /agents/live-status?tenantId=1&companyId=1
// ---------------------------------------------------------------------------
// Expected: 200 OK (same shape, companyId filter applied)
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1&companyId=1" | jq .

// ---------------------------------------------------------------------------
// Test Case 3: GET /agents/history?tenantId=1&limit=10&page=0
// ---------------------------------------------------------------------------
// Expected: 200 OK
// Response shape: { agents[], connections[], recentEvents[], generatedAt }
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=1&limit=10&page=0" | jq .
//
// Expected response:
// {
//   "agents": [...],
//   "connections": [...],
//   "recentEvents": [
//     {
//       "id": "1",
//       "agentId": "1",
//       "agentName": "Agent-1",
//       "actionType": "WORKFLOW_EXECUTION",
//       "description": "Workflow executed successfully",
//       "timestamp": "2025-01-01T00:00:00",
//       "metadata": { "status": "SUCCESS", "executionTimeMs": 150, "companyId": 1 }
//     }
//   ],
//   "generatedAt": "2025-01-01T00:00:00"
// }

// ---------------------------------------------------------------------------
// Test Case 4: GET /agents/history?tenantId=1&limit=5&page=2
// ---------------------------------------------------------------------------
// Expected: 200 OK (pagination: offset = page * limit = 10)
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=1&limit=5&page=2" | jq .

// ---------------------------------------------------------------------------
// Test Case 5: GET /agents/connections?tenantId=1
// ---------------------------------------------------------------------------
// Expected: 200 OK
// Response shape: AgentConnection[]
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/connections?tenantId=1" | jq .
//
// Expected response:
// [
//   { "from": "1", "to": "2", "label": "feeds into" },
//   { "from": "2", "to": "3", "label": "feeds into" }
// ]

// ---------------------------------------------------------------------------
// Test Case 6: GET /agents/{agentId}/tasks
// ---------------------------------------------------------------------------
// Expected: 200 OK
// Response shape: MarketingActionEvent[]
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/1/tasks" | jq .
//
// Expected response:
// [
//   {
//     "id": "1",
//     "agentId": "1",
//     "agentName": "Agent-1",
//     "actionType": "WORKFLOW_EXECUTION",
//     "description": "Workflow executed successfully",
//     "timestamp": "2025-01-01T00:00:00",
//     "metadata": { "status": "SUCCESS", "executionTimeMs": 150 }
//   }
// ]

// ---------------------------------------------------------------------------
// Test Case 7: Auth enforcement — No JWT token
// ---------------------------------------------------------------------------
// Expected: 401 Unauthorized
//
// curl command:
//   curl -s -w "\nHTTP Status: %{http_code}\n" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1"
//
// Expected: HTTP 401

// ---------------------------------------------------------------------------
// Test Case 8: Empty tenant — tenantId with no data
// ---------------------------------------------------------------------------
// Expected: 200 OK with empty arrays
//
// curl command:
//   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
//     "https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=99999&limit=10&page=0" | jq .
//
// Expected response:
// { "agents": [], "connections": [], "recentEvents": [], "generatedAt": "..." }

// =============================================================================
// Automated validation helper (can be run with Node.js + axios)
// =============================================================================

/**
 * Run this function in a Node.js environment with axios installed:
 *
 *   npm install axios
 *   npx ts-node marketingHistoryService.integration.test.ts
 *
 * Or copy the logic into a test runner of your choice.
 */

export const integrationTestConfig = {
  API_BASE,
  endpoints: {
    liveStatus: '/agents/live-status',
    history: '/agents/history',
    connections: '/agents/connections',
    agentTasks: '/agents/{agentId}/tasks',
  },
  testParams: {
    tenantId: 1,
    companyId: 1,
    limit: 10,
    page: 0,
    agentId: '1',
  },
  expectedStatusCodes: {
    success: 200,
    unauthorized: 401,
    notFound: 404,
  },
}

/**
 * Validation checklist for manual QA:
 *
 * [ ] Test Case 1: live-status returns agents + connections
 * [ ] Test Case 2: live-status with companyId works
 * [ ] Test Case 3: history returns agents + connections + recentEvents + generatedAt
 * [ ] Test Case 4: history pagination (page=2, limit=5) returns offset data
 * [ ] Test Case 5: connections returns array of { from, to, label }
 * [ ] Test Case 6: agent tasks returns array of action events
 * [ ] Test Case 7: no JWT → 401
 * [ ] Test Case 8: empty tenant → 200 with empty arrays
 *
 * [ ] All response fields use camelCase (matching TypeScript interfaces)
 * [ ] No 500 errors
 * [ ] Response time < 2000ms for all endpoints
 */
