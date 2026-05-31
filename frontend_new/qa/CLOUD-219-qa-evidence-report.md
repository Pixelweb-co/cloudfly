# CLOUD-219 — Runtime QA Evidence Report

**Date:** __________  
**QA Engineer:** __________  
**Environment:** Production (api.cloudfly.com.co / dashboard.cloudfly.com.co / chat.cloudfly.com.co)

---

## Step 1: Infrastructure Health (CLOUD-225)

### 1.1 Container Status

```powershell
cd C:\apps\cloudfly
docker-compose -f docker-compose-full-vps.yml up -d
docker-compose -f docker-compose-full-vps.yml ps
```

| Container | Expected Status | Actual Status | Pass/Fail |
|---|---|---|---|
| frontend-react | Up | | |
| backend-api | Up | | |
| chat_socket | Up | | |
| mysql | Up | | |
| redis_server | Up | | |
| kafka | Up | | |
| zookeeper | Up | | |
| traefik | Up | | |

### 1.2 Traefik Routing

```powershell
curl -I https://dashboard.cloudfly.com.co
curl -I https://api.cloudfly.com.co
curl -I https://chat.cloudfly.com.co
```

| Endpoint | Expected | Actual HTTP Status | Pass/Fail |
|---|---|---|---|
| dashboard.cloudfly.com.co | 200 or redirect | | |
| api.cloudfly.com.co | 200 or redirect | | |
| chat.cloudfly.com.co | 200 or redirect | | |

### 1.3 Frontend Logs

```powershell
docker logs frontend-react --tail 50
```

| Check | Expected | Pass/Fail |
|---|---|---|
| "Ready in X.Xs" present | ✅ | |
| No build errors | ✅ | |
| No WebSocket errors at build time | ✅ | |

---

## Step 2: Initial REST Load (CLOUD-224)

**URL:** `https://dashboard.cloudfly.com.co/marketing/ai-operation`

### 2.1 Network Tab Verification

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| `GET /api/v1/marketing/agents/history?tenantId=1&limit=50&page=0` fires | ✅ | | |
| HTTP Status | 200 | | |
| Response contains `agents` array | ✅ | | |
| Response contains `connections` array | ✅ | | |
| Response contains `recentEvents` array | ✅ | | |
| Response contains `generatedAt` string | ✅ | | |
| All field names are camelCase | ✅ | | |

### 2.2 Visual Verification

| Check | Expected | Pass/Fail |
|---|---|---|
| Loading spinner appears then disappears | ✅ | |
| Agent cards displayed | ✅ | |
| Stats row populated (Active, Working, Waiting, Errors) | ✅ | |
| No error alerts shown | ✅ | |

**Screenshot:** [Attach Network tab screenshot]

---

## Step 3: WebSocket Connection (CLOUD-223)

### 3.1 Console Verification

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| `🔌 Conectando a Socket.IO: https://chat.cloudfly.com.co` | ✅ | | |
| `✅ Socket conectado: <socket-id>` | ✅ | | |
| No connection errors | ✅ | | |

### 3.2 ConnectionChip Verification

| Check | Expected | Pass/Fail |
|---|---|---|
| Chip shows "Conectado" | ✅ | |
| Chip is green | ✅ | |
| WiFi icon present | ✅ | |

**Screenshot:** [Attach Console + ConnectionChip screenshot]

---

## Step 4: Real-time Agent Updates (CLOUD-222)

### 4.1 Agent Card Updates

| Check | Expected | Pass/Fail |
|---|---|---|
| Agent cards update without page reload | ✅ | |
| Status changes reflected in real-time | ✅ | |
| Task descriptions update | ✅ | |

### 4.2 Timeline Verification

| Check | Expected | Pass/Fail |
|---|---|---|
| New events appear in timeline | ✅ | |
| No duplicate events (by ID) | ✅ | |
| Timeline capped at 50 events | ✅ | |

**Screenshot:** [Attach real-time update evidence]

---

## Step 5: Reconnection Fallback (CLOUD-221)

### 5.1 Disconnect Test

```powershell
docker stop chat_socket
```

| Check | Expected | Pass/Fail |
|---|---|---|
| ConnectionChip turns red "Desconectado" | ✅ | |
| No JavaScript errors | ✅ | |

### 5.2 Reconnect Test

| Check | Expected | Pass/Fail |
|---|---|---|
| "Reconectar" button is clickable | ✅ | |
| REST refetch fires (visible in Network tab) | ✅ | |
| Socket reconnects (new `✅ Socket conectado` message) | ✅ | |
| ConnectionChip turns green again | ✅ | |

```powershell
docker start chat_socket
```

**Screenshot:** [Attach Desconectado + Reconnect screenshots]

---

## Step 6: No Memory Leaks (CLOUD-220)

### 6.1 Rapid Navigation Test

| Check | Expected | Pass/Fail |
|---|---|---|
| Navigate away and back 3-5 times | ✅ | |
| Page loads correctly each time | ✅ | |
| No "Can't perform a React state update on unmounted component" warnings | ✅ | |
| No lingering network requests after navigation | ✅ | |

### 6.2 AbortController Verification

| Check | Expected | Pass/Fail |
|---|---|---|
| Navigate away during loading → request cancelled | ✅ | |
| No error state set after cancellation | ✅ | |

**Screenshot:** [Attach Console showing no warnings]

---

## Step 7: Final Summary (CLOUD-226)

### Acceptance Criteria Summary

| # | Criteria | Status |
|---|---|---|
| 1 | REST initial load fires on page mount | ⬜ Pass ⬜ Fail |
| 2 | WebSocket connects and shows "Conectado" | ⬜ Pass ⬜ Fail |
| 3 | Real-time agent updates appear without page reload | ⬜ Pass ⬜ Fail |
| 4 | Timeline events are deduplicated and capped at 50 | ⬜ Pass ⬜ Fail |
| 5 | Reconnection button triggers both REST re-fetch and WS reconnect | ⬜ Pass ⬜ Fail |
| 6 | No console warnings about state updates on unmounted components | ⬜ Pass ⬜ Fail |
| 7 | No memory leaks from unclosed requests | ⬜ Pass ⬜ Fail |

### Overall Result

⬜ **ALL PASS** — CLOUD-219 verified, ready to close CLOUD-217 and CLOUD-212

⬜ **FAIL** — Issues found (see notes below)

### Notes / Issues Found

```
[Document any issues, unexpected behavior, or deviations from expected results]
```

### Sign-off

**QA Engineer:** ________________ **Date:** __________  
**Scrum Master:** ________________ **Date:** __________
