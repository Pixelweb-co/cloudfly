import sys
import os
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team', '.env')
load_dotenv(dotenv_path=env_path)

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team'))

from langchain_community.utilities.jira import JiraAPIWrapper
os.environ["JIRA_CLOUD"] = "True"
jira_api = JiraAPIWrapper()

key = "CLOUD-137"

try:
    print(f"Updating Jira Issue {key} with the refined lead qualification requirements...")
    
    refined_description = (
        "**COMO** prospecto frío contactado por WhatsApp\n"
        "**QUIERO** que al responder al mensaje de prospección, el agente conversacional (ai-agent) entienda el contexto de la campaña y el producto que me fue ofrecido originalmente\n"
        "**PARA** recibir un seguimiento coherente, personalizado y de alta conversión.\n\n"
        "**🔥 NUEVO REQUERIMIENTO - CALIFICACIÓN DE LEADS:**\n"
        "El `ai-agent` debe **evaluar y calificar al prospecto (Lead Scoring)** de manera dinámica durante la conversación, basándose en la información de la compañía y el producto específico que se está ofreciendo en el mensaje.\n"
        "- Si el prospecto muestra alto interés, pregunta por precios/demos, o encaja en el perfil de cliente ideal (ICP) del producto, el agente debe actualizar su score a `HOT` o `WARM` en el CRM y/o asignarle la etiqueta correspondiente.\n\n"
        "**Criterios de Aceptación:**\n"
        "1. Al consumir eventos de entrada en `ai-agent` (vía Kafka), consultar la existencia de la llave de contexto en Redis.\n"
        "2. Si existe la llave, recuperar el producto, campaña y metadata de la compañía.\n"
        "3. Inyectar en el `system_prompt` las reglas del producto y la instrucción explícita de **evaluar la intención de compra del prospecto**.\n"
        "4. Integrar una llamada de herramienta (tool call) en el agente de IA para actualizar dinámicamente el score del contacto a `HOT`/`WARM`/`COLD` en la base de datos de MySQL según el progreso del chat."
    )
    
    # We update the issue description
    issue = jira_api.jira.issue(key)
    jira_api.jira.update_issue_field(key, {"description": refined_description})
    print(f"✅ Successfully updated description for {key}!")
    
    # Post a confirmation comment
    comment = (
        "✍️ **Edwin (PO Refinement)**: Se ha refinado este requerimiento para incluir la **Calificación Dinámica de Leads**.\n"
        "El agente conversacional evaluará en tiempo real la correspondencia del prospecto con el producto ofrecido "
        "y la información de la compañía, actualizando su score a `HOT`, `WARM` o `COLD` en el CRM mediante tools de base de datos."
    )
    jira_api.jira.issue_add_comment(key, comment)
    print("Comment posted successfully!")

except Exception as e:
    print(f"Error updating issue {key}: {e}")

print("==================================================")
print("Finished updating Jira requirements.")
print("==================================================")
