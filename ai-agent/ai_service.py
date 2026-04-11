import logging
import json
import requests
from functools import lru_cache
from openai import OpenAI
import mysql.connector
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import config

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)
        self.qdrant = None
        try:
            self.qdrant = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT)
        except Exception as e:
            logger.error(f"Failed to initialize QdrantClient: {e}")

    @lru_cache(maxsize=128)
    def get_company_context(self, tenant_id):
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME,
                connect_timeout=5
            )
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT name, nit, address, phone FROM companies WHERE tenant_id = %s", (tenant_id,))
            company = cursor.fetchone()
            conn.close()
            
            if company:
                return f"Compañía: {company['name']}\nNIT: {company['nit']}\nDirección: {company['address']}\nTeléfono: {company['phone']}"
            return "Compañía: CloudFly SaaS"
        except Exception as e:
            logger.error(f"Error fetching company context: {e}")
            return "Compañía: CloudFly SaaS"

    def search_products(self, query: str, tenant_id: int):
        logger.info(f"Searching Qdrant for '{query}' (Tenant: {tenant_id})")
        if not self.qdrant:
            return json.dumps({"error": "Vector database unreachable"})
            
        try:
            vector_res = self.client.embeddings.create(
                input=query,
                model="text-embedding-3-small"
            )
            query_vector = vector_res.data[0].embedding
            
            search_result = self.qdrant.query_points(
                collection_name="products",
                query=query_vector,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="tenant_id",
                            match=MatchValue(value=tenant_id)
                        )
                    ]
                ),
                limit=5
            )

            
            results = []
            
            # Extract points whether it returns a list or a QueryResponse object
            points_list = search_result.points if hasattr(search_result, 'points') else search_result
            
            for hit in points_list:
                results.append(hit.payload)
                
            return json.dumps(results)

        except Exception as e:
            if "404" in str(e) or "doesn't exist" in str(e):
                logger.warning("Vector collection 'products' not found. Returning empty catalog.")
                return json.dumps([])
            logger.error(f"Vector search failed: {e}")
            return json.dumps({"error": str(e)})

    def check_products_stock(self, product_ids: list, tenant_id: int):
        logger.info(f"Checking stock for {product_ids} (Tenant: {tenant_id})")
        try:
            ids_str = ",".join(map(str, product_ids))
            url = f"{config.JAVA_API_URL}/productos/stock/multiple?ids={ids_str}&tenantId={tenant_id}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                # return just stock and status to reduce output
                slim_data = [{"id": p["id"], "stock": p["inventoryQty"], "manage_stock": p["manageStock"], "status": p["inventoryStatus"]} for p in data]
                return json.dumps(slim_data)
            return json.dumps({"error": f"API returned {res.status_code}"})
        except Exception as e:
            logger.error(f"Stock check failed: {e}")
            return json.dumps({"error": str(e)})

    def detect_intent(self, message):
        msg = message.lower()
        if any(greet in msg for greet in ["hola", "buen", "saludos", "hi", "hello"]):
            return "GREETING"
        if any(prod in msg for prod in ["precio", "comprar", "costo", "producto", "servicios"]):
            return "PRODUCT_INQUIRY"
        return "GENERAL"

    def generate_response(self, tenant_id, contact_id, conversation_id, message, history):
        company_info = self.get_company_context(tenant_id)

        system_prompt = f"""Ere un asistente de ventas profesional de la plataforma CloudFly.
Tu objetivo es ayudar al cliente con sus dudas y ventas de manera entusiasta e inmediata.

INFORMACIÓN DE LA EMPRESA ACTUAL:
{company_info}

REGLAS ESTRICTAS DE FORMATO SI HABLAS DE UN PRODUCTO:
¡CUANDO MENCIONES UN PRODUCTO QUE ENCONTRASTE, DEBES USAR OBLIGATORIAMENTE ESTE FORMATO TEXTUAL EXACTO POR CADA PRODUCTO!
Si el producto tiene imagen (image_url válida), escribe el primer renglón con la URL. Si no tiene o es nula, omite la primera línea.

[URL_DE_LA_IMAGEN]
*{'{'}Nombre del Producto{'}'}*
{'{'}Descripción breve{'}'}
Precio: ${'{'}Precio{'}'}
Estado: {'{'}Disponible (X unidades) / Agotado{'}'}

OTRAS REGLAS:
- Saluda de forma amigable.
- Si te piden Catálogo, usa la herramienta search_products_semantically con palabras clave amplias o las que mencione el cliente.
- Si presentas opciones y parecen interesantes, evalúa si necesitas llamar a check_products_stock antes de dar el "Estado".
- Mantén la respuesta conversacional.
"""

        messages = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_products_semantically",
                    "description": "Busca productos en el catálogo semánticamente basados en la solicitud del cliente.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "La consulta de búsqueda (ej. 'camisas de verano', 'televisores 4k', 'zapatos baratos')"
                            }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "check_products_stock",
                    "description": "Verifica el inventario real en la base de datos de uno o más productos a través de sus IDs.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "product_ids": {
                                "type": "array",
                                "items": {
                                    "type": "integer"
                                },
                                "description": "Lista de IDs de productos a consultar."
                            }
                        },
                        "required": ["product_ids"]
                    }
                }
            }
        ]

        try:
            response = self.client.chat.completions.create(
                model=config.OPENAI_MODEL,
                messages=messages,
                tools=tools,
                temperature=0.7,
                timeout=30
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls

            if tool_calls:
                messages.append(response_message) # Agregamos el llamado al historial temporal
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if function_name == "search_products_semantically":
                        function_response = self.search_products(function_args.get("query"), int(tenant_id))
                    elif function_name == "check_products_stock":
                        function_response = self.check_products_stock(function_args.get("product_ids"), int(tenant_id))
                    else:
                        function_response = json.dumps({"error": "Unknown function"})
                        
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    })

                # Segunda llamada con las respuestas de las funciones
                second_response = self.client.chat.completions.create(
                    model=config.OPENAI_MODEL,
                    messages=messages,
                    temperature=0.7,
                    timeout=30
                )
                return second_response.choices[0].message.content
                
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling OpenAI: {e}")
            return "Lo siento, estoy experimentando dificultades técnicas. ¿Podrías repetir tu consulta en un momento?"
