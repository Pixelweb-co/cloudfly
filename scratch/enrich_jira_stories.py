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

enrichments = {
    "CLOUD-135": (
        "# 📋 STORY: Integrar marketing-agent con servicio lead-generator para prospección fría\n\n"
        "### 🎯 OBJETIVO:\n"
        "Buscar prospectos fríos utilizando la información del perfil del negocio y el catálogo de productos a través del servicio lead-generator en el puerto 8001, almacenarlos de forma estructurada en las listas del CRM.\n\n"
        "### 🛠️ ¿CÓMO SE DEBE HACER? (PLAN DE IMPLEMENTACIÓN):\n"
        "1. **Crear Servicio de Prospección**:\n"
        "   - Archivo nuevo: `marketing_agent/services/prospector_service.py`.\n"
        "   - Clase: `ProspectorService`.\n"
        "2. **Obtener Contexto del Negocio**:\n"
        "   - Conectarse a MySQL para leer los datos de la compañía activa (`activeCompanyId`) y sus productos del catálogo (`product_service.py` o consultas directas).\n"
        "3. **Extraer Keywords mediante IA**:\n"
        "   - Llamar a OpenRouter para procesar el catálogo de productos y generar las mejores palabras clave comerciales para prospección B2B (ej: 'salones de belleza', 'restaurantes gourmet').\n"
        "4. **Consumir `lead-generator`**:\n"
        "   - Realizar una petición POST HTTP con `httpx` o `requests` a: `http://lead-generator:8000/leads/generate` enviando las palabras clave de prospección.\n"
        "5. **Insertar en CRM**:\n"
        "   - Iterar sobre la lista de leads devuelta e insertarlos en la tabla `contacts` de MySQL usando el `ContactService` existente en el backend o scripts directos SQL asegurando el tenant id y company id correspondientes."
    ),
    "CLOUD-136": (
        "# 📋 STORY: Iniciar envío por WhatsApp y almacenar contexto de campaña en Redis\n\n"
        "### 🎯 OBJETIVO:\n"
        "Almacenar el contexto activo de la prospección en Redis al momento de enviar el mensaje masivo inicial de WhatsApp, permitiendo la trazabilidad conversacional.\n\n"
        "### 🛠️ ¿CÓMO SE DEBE HACER? (PLAN DE IMPLEMENTACIÓN):\n"
        "1. **Actualizar el Despacho de Campañas**:\n"
        "   - Archivo: `marketing_agent/services/campaign_service.py`.\n"
        "   - Lógica: En el bucle de envío masivo de mensajes de la campaña, justo antes de enviar la plantilla inicial de WhatsApp vía Evolution API, guardar el estado en Redis.\n"
        "2. **Diseño de Datos en Redis**:\n"
        "   - Clave: `campaign_context:contact:<id_contacto>` (tipo Hash).\n"
        "   - Datos a guardar:\n"
        "     * `campaign_id`: ID de la campaña actual.\n"
        "     * `product_id`: ID del producto que se está promocionando.\n"
        "     * `product_name`: Nombre legible del producto.\n"
        "     * `company_id`: ID de la compañía.\n"
        "     * `company_name`: Nombre de la compañía.\n"
        "     * `pitch_message`: El texto inicial que se le envió al cliente.\n"
        "3. **Expiración de Claves (TTL)**:\n"
        "   - Configurar un tiempo de vida (TTL) de 7 días (604800 segundos) para cada clave en Redis mediante `redis_client.expire(key, 604800)`."
    ),
    "CLOUD-137": (
        "# 📋 STORY: Sincronizar ai-agent con contexto de Redis para seguimiento conversacional y lead scoring\n\n"
        "### 🎯 OBJETIVO:\n"
        "Garantizar que al responder un prospecto frío, el chatbot conversacional (`ai-agent`) entienda perfectamente de qué producto y campaña proviene, y califique dinámicamente el lead según su intención de compra.\n\n"
        "### 🛠️ ¿CÓMO SE DEBE HACER? (PLAN DE IMPLEMENTACIÓN):\n"
        "1. **Recuperar Contexto de Campaña**:\n"
        "   - Archivo: `ai-agent/redis_client.py`.\n"
        "   - Crear método `get_campaign_context(contact_id: str)` que haga `hgetall(f'campaign_context:contact:{contact_id}')`.\n"
        "2. **Inyección en System Prompt**:\n"
        "   - Archivo: `ai-agent/ai_service.py`.\n"
        "   - Lógica: Antes de invocar a OpenRouter en la conversación, llamar al Redis Client. Si hay un contexto de campaña activo, inyectar el bloque de instrucciones en el System Prompt:\n"
        "     * *'Estás en una fase de seguimiento comercial frío. El contacto fue abordado para la campaña X ofreciéndole el producto Y de la empresa Z. Continúa la negociación enfocándote en cerrar la venta de Y.'*\n"
        "3. **Lógica de Calificación Dinámica (Lead Scoring)**:\n"
        "   - Archivo: `ai-agent/tool_registry.py`.\n"
        "   - Crear una nueva herramienta (Tool Call) expuesta al LLM: `qualify_lead(contact_id: str, score: str)`.\n"
        "   - Lógica de la herramienta: Ejecutar una consulta SQL `UPDATE contacts SET score = %s WHERE id = %s` en la base de datos MySQL.\n"
        "   - En el prompt de sistema, instruir a la IA para que evalúe las respuestas del usuario y llame a la herramienta para cambiar su score a `HOT` o `WARM` si muestra alta intención de compra o pide precios/demos."
    ),
    "CLOUD-138": (
        "# 📋 STORY: Actualizar marketing-agent con modelos de OpenRouter y pool de llaves resiliente\n\n"
        "### 🎯 OBJETIVO:\n"
        "Asegurar que el marketing-agent pueda procesar de forma ininterrumpida las peticiones de IA mediante la rotación de API Keys de OpenRouter y lógica de tolerancia ante errores 429 (Rate Limits).\n\n"
        "### 🛠️ ¿CÓMO SE DEBE HACER? (PLAN DE IMPLEMENTACIÓN):\n"
        "1. **Cargar Pool de Keys**:\n"
        "   - Archivo: `marketing_agent/config.py`.\n"
        "   - Cargar `OPENROUTER_KEYS_POOL` desde el archivo de entorno `.env.vps`.\n"
        "2. **Rotación Dinámica en LLM**:\n"
        "   - Archivo: `marketing_agent/services/ai_ad_service.py`.\n"
        "   - Lógica: Envolver la llamada al LLM en una rutina de reintento de hasta 6 iteraciones. Si la llamada retorna un error de Rate Limit (`RateLimitError` o código de estado HTTP `429`), capturar el error, cambiar la API Key activa por la siguiente del pool, registrar la rotación en consola y reintentar de inmediato."
    )
}

print("Enriching Jira Stories with complete technical blueprints...")
for key, desc in enrichments.items():
    try:
        jira_api.jira.update_issue_field(key, {"description": desc})
        print(f"✅ Successfully enriched: {key}")
    except Exception as e:
        print(f"❌ Failed to enrich {key}. Error: {e}")

print("==================================================")
print("Finished enriching Jira Stories.")
print("==================================================")
