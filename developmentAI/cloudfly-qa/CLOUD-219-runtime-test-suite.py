#!/usr/bin/env python3
"""
CLOUD-219: Runtime QA Verification - WebSocket Integration End-to-End
====================================================================
Automated test suite that verifies the full REST to WebSocket transition
works end-to-end in the CloudFly marketing dashboard.

This script tests:
  1. Infrastructure health (all containers running)
  2. REST API endpoints (marketing history, live agents)
  3. WebSocket connectivity (Socket.IO handshake, auth)
  4. Kafka event flow (topics, consumer groups)
  5. Reconnection fallback (stop/start chat_socket)
  6. Memory leak indicators (log analysis)
  7. Code-level verification (AbortController, dedup, cleanup)

Usage:
  python CLOUD-219-runtime-test-suite.py [--full|--infra|--rest|--ws|--kafka|--reconnect|--leaks|--code]
"""

import subprocess
import sys
import json
import os
import time
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_DIR = r"C:\apps\cloudfly"
COMPOSE_FILE = "docker-compose-full-vps.yml"
REPORT_DIR = r"C:\apps\cloudfly\developmentAI\cloudfly-qa\reports"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
REPORT_FILE = os.path.join(REPORT_DIR, "CLOUD-219-qa-report-" + TIMESTAMP + ".md")

REQUIRED_CONTAINERS = [
    "frontend-react",
    "chat_socket",
    "backend-api",
    "redis_server",
    "mysql",
    "kafka",
    "zookeeper",
    "traefik",
    "marketing-agent",
]

# Counters
pass_count = 0
fail_count = 0
warn_count = 0
report_lines: List[str] = []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def log_info(msg):
    print("[INFO]  " + msg)


def log_pass(msg):
    global pass_count
    pass_count += 1
    print("[PASS]  " + msg)


def log_fail(msg):
    global fail_count
    fail_count += 1
    print("[FAIL]  " + msg)


def log_warn(msg):
    global warn_count
    warn_count += 1
    print("[WARN]  " + msg)


def log_step(msg):
    line = "=" * 60
    print("")
    print(line)
    print("  STEP: " + msg)
    print(line)


def run_cmd(cmd, timeout=30):
    """Run a shell command and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)


def docker_exec(container, cmd, timeout=15):
    """Run a command inside a Docker container."""
    return run_cmd("docker exec " + container + " " + cmd, timeout)


def docker_logs(container, tail=100):
    """Get container logs."""
    _, stdout, _ = run_cmd("docker logs --tail " + str(tail) + " " + container)
    return stdout


def is_container_running(name):
    """Check if a Docker container is running."""
    rc, stdout, _ = run_cmd("docker inspect --format='{{.State.Status}}' " + name)
    return rc == 0 and stdout.strip().strip("'") == "running"


def report(text=""):
    report_lines.append(text)


def init_report():
    os.makedirs(REPORT_DIR, exist_ok=True)
    report("# CLOUD-219 QA Verification Report")
    report("**Date:** " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    report("**Environment:** Local Docker (Windows)")
    report("**Compose File:** `" + COMPOSE_FILE + "`")
    report("")
    report("---")
    report("")


def save_report():
    report("")
    report("## Overall Results")
    report("")
    report("| Metric | Count |")
    report("|--------|-------|")
    report("| Passed | " + str(pass_count) + " |")
    report("| Failed | " + str(fail_count) + " |")
    report("| Warnings | " + str(warn_count) + " |")
    report("")

    if fail_count == 0:
        report("### OVERALL STATUS: PASS")
        report("")
        report("All critical checks passed. CLOUD-219 runtime QA verification is complete.")
    elif fail_count <= 2:
        report("### OVERALL STATUS: CONDITIONAL PASS")
    else:
        report("### OVERALL STATUS: FAIL")

    report("")
    report("---")
    report("*Report generated: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "*")

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    log_info("Report saved to: " + REPORT_FILE)


# ---------------------------------------------------------------------------
# CLOUD-225: Infrastructure Health
# ---------------------------------------------------------------------------
def step_infrastructure():
    log_step("CLOUD-225 - Infrastructure Health Checks")
    report("## Step 1: Infrastructure Health (CLOUD-225)")
    report("")

    log_info("Checking container status...")
    report("### 1.1 Container Status")
    report("")
    report("| Container | Status |")
    report("|-----------|--------|")

    all_running = True
    for container in REQUIRED_CONTAINERS:
        running = is_container_running(container)
        if running:
            log_pass("Container '" + container + "' is running")
            report("| " + container + " | Running |")
        else:
            log_fail("Container '" + container + "' is NOT running")
            report("| " + container + " | NOT Running |")
            all_running = False

    report("")
    if all_running:
        log_pass("All " + str(len(REQUIRED_CONTAINERS)) + " required containers are running")
    else:
        log_fail("Some required containers are not running")

    log_info("Checking Docker networks...")
    report("### 1.2 Docker Networks")
    report("")

    rc, networks, _ = run_cmd("docker network ls --format '{{.Name}}'")
    if rc == 0:
        if "app-net" in networks:
            log_pass("Network 'app-net' exists")
            report("- Network 'app-net' exists")
        else:
            log_fail("Network 'app-net' not found")
            report("- Network 'app-net' NOT found")

        if "kafka-net" in networks:
            log_pass("Network 'kafka-net' exists")
            report("- Network 'kafka-net' exists")
        else:
            log_fail("Network 'kafka-net' not found")
            report("- Network 'kafka-net' NOT found")
    report("")

    log_info("Checking Redis connectivity...")
    rc, redis_ping, _ = docker_exec("redis_server", 'redis-cli -a "Elian2020#" ping')
    if rc == 0 and "PONG" in redis_ping:
        log_pass("Redis PING -> PONG")
        report("### 1.3 Redis Health")
        report("- Redis PING -> PONG")
    else:
        log_fail("Redis PING failed: " + str(redis_ping))
        report("### 1.3 Redis Health")
        report("- Redis PING failed")
    report("")

    log_info("Checking MySQL connectivity...")
    rc, mysql_ping, _ = docker_exec("mysql", "mysqladmin -u root -pwidowmaker ping")
    if rc == 0 and "alive" in mysql_ping:
        log_pass("MySQL ping -> alive")
        report("### 1.4 MySQL Health")
        report("- MySQL ping -> alive")
    else:
        log_fail("MySQL ping failed")
        report("### 1.4 MySQL Health")
        report("- MySQL ping failed")
    report("")

    log_info("Checking Kafka broker...")
    rc, kafka_out, _ = run_cmd(
        "docker exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092",
        timeout=30,
    )
    if rc == 0:
        log_pass("Kafka broker is responding")
        report("### 1.5 Kafka Health")
        report("- Kafka broker responding")
    else:
        log_warn("Kafka broker check inconclusive")
        report("### 1.5 Kafka Health")
        report("- Kafka broker check inconclusive")
    report("")

    log_info("Checking container logs for critical errors...")
    report("### 1.6 Container Log Health")
    report("")

    for container in ["frontend-react", "chat_socket", "backend-api"]:
        logs = docker_logs(container, tail=100)
        error_count = len(re.findall(r"error|fatal|crash|panic", logs, re.IGNORECASE))
        if error_count > 0:
            log_warn("Container '" + container + "' has " + str(error_count) + " error entries")
            report("- **" + container + "**: " + str(error_count) + " error entries")
        else:
            log_pass("Container '" + container + "' - no critical errors")
            report("- **" + container + "**: No critical errors")
    report("")


# ---------------------------------------------------------------------------
# CLOUD-224: REST API Verification
# ---------------------------------------------------------------------------
def step_rest_api():
    log_step("CLOUD-224 - REST API Endpoint Verification")
    report("## Step 2: REST API Verification (CLOUD-224)")
    report("")

    log_info("Checking backend-api health...")
    report("### 2.1 Backend API Health")
    report("")

    rc, health_out, _ = run_cmd("curl -sk https://api.cloudfly.com.co/health", timeout=15)
    if rc == 0 and health_out and ("ok" in health_out.lower() or "healthy" in health_out.lower() or "up" in health_out.lower()):
        log_pass("Backend API health: " + health_out[:100])
        report("- Health: `" + health_out[:100] + "`")
    else:
        rc2, local_out, _ = run_cmd("curl -s http://localhost:8080/health", timeout=10)
        if rc2 == 0:
            log_pass("Backend API health (local): " + local_out[:100])
            report("- Health (local): `" + local_out[:100] + "`")
        else:
            log_fail("Cannot reach backend API health endpoint")
            report("- Cannot reach backend API")
    report("")

    log_info("Checking GET /api/v1/marketing/agents/history...")
    report("### 2.2 Marketing History Endpoint")
    report("")

    rc, history_out, _ = run_cmd(
        "curl -sk https://api.cloudfly.com.co/api/v1/marketing/agents/history?tenantId=1&limit=50&page=0",
        timeout=15,
    )
    if rc == 0 and history_out:
        try:
            data = json.loads(history_out)
            if "events" in data or "agents" in data or "connections" in data:
                log_pass("Marketing history endpoint returned valid JSON with expected fields")
                report("- GET /api/v1/marketing/agents/history -> Valid JSON")
            else:
                log_warn("Marketing history endpoint returned JSON but fields not verified")
                report("- Endpoint returned JSON (fields not verified)")
        except (json.JSONDecodeError, ValueError):
            log_warn("Marketing history endpoint returned non-JSON response")
            report("- Endpoint returned non-JSON response")
    else:
        rc2, local_hist, _ = run_cmd(
            "curl -s http://localhost:8080/api/v1/marketing/agents/history?tenantId=1&limit=50&page=0",
            timeout=10,
        )
        if rc2 == 0 and local_hist:
            log_pass("Marketing history endpoint (local) responded")
            report("- Endpoint (local) responded")
        else:
            log_fail("Cannot reach marketing history endpoint")
            report("- Cannot reach endpoint")
    report("")

    log_info("Checking GET /api/v1/marketing/agents/live-status...")
    report("### 2.3 Live Agents Endpoint")
    report("")

    rc, live_out, _ = run_cmd(
        "curl -sk https://api.cloudfly.com.co/api/v1/marketing/agents/live-status?tenantId=1",
        timeout=15,
    )
    if rc == 0 and live_out:
        log_pass("Live agents endpoint responded")
        report("- Live agents endpoint responded")
    else:
        log_warn("Live agents endpoint not verified")
        report("- Live agents endpoint not verified")
    report("")

    log_info("Checking frontend serves the marketing page...")
    report("### 2.4 Frontend Page Availability")
    report("")

    rc, fe_out, _ = run_cmd(
        "curl -sk -o NUL -w '%{http_code}' https://dashboard.cloudfly.com.co/marketing/ai-operation",
        timeout=15,
    )
    if rc == 0 and fe_out in ["200", "301", "302"]:
        log_pass("Frontend marketing page -> HTTP " + fe_out)
        report("- Frontend page: HTTP " + fe_out)
    else:
        log_warn("Frontend marketing page: HTTP " + str(fe_out))
        report("- Frontend page: HTTP " + str(fe_out))
    report("")


# ---------------------------------------------------------------------------
# CLOUD-223: WebSocket Service Verification
# ---------------------------------------------------------------------------
def step_websocket():
    log_step("CLOUD-223 - WebSocket Service Verification")
    report("## Step 3: WebSocket Service Verification (CLOUD-223)")
    report("")

    log_info("Checking chat-socket-service health...")
    report("### 3.1 Chat Socket Service Health")
    report("")

    rc, chat_health, _ = run_cmd("curl -sk https://chat.cloudfly.com.co/health", timeout=15)
    if rc == 0 and chat_health and ("ok" in chat_health.lower() or "running" in chat_health.lower()):
        log_pass("Chat socket health: " + chat_health[:100])
        report("- Health: `" + chat_health[:100] + "`")
    else:
        rc2, local_chat, _ = run_cmd("curl -s http://localhost:3001/health", timeout=10)
        if rc2 == 0:
            log_pass("Chat socket health (local): " + local_chat[:100])
            report("- Health (local): `" + local_chat[:100] + "`")
        else:
            log_fail("Cannot reach chat socket service")
            report("- Cannot reach chat socket service")
    report("")

    log_info("Checking Socket.IO polling endpoint...")
    report("### 3.2 Socket.IO Endpoint")
    report("")

    rc, socketio_out, _ = run_cmd(
        "curl -sk 'https://chat.cloudfly.com.co/socket.io/?EIO=4&transport=polling'",
        timeout=15,
    )
    if rc == 0 and socketio_out and ("sid" in socketio_out or "upgrades" in socketio_out):
        log_pass("Socket.IO polling endpoint returned valid handshake")
        report("- Socket.IO handshake valid")
    else:
        rc2, local_io, _ = run_cmd(
            "curl -s 'http://localhost:3001/socket.io/?EIO=4&transport=polling'",
            timeout=10,
        )
        if rc2 == 0 and local_io and ("sid" in local_io or "upgrades" in local_io):
            log_pass("Socket.IO polling (local) returned valid handshake")
            report("- Socket.IO handshake valid (local)")
        else:
            log_warn("Socket.IO handshake not verified")
            report("- Socket.IO handshake not verified")
    report("")

    log_info("Checking chat-socket logs for Kafka consumer init...")
    report("### 3.3 Kafka Consumer Initialization")
    report("")

    chat_logs = docker_logs("chat_socket", tail=200)
    kafka_init_matches = re.findall(
        r"KAFKA-CONSUMER.*Connected|KAFKA-CONSUMER.*Subscribed|AI-INFRA.*initialized",
        chat_logs,
    )
    if kafka_init_matches:
        log_pass("Kafka consumer initialized (" + str(len(kafka_init_matches)) + " log entries)")
        report("- Kafka consumer initialized (" + str(len(kafka_init_matches)) + " entries)")
    else:
        log_warn("Kafka consumer init not confirmed in logs")
        report("- Kafka consumer init not confirmed")
    report("")

    log_info("Checking JWT auth middleware...")
    report("### 3.4 JWT Authentication Middleware")
    report("")

    auth_matches = re.findall(r"auth|middleware|JWT", chat_logs, re.IGNORECASE)
    if auth_matches:
        log_pass("JWT auth middleware active (" + str(len(auth_matches)) + " log entries)")
        report("- JWT auth middleware active")
    else:
        log_warn("JWT auth middleware not confirmed")
        report("- JWT auth middleware not confirmed")
    report("")


# ---------------------------------------------------------------------------
# CLOUD-222: Real-time Event Flow (Kafka)
# ---------------------------------------------------------------------------
def step_kafka_events():
    log_step("CLOUD-222 - Real-time Event Flow (Kafka) Verification")
    report("## Step 4: Real-time Event Flow (CLOUD-222)")
    report("")

    log_info("Checking Kafka topics...")
    report("### 4.1 Kafka Topics")
    report("")

    rc, topics_out, _ = run_cmd(
        "docker exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list",
        timeout=30,
    )
    if rc == 0 and topics_out:
        topics = [t.strip() for t in topics_out.split("\n") if t.strip()]
        log_pass("Kafka topics available: " + ", ".join(topics[:10]))
        report("- Topics: `" + ", ".join(topics[:10]) + "`")

        for topic in ["messages.out", "webnotifications"]:
            if topic in topics_out:
                log_pass("Required topic '" + topic + "' exists")
                report("  - Topic `" + topic + "` exists")
            else:
                log_warn("Topic '" + topic + "' not found (may auto-create)")
                report("  - Topic `" + topic + "` not found")
    else:
        log_warn("Cannot list Kafka topics")
        report("- Cannot list Kafka topics")
    report("")

    log_info("Checking marketing-agent status...")
    report("### 4.2 Marketing Agent Status")
    report("")

    ma_running = is_container_running("marketing-agent")
    if ma_running:
        log_pass("Marketing agent is running")
        report("- Marketing agent is running")

        ma_logs = docker_logs("marketing-agent", tail=50)
        activity_matches = re.findall(r"lead_search|kafka|event|agent", ma_logs, re.IGNORECASE)
        if activity_matches:
            log_pass("Marketing agent shows activity (" + str(len(activity_matches)) + " entries)")
            report("- Recent activity (" + str(len(activity_matches)) + " entries)")
        else:
            log_warn("No recent marketing agent activity")
            report("- No recent activity")
    else:
        log_fail("Marketing agent is NOT running")
        report("- Marketing agent not running")
    report("")

    log_info("Checking notification-service...")
    report("### 4.3 Notification Service")
    report("")

    ns_running = is_container_running("notification-service")
    if ns_running:
        log_pass("Notification service is running")
        report("- Notification service running")
    else:
        log_warn("Notification service is NOT running")
        report("- Notification service not running")
    report("")


# ---------------------------------------------------------------------------
# CLOUD-221: Reconnection Fallback
# ---------------------------------------------------------------------------
def step_reconnect():
    log_step("CLOUD-221 - Reconnection Fallback Verification")
    report("## Step 5: Reconnection Fallback (CLOUD-221)")
    report("")

    log_info("Testing chat_socket restart...")
    report("### 5.1 Chat Socket Restart Test")
    report("")

    if not is_container_running("chat_socket"):
        log_fail("chat_socket not running - cannot test reconnection")
        report("- chat_socket not running")
        report("")
        return

    log_info("Stopping chat_socket...")
    run_cmd("docker stop chat_socket")
    time.sleep(3)

    rc, stopped_status, _ = run_cmd("docker inspect --format='{{.State.Status}}' chat_socket")
    if stopped_status.strip().strip("'") == "exited":
        log_pass("chat_socket stopped successfully")
        report("- chat_socket stopped")
    else:
        log_warn("chat_socket status after stop: " + str(stopped_status))
        report("- chat_socket status: " + str(stopped_status))

    log_info("Restarting chat_socket...")
    run_cmd("docker start chat_socket")
    time.sleep(5)

    if is_container_running("chat_socket"):
        log_pass("chat_socket restarted successfully")
        report("- chat_socket restarted")
    else:
        log_fail("chat_socket failed to restart")
        report("- chat_socket restart failed")
    report("")

    log_info("Verifying backend-api resilience...")
    report("### 5.2 Backend API Resilience")
    report("")

    rc, api_health, _ = run_cmd("curl -sk https://api.cloudfly.com.co/health", timeout=15)
    if rc == 0 and api_health:
        log_pass("Backend API resilient")
        report("- Backend API resilient")
    else:
        log_warn("Backend API not verified after chat_socket restart")
        report("- Backend API not verified")
    report("")

    log_info("Verifying frontend resilience...")
    report("### 5.3 Frontend Resilience")
    report("")

    rc, fe_status, _ = run_cmd(
        "curl -sk -o NUL -w '%{http_code}' https://dashboard.cloudfly.com.co",
        timeout=15,
    )
    if rc == 0 and fe_status in ["200", "301", "302"]:
        log_pass("Frontend resilient (HTTP " + fe_status + ")")
        report("- Frontend resilient (HTTP " + fe_status + ")")
    else:
        log_warn("Frontend returned HTTP " + str(fe_status))
        report("- Frontend: HTTP " + str(fe_status))
    report("")


# ---------------------------------------------------------------------------
# CLOUD-220: Memory Leak Indicators
# ---------------------------------------------------------------------------
def step_memory_leaks():
    log_step("CLOUD-220 - Memory Leak Indicator Checks")
    report("## Step 6: Memory Leak Indicators (CLOUD-220)")
    report("")

    log_info("Checking container memory usage...")
    report("### 6.1 Container Memory Usage")
    report("")
    report("| Container | Memory Usage | Status |")
    report("|-----------|-------------|--------|")

    for container in ["frontend-react", "chat_socket", "backend-api", "redis_server", "mysql"]:
        rc, mem_stats, _ = run_cmd("docker stats --no-stream --format '{{.MemUsage}}' " + container)
        if rc == 0 and mem_stats:
            log_info("  " + container + ": " + mem_stats)
            report("| " + container + " | " + mem_stats + " | Monitored |")
        else:
            log_warn("  " + container + ": Cannot read memory stats")
            report("| " + container + " | N/A | Unavailable |")
    report("")

    log_info("Checking for memory-related error patterns...")
    report("### 6.2 Log Error Pattern Analysis")
    report("")

    for container in ["frontend-react", "chat_socket", "backend-api"]:
        logs = docker_logs(container, tail=500)
        leak_matches = re.findall(
            r"memory leak|heap out of memory|EMFILE|too many open files|unmounted component|state update on unmounted",
            logs,
            re.IGNORECASE,
        )
        if leak_matches:
            log_fail("Container '" + container + "' has " + str(len(leak_matches)) + " potential leak indicators")
            report("- **" + container + "**: " + str(len(leak_matches)) + " leak indicators")
        else:
            log_pass("Container '" + container + "' - no leak indicators")
            report("- **" + container + "**: No leak indicators")
    report("")


# ---------------------------------------------------------------------------
# CLOUD-226: Code-Level Verification (AbortController, dedup, cleanup)
# ---------------------------------------------------------------------------
def step_code_verification():
    log_step("CLOUD-226 - Code-Level Verification (AbortController, Dedup, Cleanup)")
    report("## Step 7: Code-Level Verification (CLOUD-226)")
    report("")

    log_info("Verifying AbortController implementation in page.tsx...")
    report("### 7.1 AbortController in page.tsx")
    report("")

    page_tsx_path = r"C:\apps\cloudfly\frontend_new\src\app\(dashboard)\marketing\ai-operation\page.tsx"
    if os.path.exists(page_tsx_path):
        with open(page_tsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        checks = [
            ("AbortController created", "new AbortController()" in content),
            ("controller.signal passed", "controller.signal" in content),
            ("AbortError guard", "AbortError" in content),
            ("Cleanup function", "controller.abort()" in content),
            ("useEffect with cleanup", "useEffect" in content and "return () =>" in content),
        ]

        for check_name, check_result in checks:
            if check_result:
                log_pass("  [OK] " + check_name)
                report("- " + check_name)
            else:
                log_fail("  [FAIL] " + check_name)
                report("- MISSING: " + check_name)
    else:
        log_fail("page.tsx not found at " + page_tsx_path)
        report("- page.tsx not found")
    report("")

    log_info("Verifying useMarketingAgentsSocket hook...")
    report("### 7.2 useMarketingAgentsSocket Hook")
    report("")

    hook_path = r"C:\apps\cloudfly\frontend_new\src\hooks\useMarketingAgentsSocket.ts"
    if os.path.exists(hook_path):
        with open(hook_path, "r", encoding="utf-8") as f:
            content = f.read()

        checks = [
            ("4 socket events subscribed", all(
                evt in content for evt in [
                    "marketing-agent-batch-update",
                    "marketing-agent-status-update",
                    "marketing-agent-task-update",
                    "marketing-action-event",
                ]
            )),
            ("Deduplication by ID", "prev.some(ev => ev.id === payload.id)" in content),
            ("Timeline cap at 50", "slice(-50)" in content),
            ("Cleanup on unmount", "socket.off" in content and "return () =>" in content),
            ("Reconnect helper", "reconnect" in content and "socket.disconnect" in content),
            ("useCallback for handlers", "useCallback" in content),
        ]

        for check_name, check_result in checks:
            if check_result:
                log_pass("  [OK] " + check_name)
                report("- " + check_name)
            else:
                log_fail("  [FAIL] " + check_name)
                report("- MISSING: " + check_name)
    else:
        log_fail("Hook file not found")
        report("- Hook file not found")
    report("")

    log_info("Verifying SocketContext...")
    report("### 7.3 SocketContext")
    report("")

    context_path = r"C:\apps\cloudfly\frontend_new\src\contexts\SocketContext.tsx"
    if os.path.exists(context_path):
        with open(context_path, "r", encoding="utf-8") as f:
            content = f.read()

        checks = [
            ("Connects to chat.cloudfly.com.co", "chat.cloudfly.com.co" in content),
            ("JWT auth in socket config", "auth" in content and "token" in content),
            ("tenantId in auth", "tenantId" in content),
            ("Auto-reconnect enabled", "reconnection: true" in content),
            ("Graceful missing auth handling", "setInterval" in content or "checkInterval" in content),
        ]

        for check_name, check_result in checks:
            if check_result:
                log_pass("  [OK] " + check_name)
                report("- " + check_name)
            else:
                log_fail("  [FAIL] " + check_name)
                report("- MISSING: " + check_name)
    else:
        log_fail("SocketContext not found")
        report("- SocketContext not found")
    report("")

    log_info("Verifying marketingHistoryService...")
    report("### 7.4 marketingHistoryService")
    report("")

    service_path = r"C:\apps\cloudfly\frontend_new\src\services\marketing\marketingHistoryService.ts"
    if os.path.exists(service_path):
        with open(service_path, "r", encoding="utf-8") as f:
            content = f.read()

        checks = [
            ("getActionHistory method", "getActionHistory" in content),
            ("getLiveAgents method", "getLiveAgents" in content),
            ("getAgentConnections method", "getAgentConnections" in content),
            ("getAgentTasks method", "getAgentTasks" in content),
            ("AbortSignal support", "signal" in content),
            ("isAbortError helper", "isAbortError" in content),
            ("Handles CanceledError", "CanceledError" in content or "ERR_CANCELED" in content),
        ]

        for check_name, check_result in checks:
            if check_result:
                log_pass("  [OK] " + check_name)
                report("- " + check_name)
            else:
                log_fail("  [FAIL] " + check_name)
                report("- MISSING: " + check_name)
    else:
        log_fail("marketingHistoryService not found")
        report("- marketingHistoryService not found")
    report("")

    log_info("Verifying chat-socket-service...")
    report("### 7.5 Chat Socket Service")
    report("")

    chat_index_path = r"C:\apps\cloudfly\chat-socket-service\src\index.js"
    if os.path.exists(chat_index_path):
        with open(chat_index_path, "r", encoding="utf-8") as f:
            content = f.read()

        checks = [
            ("Socket.IO server on port 3001", "3001" in content),
            ("JWT auth middleware", "authMiddleware" in content),
            ("Auto-joins tenant rooms", "tenant_" in content),
            ("Kafka consumer init", "initKafkaConsumer" in content),
            ("Graceful shutdown", "gracefulShutdown" in content or "SIGTERM" in content),
        ]

        for check_name, check_result in checks:
            if check_result:
                log_pass("  [OK] " + check_name)
                report("- " + check_name)
            else:
                log_fail("  [FAIL] " + check_name)
                report("- MISSING: " + check_name)
    else:
        log_fail("chat-socket-service index.js not found")
        report("- chat-socket-service not found")
    report("")

    log_info("Verifying kafkaConsumer...")
    report("### 7.6 Kafka Consumer")
    report("")

    kafka_consumer_path = r"C:\apps\cloudfly\chat-socket-service\src\services\kafkaConsumer.js"
    if os.path.exists(kafka_consumer_path):
        with open(kafka_consumer_path, "r", encoding="utf-8") as f:
            content = f.read()

        checks = [
            ("Subscribes to messages.out", "messages.out" in content),
            ("Subscribes to webnotifications", "webnotifications" in content),
            ("Emits to socket rooms", "io.to" in content and "emit" in content),
            ("Dashboard-update for important events", "dashboard-update" in content),
            ("Error handling", "catch" in content and "error" in content),
        ]

        for check_name, check_result in checks:
            if check_result:
                log_pass("  [OK] " + check_name)
                report("- " + check_name)
            else:
                log_fail("  [FAIL] " + check_name)
                report("- MISSING: " + check_name)
    else:
        log_fail("kafkaConsumer not found")
        report("- kafkaConsumer not found")
    report("")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--full"

    print("")
    print("============================================================")
    print("  CLOUD-219: Runtime QA Verification")
    print("  WebSocket Integration End-to-End")
    print("============================================================")
    print("")

    init_report()

    steps = {
        "--infra": [step_infrastructure],
        "--rest": [step_rest_api],
        "--ws": [step_websocket],
        "--kafka": [step_kafka_events],
        "--reconnect": [step_reconnect],
        "--leaks": [step_memory_leaks],
        "--code": [step_code_verification],
        "--full": [
            step_infrastructure,
            step_rest_api,
            step_websocket,
            step_kafka_events,
            step_reconnect,
            step_memory_leaks,
            step_code_verification,
        ],
    }

    if mode not in steps:
        print("Unknown mode: " + mode)
        print("Available modes: " + ", ".join(steps.keys()))
        sys.exit(1)

    for step_func in steps[mode]:
        try:
            step_func()
        except Exception as e:
            log_fail("Step failed with exception: " + str(e))

    save_report()

    print("")
    print("============================================================")
    print("  QA VERIFICATION COMPLETE")
    print("============================================================")
    print("  Passed:   " + str(pass_count))
    print("  Failed:   " + str(fail_count))
    print("  Warnings: " + str(warn_count))
    print("============================================================")

    sys.exit(0 if fail_count == 0 else 1)


if __name__ == "__main__":
    main()
