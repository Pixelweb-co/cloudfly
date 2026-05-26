import sys
import os
import re
import ast
import json
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team', '.env')
load_dotenv(dotenv_path=env_path)

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team'))

from langchain_community.utilities.jira import JiraAPIWrapper
os.environ["JIRA_CLOUD"] = "True"
jira_api = JiraAPIWrapper()

try:
    print("Searching for ALL issues in project CLOUD...")
    res = jira_api.run("jql", "project = CLOUD ORDER BY key DESC")
    
    match = re.search(r'\[.*\]', res, re.DOTALL)
    if match:
        issues_list = ast.literal_eval(match.group(0))
        print(f"Found {len(issues_list)} issues to delete.")
        
        deleted_count = 0
        for item in issues_list:
            key = item.get("key")
            summary = item.get("summary")
            print(f"Deleting issue: {key} | {summary}")
            try:
                jira_api.jira.delete_issue(key)
                deleted_count += 1
            except Exception as delete_err:
                print(f"Error deleting {key}: {delete_err}")
                
        print(f"CLEANUP COMPLETE: Successfully deleted {deleted_count} tickets!")
    else:
        print("No issues found in project CLOUD.")

    # Create the single new user story
    print("\nCreating the new consolidated User Story with the complete implementation plan...")
    
    summary = "CLOUD-158: Notificación de Transferencia Humana por WhatsApp a Asesores o Administradores"
    description = (
        "h1. Plan de Implementación Detallado y Criterios de Aceptación\n\n"
        "*Descripción del Requerimiento:* Cuando el Agente de IA realiza una transferencia a un asesor humano (`transfer_to_human` o handoff), "
        "el sistema debe notificar por WhatsApp a los asesores asignados a ese contacto. Si el contacto no tiene asesores asignados, "
        "la notificación se enviará al usuario con el rol de Administrador (`ADMIN` con ID `2` o `MANAGER` con ID `3` como fallback) de ese Tenant. "
        "El mensaje se enviará usando la instancia de WhatsApp del tenant asociada a la `companyId = 1`, publicando el payload estructurado "
        "en la cola de Kafka `whatsapp-notifications` para ser consumido y despachado por el `notification-service` (Java).\n\n"
        "---\n\n"
        "h2. Criterios de Aceptación (Acceptance Criteria)\n\n"
        "# *Identificación de Asesores (Asignados):* Al dispararse la transferencia (`transfer_to_human`), "
        "el sistema debe leer el campo `assigned_user_ids` del contacto en la tabla `contacts`.\n"
        "# *Identificación de Fallback (Admin):* Si el contacto no tiene usuarios asignados (`assigned_user_ids` "
        "está vacío o nulo), el sistema debe buscar en la base de datos a los usuarios que tengan el rol de "
        "*Administrador* (`role_name = 'ADMIN'` con ID `2` o `MANAGER` con ID `3`) para el Tenant correspondiente.\n"
        "# *Obtención de Teléfono (JOIN):* El número de teléfono de los asesores/administradores debe obtenerse "
        "mediante un `JOIN` con la tabla `contacts` a través del campo `users.contact_id = contacts.id`.\n"
        "# *Canalización por Kafka (notification-service):* La notificación no se enviará directamente a la "
        "Evolution API desde Python. En su lugar, el `ai-agent` publicará un mensaje JSON estructurado (DTO "
        "`NotificationMessage`) en el topic de Kafka `whatsapp-notifications`.\n"
        "# *Selección Automática de Instancia:* El servicio Java `notification-service` consumirá el mensaje, "
        "buscará la instancia de WhatsApp correspondiente al `tenantId` y `companyId = 1`, y enviará el mensaje exitosamente.\n"
        "# *Enlace Directo en el Mensaje:* El cuerpo del mensaje de WhatsApp debe contener un enlace al chat "
        "directo del contacto en el dashboard, ej: `https://dashboard.cloudfly.com.co/contacts/{contactId}`.\n\n"
        "---\n\n"
        "h2. Plan de Cambios Técnicos\n\n"
        "h3. 1. Base de Datos & mysql_client.py\n"
        "* Modificar `c:/apps/cloudfly/ai-agent/infrastructure/mysql_client.py` agregando los métodos:\n"
        "  - `get_contact_assigned_advisors(contact_id, tenant_id)`: parsea los IDs en `contacts.assigned_user_ids` "
        "y retorna sus números de teléfono (`contacts.phone`).\n"
        "  - `get_tenant_admins(tenant_id)`: busca usuarios con rol `ADMIN` o `MANAGER` de ese tenant y retorna sus teléfonos.\n\n"
        "h3. 2. Kafka Producer & kafka_producer.py\n"
        "* Modificar `c:/apps/cloudfly/ai-agent/infrastructure/kafka_producer.py` agregando:\n"
        "  - `send_whatsapp_notification(tenant_id, company_id, phones, body)`: publica el JSON de notificación en el topic "
        "`whatsapp-notifications` (con campos: `phones`, `body`, `tenantId`, `companyId`, `notifyVia: 'whatsapp'`, `type: 'whatsapp'`).\n\n"
        "h3. 3. Orchestrator & main.py\n"
        "* Modificar `c:/apps/cloudfly/ai-agent/application/main.py`:\n"
        "  - En la sección `_process_message`, cuando `handoff_request` es capturado:\n"
        "    1. Obtener teléfonos de los asesores mediante `get_contact_assigned_advisors`.\n"
        "    2. Si está vacío, obtener teléfonos de los administradores mediante `get_tenant_admins`.\n"
        "    3. Construir el mensaje con el enlace al contacto.\n"
        "    4. Invocar a `self.producer.send_whatsapp_notification`.\n"
    )

    payload = {
        "summary": summary,
        "description": description,
        "project": {"key": "CLOUD"},
        "issuetype": {"name": "Historia"}
    }
    
    res = jira_api.run("create_issue", json.dumps(payload, ensure_ascii=False))
    print(f"SUCCESS: Consolidated User Story created successfully! Response: {res}")
    
except Exception as e:
    print("ERROR during operation:", str(e))
