# CLOUD-216 — Integration Test Checklist

**Purpose:** Verify REST endpoints return correct data shapes matching TypeScript types  
**Date:** __________  
**Tester:** __________  
**JWT Token:** __________ (obtain from POST /api/v1/auth/login)

---

## Prerequisites

- [ ] All containers running: `docker-compose -f docker-compose-full-vps.yml up -d`
- [ ] MySQL has data in `global_agents`, `tenant_agent_configs`, `workflow_execution_logs`
- [ ] Valid JWT token obtained
- [ ] `jq` installed for JSON pretty-printing (optional)

---

## Test Case 1: GET /agents/live-status?tenantId=1

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| Response is JSON object | ✅ | | |
| `agents` field exists (array) | ✅ | | |
| `connections` field exists (array) | ✅ | | |
| Each agent has `id` (string) | ✅ | | |
| Each agent has `name` (string) | ✅ | | |
| Each agent has `status` (string: idle/working/waiting/error) | ✅ | | |
| Each agent has `currentTask` (string) | ✅ | | |
| Each agent has `lastActivity` (string, ISO-8601) | ✅ | | |
| Each agent has `avatarUrl` (string or null) | ✅ | | |
| Each connection has `from` (string) | ✅ | | |
| Each connection has `to` (string) | ✅ | | |
| Each connection has `label` (string or null) | ✅ | | |
| All field names are camelCase | ✅ | | |

---

## Test Case 2: GET /agents/live-status?tenantId=1&companyId=1

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1&companyId=1" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| Same shape as Test Case 1 | ✅ | | |
| companyId filter applied (may return fewer results) | ✅ | | |

---

## Test Case 3: GET /agents/history?tenantId=1&limit=10&page=0

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=1&limit=10&page=0" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| Response is JSON object | ✅ | | |
| `agents` field exists (array) | ✅ | | |
| `connections` field exists (array) | ✅ | | |
| `recentEvents` field exists (array) | ✅ | | |
| `generatedAt` field exists (string, ISO-8601) | ✅ | | |
| Each event has `id` (string) | ✅ | | |
| Each event has `agentId` (string) | ✅ | | |
| Each event has `agentName` (string) | ✅ | | |
| Each event has `actionType` (string) | ✅ | | |
| Each event has `description` (string) | ✅ | | |
| Each event has `timestamp` (string, ISO-8601) | ✅ | | |
| Each event has `metadata` (object or null) | ✅ | | |
| Number of events ≤ limit (10) | ✅ | | |
| All field names are camelCase | ✅ | | |

---

## Test Case 4: GET /agents/history?tenantId=1&limit=5&page=2

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=1&limit=5&page=2" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| Number of events ≤ 5 | ✅ | | |
| Events are offset by 10 (page 2 × limit 5) | ✅ | | |

---

## Test Case 5: GET /agents/connections?tenantId=1

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/connections?tenantId=1" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| Response is JSON array | ✅ | | |
| Each item has `from` (string) | ✅ | | |
| Each item has `to` (string) | ✅ | | |
| Each item has `label` (string or null) | ✅ | | |

---

## Test Case 6: GET /agents/1/tasks

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/1/tasks" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| Response is JSON array | ✅ | | |
| Each item has all MarketingActionEvent fields | ✅ | | |
| Events are specific to agentId=1 | ✅ | | |

---

## Test Case 7: Auth Enforcement — No JWT

```powershell
curl -s -w "\nHTTP Status: %{http_code}\n" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1"
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 401 | | |

---

## Test Case 8: Empty Tenant — tenantId=99999

```powershell
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  "https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=99999&limit=10&page=0" | jq .
```

| Criteria | Expected | Actual | Pass/Fail |
|---|---|---|---|
| HTTP Status | 200 | | |
| `agents` is empty array | ✅ | | |
| `connections` is empty array | ✅ | | |
| `recentEvents` is empty array | ✅ | | |
| `generatedAt` is present | ✅ | | |

---

## Type Alignment Summary

| Java Record Field | TypeScript Interface Field | camelCase Match? |
|---|---|---|
| `MarketingAgentDto.id` | `MarketingAgent.id` | ⬜ |
| `MarketingAgentDto.name` | `MarketingAgent.name` | ⬜ |
| `MarketingAgentDto.status` | `MarketingAgent.status` | ⬜ |
| `MarketingAgentDto.currentTask` | `MarketingAgent.currentTask` | ⬜ |
| `MarketingAgentDto.lastActivity` | `MarketingAgent.lastActivity` | ⬜ |
| `MarketingAgentDto.avatarUrl` | `MarketingAgent.avatarUrl?` | ⬜ |
| `AgentConnectionDto.from` | `AgentConnection.from` | ⬜ |
| `AgentConnectionDto.to` | `AgentConnection.to` | ⬜ |
| `AgentConnectionDto.label` | `AgentConnection.label?` | ⬜ |
| `MarketingActionEventDto.id` | `MarketingActionEvent.id` | ⬜ |
| `MarketingActionEventDto.agentId` | `MarketingActionEvent.agentId` | ⬜ |
| `MarketingActionEventDto.agentName` | `MarketingActionEvent.agentName` | ⬜ |
| `MarketingActionEventDto.actionType` | `MarketingActionEvent.actionType` | ⬜ |
| `MarketingActionEventDto.description` | `MarketingActionEvent.description` | ⬜ |
| `MarketingActionEventDto.timestamp` | `MarketingActionEvent.timestamp` | ⬜ |
| `MarketingActionEventDto.metadata` | `MarketingActionEvent.metadata?` | ⬜ |

---

## Overall Result

⬜ **ALL PASS** — CLOUD-216 verified

⬜ **FAIL** — Issues found (document below)

### Notes

```
[Document any issues found]
```

**Tester:** ________________ **Date:** __________
