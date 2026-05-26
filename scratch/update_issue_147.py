import os
import sys
from dotenv import load_dotenv
load_dotenv(dotenv_path=r"c:\apps\cloudfly\ai_scrum_team\.env")

from langchain_community.utilities.jira import JiraAPIWrapper

def main():
    os.environ["JIRA_CLOUD"] = "True"
    jira_api = JiraAPIWrapper()
    
    new_description = (
        "h1. Plan de Implementación Detallado y Criterios de Aceptación\n\n"
        "*Tarea original:* Analizar y documentar el agente de IA conversacional. "
        "Sin alterar la lógica existente, agregar un flujo que envíe un mensaje a los usuarios/asesores asignados "
        "al contacto por WhatsApp notificando que hay una conversación asignada en espera de atención humana, "
        "incluyendo un enlace directo a la plataforma para chatear con él. El envío debe realizarse usando la "
        "instancia de WhatsApp de ese tenant correspondiente a la company_id = 1, a través de la cola de Kafka "
        "en `whatsapp-notifications` consumida por `notification-service`.\n\n"
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

    try:
        issue = jira_api.jira.issue("CLOUD-147")
        issue.update(description=new_description)
        print("SUCCESS: CLOUD-147 updated successfully in Jira!")
    except Exception as e:
        print("ERROR: Failed to update issue:", str(e))

if __name__ == "__main__":
    main()
