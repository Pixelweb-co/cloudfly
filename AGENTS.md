# Project Guidance for AI Coding Agents (AGENTS.md)

Welcome, AI Developer Agent! This file is the Universal Source of Truth for all AI assistants working on this repository, as standardized by CrewAI and Vercel Labs. Please read this file in full before performing any modifications.

---

## 🚀 Project Overview
* **Name**: Cloudfly (`C:\apps\cloudfly`)
* **Core Technology Stack**:
  * **Frontend**: Next.js 14 (App Router, React, TypeScript, HSL Hues, Sleek Dark CSS) under `C:\apps\cloudfly\frontend_new`
  * **Backend**: Multi-tenant API, MySQL, Redis, Kafka, Event Broker
  * **Telephony & Messaging**: FreeSWITCH PBX (`vars.xml` password: `-cHb_gyRU1hH`), Evolution API, Chatwoot, and WhatsApp webhook integration
  * **AI Orchestration**: Autonomous 8-agent Scrum Team orchestrator under `C:\apps\cloudfly\ai_scrum_team`
* **Local OS Environment**: Windows (PowerShell)

---

## 🛠️ Key Commands & Operations
* **Run Sprint Orchestrator Loop**:
  ```powershell
  python ai_scrum_team/main.py
  ```
* **Verify Code Syntax**:
  ```powershell
  python -m py_compile ai_scrum_team/main.py ai_scrum_team/agents.py ai_scrum_team/tasks.py
  ```
* **Run E2E Tests**:
  * Conduct Playwright/Cypress integration tests strictly inside `C:\apps\cloudfly\frontend_new\tests\`
  * Prepend test scripts/outputs with the prefix `AGENTE_DEV_`

---

## 🌿 Git & Git Flow Conventions
* **Local Branch Development**: Save and commit all local sprint modifications on a branch named `marketing_ai_team`.
* **VPS Deployment Branch**: The production/staging VPS containers pull exclusively from the `desarrollo` branch.
* **DevOps Remote Connection**:
  * Connect to the VPS `api.cloudfly.com.co:22` as user `root`
  * Use the SSH private key: `C:\Users\Edwin\.ssh\id_rsa_cloudfly`

---

## 📖 Main References
For full technical specifications, database schemas, and complete details of the 8-role Scrum team configuration, please refer directly to the **Master Specification**:
👉 **[spec.md](file:///C:/apps/cloudfly/spec.md)**

---

*Note: Please read this specification and its referenced files in parts ("por partes") using your file reading tools if they are too long, ensuring a stable and token-efficient session.*
