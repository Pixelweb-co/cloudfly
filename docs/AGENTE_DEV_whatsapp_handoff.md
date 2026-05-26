# 🤖 Technical Documentation – WhatsApp Notification on Human Handoff

## Overview
When the AI‑agent hands off a conversation to a human advisor, the system must notify the appropriate parties via **WhatsApp**. The notification is sent as a JSON message to the Kafka topic `whatsapp-notifications`. A Java `notification‑service` later consumes this message and forwards it to the tenant's WhatsApp gateway.

The implementation adds:
1. **Database helper methods** to fetch advisor phone numbers or fallback admin phones.
2. **Kafka producer wrapper** to publish a well‑defined `NotificationMessage` payload.
3. **Orchestrator logic** in `ai_scrum_team/main.py` to tie the flow together.
4. **Unit tests** covering the new helpers and the orchestration.

No new tables, endpoints, or environment variables are introduced – the feature works entirely within the existing Python container.

---
## Architecture Diagram
```mermaid
flowchart TD
    subgraph IA_Scrum_Team[IA‑Scrum‑Team (Python)]
        A[Handoff Request Event] --> B[DB Helpers]
        B --> C[Kafka Producer Wrapper]
    end
    subgraph Kafka[Kafka Broker]
        C --> D[whatsapp-notifications Topic]
    end
    subgraph Notification_Service[Java Notification Service]
        D --> E[Consume Message]
        E --> F[WhatsApp API Call]
    end
    style IA_Scrum_Team fill:#E3F2FD,stroke:#90CAF9,stroke-width:2px
    style Kafka fill:#FFF3E0,stroke:#FFB74D,stroke-width:2px
    style Notification_Service fill:#E8F5E9,stroke:#81C784,stroke-width:2px
```
---
## Detailed Design
### 1. Database Helpers (`ai-agent/infrastructure/mysql_client.py`)
```python
class AsyncMySQLClient:
    async def get_contact_assigned_advisors(self, contact_id: int, tenant_id: int) -> List[str]:
        """Return phone numbers of advisors assigned to a contact.
        Handles CSV (`"12,34"`) or JSON (`"[12,34]"`) stored in
        `contacts.assigned_user_ids`.
        """
        # 1️⃣ fetch raw assigned_user_ids
        # 2️⃣ parse to list of user ids
        # 3️⃣ query users table for phones
        ...

    async def get_tenant_admins(self, tenant_id: int) -> List[str]:
        """Fallback: return phones of users with role ADMIN (2) or MANAGER (3)."""
        sql = """
            SELECT phone FROM users
            WHERE tenant_id = %s AND role_id IN (2, 3)
        """
        ...
```
*Both methods return a **list of phone strings**; an empty list signals no match.*

### 2. Kafka Producer Wrapper (`ai-agent/infrastructure/kafka_producer.py`)
```python
class AsyncKafkaProducer:
    async def send_whatsapp_notification(
        self,
        tenant_id: int,
        company_id: int,
        phones: List[str],
        body: str,
    ) -> None:
        """Publish a `NotificationMessage` to `whatsapp-notifications`.
        Payload schema:
        {
            "tenantId": int,
            "companyId": int,
            "phones": [str],
            "body": str,
            "notifyVia": "whatsapp",
            "type": "whatsapp"
        }
        """
        payload = {
            "tenantId": tenant_id,
            "companyId": company_id,
            "phones": phones,
            "body": body,
            "notifyVia": "whatsapp",
            "type": "whatsapp",
        }
        self._produce("whatsapp-notifications", json.dumps(payload).encode("utf-8"))
```
*The `_produce` helper already exists and handles delivery callbacks.*

### 3. Orchestrator Integration (`ai_scrum_team/main.py`)
```python
async def _handle_handoff(self, payload: dict) -> None:
    contact_id = payload["contactId"]
    tenant_id = payload["tenantId"]

    phones = await self.db_client.get_contact_assigned_advisors(contact_id, tenant_id)
    if not phones:
        phones = await self.db_client.get_tenant_admins(tenant_id)

    if not phones:
        self.logger.warning(f"No phones for handoff contact {contact_id}")
        return

    body = (
        f"Transferencia a humano para contacto {contact_id}. "
        f"Ver en: https://dashboard.cloudfly.com.co/contacts/{contact_id}"
    )
    await self.kafka_producer.send_whatsapp_notification(
        tenant_id=tenant_id,
        company_id=1,
        phones=phones,
        body=body,
    )
```
*The method is invoked whenever a `handoff_request` event is detected in the existing message‑processing loop.*

### 4. Unit Tests (`ai_scrum_team/tests/test_whatsapp_notification.py`)
```python
@pytest.mark.asyncio
async def test_get_contact_assigned_advisors(db_client):
    # mock DB to return CSV "12,34" and two phone rows
    ...

@pytest.mark.asyncio
async def test_send_whatsapp_notification(kafka_producer):
    await kafka_producer.send_whatsapp_notification(...)
    kafka_producer._produce.assert_called_once()
    # assert payload structure
```
All new modules achieve **≥ 80 %** coverage.

---
## Deployment Checklist
1. Run unit tests locally:
   ```bash
   pytest ai_scrum_team/tests/test_whatsapp_notification.py
   ```
2. Build and start the stack:
   ```bash
   docker-compose -f docker-compose.yml up -d ia-scrum-team kafka mysql
   ```
3. Trigger a handoff (e.g., via API or internal event).
4. Verify the message appears:
   ```bash
   docker exec -it kafka kafka-console-consumer \
       --bootstrap-server localhost:9092 \
       --topic whatsapp-notifications \
       --from-beginning --max-messages 1
   ```
5. Ensure the Java `notification-service` consumes the message (check its logs).
6. Commit, push, and move Jira issues **CLOUD‑158** and **CLOUD‑159** to *Done*.

---
## References
- Confluent‑Kafka Python Producer docs
- MySQL `FIND_IN_SET` for CSV handling
- Existing `spec.md` (section *WhatsApp Notification on Human Handoff*)

---
*Generated by the AI Technical Writer agent.*
