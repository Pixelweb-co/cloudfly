import sys
import os
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

stories = [
    {
        "summary": "CLOUD-140: Integrar marketing-agent con servicio lead-generator para prospección fría",
        "description": (
            "**COMO** miembro del equipo de marketing\n"
            "**QUIERO** buscar prospectos fríos utilizando la información del perfil del negocio y el catálogo de productos a través del servicio lead-generator en el puerto 8001\n"
            "**PARA** almacenarlos de forma estructurada en las listas del CRM y automatizar el embudo de captación.\n\n"
            "**Criterios de Aceptación:**\n"
            "1. Obtener los productos de la compañía activa desde MySQL.\n"
            "2. Extraer mediante OpenRouter las palabras clave de prospección óptimas.\n"
            "3. Consumir el cliente `lead-generator` en el puerto 8001 enviando las palabras clave.\n"
            "4. Insertar los contactos prospectados en el CRM (Base de datos MySQL)."
        ),
        "issuetype": "Historia"
    },
    {
        "summary": "CLOUD-141: Iniciar envío por WhatsApp y almacenar contexto de campaña en Redis",
        "description": (
            "**COMO** administrador del sistema de automatización\n"
            "**QUIERO** que al momento de disparar el envío masivo de la campaña por WhatsApp, el sistema guarde en Redis un contexto activo del contacto (producto promocionado, campaña, metadata del negocio)\n"
            "**PARA** dar trazabilidad al origen del prospecto frío.\n\n"
            "**Criterios de Aceptación:**\n"
            "1. Al iniciar la campaña de WhatsApp, generar la entrada en Redis con formato `campaign_context:contact:<id_contacto>`.\n"
            "2. Guardar en el hash: `campaign_id`, `product_id`, `company_id` y `pitch_message`.\n"
            "3. Establecer expiración (TTL) en Redis por 7 días."
        ),
        "issuetype": "Historia"
    },
    {
        "summary": "CLOUD-142: Sincronizar ai-agent con contexto de Redis para seguimiento conversacional",
        "description": (
            "**COMO** prospecto frío contactado por WhatsApp\n"
            "**QUIERO** que al responder al mensaje de prospección, el agente conversacional (ai-agent) entienda el contexto de la campaña y el producto que me fue ofrecido originalmente\n"
            "**PARA** recibir un seguimiento coherente, personalizado y de alta conversión.\n\n"
            "**Criterios de Aceptación:**\n"
            "1. Al consumir eventos de entrada en `ai-agent` (Kafka / `kafka_consumer.py`), consultar la existencia de la llave de contexto en Redis.\n"
            "2. Si existe la llave, recuperar el producto y campaña correspondientes.\n"
            "3. Inyectar de manera dinámica en el `system_prompt` del LLM las instrucciones sobre el producto ofrecido y el tono conversacional de seguimiento comercial."
        ),
        "issuetype": "Historia"
    },
    {
        "summary": "CLOUD-143: Actualizar marketing-agent con modelos de OpenRouter y pool de llaves resiliente",
        "description": (
            "**COMO** DevOps y Arquitecto del sistema\n"
            "**QUIERO** que el marketing-agent consuma el pool de API keys de OpenRouter y cuente con lógica de reintento automático y rotación ante errores 429 de Rate Limit\n"
            "**PARA** garantizar que el servicio de IA no se interrumpa en producción.\n\n"
            "**Criterios de Aceptación:**\n"
            "1. Cargar la variable `OPENROUTER_KEYS_POOL` desde `.env.vps` en `marketing_agent/config.py`.\n"
            "2. Modificar `ai_ad_service.py` con una rutina de 6 reintentos automáticos y rotación de API keys ante errores `429` (RateLimitError).\n"
            "3. Confirmar mediante tests que la rotación se activa transparentemente si una key falla."
        ),
        "issuetype": "Historia"
    }
]

print("Starting creation of refined User Stories in Jira...")
for s in stories:
    payload = {
        "summary": s["summary"],
        "description": s["description"],
        "project": {"key": "CLOUD"},
        "issuetype": {"name": "Historia"} # Historia is the localized name for Story in Spanish Jira Cloud
    }
    
    try:
        res = jira_api.run("create_issue", json.dumps(payload, ensure_ascii=False))
        print(f"✅ Created issue: {s['summary']}")
        print(f"Response: {res}\n")
    except Exception as e:
        print(f"❌ Failed to create issue: {s['summary']}. Error: {e}")

print("==================================================")
print("Finished creating Jira User Stories.")
print("==================================================")
