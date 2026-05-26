import os
import sys
from dotenv import load_dotenv
load_dotenv(dotenv_path=r"c:\apps\cloudfly\ai_scrum_team\.env")

from langchain_community.utilities.jira import JiraAPIWrapper

def main():
    os.environ["JIRA_CLOUD"] = "True"
    jira_api = JiraAPIWrapper()
    
    new_description = (
        "h1. USER STORY & TECHNICAL DESIGN (Consolidated for AI Scrum Team execution)\n\n"
        "**AS** an AI Scrum Agent representing the team\n"
        "**I WANT TO** intercept the `transfer_to_human` trigger inside the AI Agent and send a WhatsApp notification via Kafka `whatsapp-notifications` topic to assigned contact advisors (or fallback tenant admins)\n"
        "**SO THAT** human advisors are immediately notified of a handoff conversation with a direct dashboard link.\n\n"
        "---\n\n"
        "h2. Roles and Sprint Workflow (STRICT CONSTRAINTS)\n"
        "* **Developer Role**: Implement the local Python code changes inside `c:/apps/cloudfly/ai-agent` and verify locally.\n"
        "* **DevOps Role**: **DO NOT WORK ON THIS STORY**. Exclude any VPS deployments, container rebuilds, or VPS staging actions. The product owner will validate, build, deploy, and verify the changes manually.\n"
        "* **QA Role**: **MUST CREATE THE TESTS for this story and leave a detailed comment on this issue on how to execute them step-by-step**.\n\n"
        "---\n\n"
        "h2. Functional Scope & Directory Structure\n"
        "All code modifications are strictly constrained to the Python AI Agent:\n"
        "* **Target Directory**: `c:/apps/cloudfly/ai-agent`\n"
        "No modifications are needed in the Java notification service, as it already listens to the targeted Kafka topic.\n\n"
        "---\n\n"
        "h2. Technical Implementation Specifications (AI Agent Friendly)\n\n"
        "h3. 1. MySQL Queries (c:/apps/cloudfly/ai-agent/infrastructure/mysql_client.py)\n"
        "Add two new async methods inside `AsyncMySQLClient`:\n"
        "* **Method `get_contact_assigned_advisors(contact_id, tenant_id)`**:\n"
        "  - Step A: Fetch contact record: `SELECT assigned_user_ids, name FROM contacts WHERE id = %s AND tenant_id = %s LIMIT 1`.\n"
        "  - Step B: If `assigned_user_ids` is not empty, split the comma-separated IDs (e.g. '1,2') into a list of integers.\n"
        "  - Step C: Run query: \n"
        "    ```sql\n"
        "    SELECT u.id, c.phone, u.email \n"
        "    FROM users u \n"
        "    JOIN contacts c ON u.contact_id = c.id \n"
        "    WHERE u.id IN (%s) AND u.is_enabled = 1;\n"
        "    ```\n"
        "  - Return a list of phone numbers.\n\n"
        "* **Method `get_tenant_admins(tenant_id)`** (Fallback when no advisors are assigned):\n"
        "  - Run query to find all users with role 'ADMIN' (ID: 2) or 'MANAGER' (ID: 3) for the tenant (`customer_id`): \n"
        "    ```sql\n"
        "    SELECT u.id, c.phone, u.email \n"
        "    FROM users u \n"
        "    JOIN user_roles ur ON ur.user_id = u.id \n"
        "    JOIN roles r ON r.id = ur.role_id \n"
        "    JOIN contacts c ON u.contact_id = c.id \n"
        "    WHERE u.customer_id = %s AND r.role_name IN ('ADMIN', 'MANAGER') AND u.is_enabled = 1;\n"
        "    ```\n"
        "  - Return a list of phone numbers.\n\n"
        "h3. 2. Kafka Producer (c:/apps/cloudfly/ai-agent/infrastructure/kafka_producer.py)\n"
        "Add a new method inside `AsyncKafkaProducer` / `MessageProducer`:\n"
        "* **Method `send_whatsapp_notification(tenant_id, company_id, phones, body)`**:\n"
        "  - Publish JSON payload to the topic `whatsapp-notifications`:\n"
        "    ```json\n"
        "    {\n"
        "      \"phones\": \"573XXXXXXXXX,573YYYYYYYYY\",\n"
        "      \"body\": \"[Mensaje de Notificación]\",\n"
        "      \"tenantId\": tenant_id,\n"
        "      \"companyId\": company_id,\n"
        "      \"notifyVia\": \"whatsapp\",\n"
        "      \"type\": \"whatsapp\"\n"
        "    }\n"
        "    ```\n\n"
        "h3. 3. Orchestration Flow (c:/apps/cloudfly/ai-agent/application/main.py)\n"
        "Inside `_process_message`, under the handoff handler block (`if handoff_request:`):\n"
        "# Get contact details by calling `self.db.get_contact_by_id(payload.contact_id, payload.tenant_id)` to get `assigned_user_ids` and `name`.\n"
        "# Call `self.db.get_contact_assigned_advisors(payload.contact_id, payload.tenant_id)`.\n"
        "# If no phones found, fall back to `self.db.get_tenant_admins(payload.tenant_id)`.\n"
        "# If a list of phone numbers is resolved, join them as a comma-separated string.\n"
        "# Generate the notification message body:\n"
        "  `🚨 Atención Asesor: Se ha solicitado transferencia humana para el contacto {contact_name}. Puedes chatear con él/ella aquí: https://dashboard.cloudfly.com.co/contacts/{contact_id}`\n"
        "# Call `self.producer.send_whatsapp_notification(tenant_id=payload.tenant_id, company_id=1, phones=phones_str, body=msg_body)`.\n\n"
        "---\n\n"
        "h2. Acceptance Criteria (AC)\n"
        "# Read `contacts.assigned_user_ids` to fetch assigned advisors on handoff.\n"
        "# Fall back to active tenant users with role 'ADMIN' (role_id=2) or 'MANAGER' (role_id=3) if no advisors are assigned.\n"
        "# Resolve advisor/admin phone numbers via `JOIN contacts c ON u.contact_id = c.id`.\n"
        "# Publish the exact `NotificationMessage` JSON DTO structure to the Kafka `whatsapp-notifications` topic.\n"
        "# Formulate the message containing a direct URL linking to the contact page: `https://dashboard.cloudfly.com.co/contacts/{contactId}`.\n"
    )

    try:
        issue = jira_api.jira.issue("CLOUD-158")
        issue.update(description=new_description)
        print("SUCCESS: CLOUD-158 updated with highly explicit instructions for AI Scrum Team execution!")
    except Exception as e:
        print("ERROR: Failed to update issue:", str(e))

if __name__ == "__main__":
    main()
