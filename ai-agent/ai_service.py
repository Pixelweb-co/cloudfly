import logging
import json
import requests
from functools import lru_cache
from openai import OpenAI
import mysql.connector
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import config
import matplotlib.pyplot as plt
import os
from datetime import datetime


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
            headers = {
                "X-AI-Secret": config.AI_API_SECRET,
                "Authorization": f"AI-Secret {config.AI_API_SECRET}"
            }
            res = requests.get(url, headers=headers, timeout=5)
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

    def get_contact(self, identifier: str, tenant_id: int):
        """Busca un contacto por email o teléfono."""
        logger.info(f"Searching contact '{identifier}' (Tenant: {tenant_id})")
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM contacts WHERE (email = %s OR phone = %s) AND tenant_id = %s"
            cursor.execute(query, (identifier, identifier, tenant_id))
            contact = cursor.fetchone()
            conn.close()
            
            if contact:
                # Convert datetimes to strings for JSON
                for key, val in contact.items():
                    if isinstance(val, (datetime,)):
                        contact[key] = val.isoformat()
                return json.dumps(contact)
            return json.dumps({"error": "Contact not found"})
        except Exception as e:
            logger.error(f"Error fetching contact: {e}")
            return json.dumps({"error": str(e)})

    def manage_contact(self, action: str, tenant_id: int, name: str = None, email: str = None, phone: str = None, contact_id: int = None, address: str = None, tax_id: str = None, document_type: str = None, document_number: str = None):
        """Crea o actualiza un contacto."""
        logger.info(f"Manage contact: {action} (Tenant: {tenant_id})")
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor()
            
            if action == "create":
                fields = ["name", "email", "phone", "tenant_id", "created_at", "updated_at", "is_active"]
                values = [name, email, phone, tenant_id, datetime.now(), datetime.now(), 1]
                
                if address: fields.append("address"); values.append(address)
                if tax_id: fields.append("tax_id"); values.append(tax_id)
                if document_type: fields.append("document_type"); values.append(document_type)
                if document_number: fields.append("document_number"); values.append(document_number)
                
                placeholders = ", ".join(["%s"] * len(values))
                query = f"INSERT INTO contacts ({', '.join(fields)}) VALUES ({placeholders})"
                cursor.execute(query, tuple(values))
                conn.commit()
                new_id = cursor.lastrowid
                conn.close()
                return json.dumps({"success": True, "id": new_id, "message": "Contacto creado exitosamente"})
            
            elif action == "update":
                if not contact_id:
                    return json.dumps({"error": "contact_id is required for update"})
                
                updates = []
                params = []
                if name: updates.append("name = %s"); params.append(name)
                if email: updates.append("email = %s"); params.append(email)
                if phone: updates.append("phone = %s"); params.append(phone)
                if address: updates.append("address = %s"); params.append(address)
                if tax_id: updates.append("tax_id = %s"); params.append(tax_id)
                if document_type: updates.append("document_type = %s"); params.append(document_type)
                if document_number: updates.append("document_number = %s"); params.append(document_number)
                
                if not updates:
                    return json.dumps({"error": "No fields to update"})
                
                query = f"UPDATE contacts SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s AND tenant_id = %s"
                params.extend([contact_id, tenant_id])
                cursor.execute(query, params)
                conn.commit()
                conn.close()
                return json.dumps({"success": True, "message": "Contacto actualizado exitosamente"})
                
            return json.dumps({"error": "Invalid action"})
        except Exception as e:
            logger.error(f"Error managing contact: {e}")
            return json.dumps({"error": str(e)})

    def create_order(self, customer_id: int, items: list, tenant_id: int, notes: str = None):
        """Crea un pedido en el sistema."""
        logger.info(f"Creating order for customer {customer_id} (Tenant: {tenant_id})")
        try:
            # Re-fetch product names and prices if not provided correctly by AI for safety
            # But we trust the AI if it provides them.
            # Convert items to the expected DTO format
            order_items = []
            for item in items:
                order_items.append({
                    "productId": item.get("productId"),
                    "productName": item.get("productName"),
                    "quantity": item.get("quantity"),
                    "unitPrice": item.get("unitPrice"),
                    "discount": item.get("discount", 0),
                    "subtotal": item.get("quantity", 0) * item.get("unitPrice", 0)
                })

            payload = {
                "customerId": customer_id,
                "status": "PROCESANDO",
                "notes": notes,
                "items": order_items,
                "total": sum(item["subtotal"] for item in order_items)
            }

            url = f"{config.JAVA_API_URL}/orders?tenantId={tenant_id}"
            headers = {
                "X-AI-Secret": config.AI_API_SECRET,
                "Authorization": f"AI-Secret {config.AI_API_SECRET}"
            }
            logger.info(f"🚀 [AI-API-TOOL] Calling POST {url}")
            logger.info(f"🚀 [AI-API-TOOL] Payload: {json.dumps(payload)}")
            
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            
            logger.info(f"📥 [AI-API-TOOL] Response Status: {res.status_code}")
            logger.info(f"📥 [AI-API-TOOL] Response Body: {res.text}")
            if res.status_code in [200, 201]:
                return json.dumps(res.json())
            return json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            return json.dumps({"error": str(e)})

    def create_quote(self, customer_id: int, items: list, tenant_id: int, notes: str = None):
        """Crea una cotización en el sistema."""
        logger.info(f"Creating quote for customer {customer_id} (Tenant: {tenant_id})")
        try:
            quote_items = []
            for item in items:
                quote_items.append({
                    "productId": item.get("productId"),
                    "productName": item.get("productName"),
                    "quantity": item.get("quantity"),
                    "unitPrice": item.get("unitPrice"),
                    "discount": item.get("discount", 0),
                    "subtotal": item.get("quantity", 0) * item.get("unitPrice", 0)
                })

            payload = {
                "customerId": customer_id,
                "status": "PENDING",
                "notes": notes,
                "items": quote_items,
                "total": sum(item["subtotal"] for item in quote_items)
            }

            url = f"{config.JAVA_API_URL}/quotes?tenantId={tenant_id}"
            headers = {
                "X-AI-Secret": config.AI_API_SECRET,
                "Authorization": f"AI-Secret {config.AI_API_SECRET}"
            }
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                return json.dumps(res.json())
            return json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
        except Exception as e:
            logger.error(f"Error creating quote: {e}")
            return json.dumps({"error": str(e)})

    def convert_quote_to_order(self, quote_id: int, tenant_id: int):
        """Convierte una cotización en un pedido oficial."""
        logger.info(f"Converting quote {quote_id} to order (Tenant: {tenant_id})")
        try:
            url = f"{config.JAVA_API_URL}/quotes/{quote_id}/convert-to-order?tenantId={tenant_id}"
            headers = {
                "X-AI-Secret": config.AI_API_SECRET,
                "Authorization": f"AI-Secret {config.AI_API_SECRET}"
            }
            res = requests.post(url, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                return json.dumps(res.json())
            return json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
        except Exception as e:
            logger.error(f"Error converting quote to order: {e}")
            return json.dumps({"error": str(e)})

    def get_order(self, order_id: int, tenant_id: int):
        """Obtiene el detalle de un pedido."""
        logger.info(f"Fetching order {order_id} (Tenant: {tenant_id})")
        try:
            url = f"{config.JAVA_API_URL}/orders/{order_id}?tenantId={tenant_id}"
            headers = {
                "X-AI-Secret": config.AI_API_SECRET,
                "Authorization": f"AI-Secret {config.AI_API_SECRET}"
            }
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                return json.dumps(res.json())
            return json.dumps({"error": f"API returned {res.status_code}"})
        except Exception as e:
            logger.error(f"Error fetching order: {e}")
            return json.dumps({"error": str(e)})

    def modify_order(self, order_id: int, items: list, tenant_id: int, notes: str = None):
        """Modifica un pedido existente."""
        logger.info(f"Modifying order {order_id} (Tenant: {tenant_id})")
        try:
            order_items = []
            for item in items:
                order_items.append({
                    "productId": item.get("productId"),
                    "productName": item.get("productName"),
                    "quantity": item.get("quantity"),
                    "unitPrice": item.get("unitPrice"),
                    "discount": item.get("discount", 0),
                    "subtotal": item.get("quantity", 0) * item.get("unitPrice", 0)
                })

            payload = {
                "notes": notes,
                "items": order_items
            }

            url = f"{config.JAVA_API_URL}/orders/{order_id}?tenantId={tenant_id}"
            headers = {
                "X-AI-Secret": config.AI_API_SECRET,
                "Authorization": f"AI-Secret {config.AI_API_SECRET}"
            }
            res = requests.put(url, json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                return json.dumps(res.json())
            return json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
        except Exception as e:
            logger.error(f"Error modifying order: {e}")
            return json.dumps({"error": str(e)})

    def update_pipeline_stage(self, contact_id: int, stage_id: int, tenant_id: int):
        """Actualiza la etapa del pipeline para un contacto."""
        logger.info(f"Updating stage to {stage_id} for contact {contact_id} (Tenant: {tenant_id})")
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor()
            
            # Step 1: Update contact table (quick view)
            query = "UPDATE contacts SET stage_id = %s, updated_at = NOW() WHERE id = %s AND tenant_id = %s"
            cursor.execute(query, (stage_id, contact_id, tenant_id))
            
            # Step 2: Update conversation_pipeline_state for historical tracking/dashboard
            # We first check if it exists
            cursor.execute("SELECT id FROM conversation_pipeline_state WHERE contact_id = %s AND tenant_id = %s", (contact_id, tenant_id))
            state = cursor.fetchone()
            
            if state:
                cursor.execute("UPDATE conversation_pipeline_state SET current_stage_id = %s, updated_at = NOW(), entered_stage_at = NOW() WHERE contact_id = %s AND tenant_id = %s", 
                               (stage_id, contact_id, tenant_id))
            else:
                # If not exists, we might need to find which pipeline this stage belongs to
                cursor.execute("SELECT pipeline_id FROM pipeline_stages WHERE id = %s", (stage_id,))
                ps = cursor.fetchone()
                pipeline_id = ps[0] if ps else None
                
                cursor.execute("INSERT INTO conversation_pipeline_state (tenant_id, contact_id, pipeline_id, current_stage_id, entered_stage_at, is_active, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), 1, NOW(), NOW())",
                               (tenant_id, contact_id, pipeline_id, stage_id))
            
            conn.commit()
            conn.close()
            return json.dumps({"success": True, "message": f"Etapa actualizada a {stage_id} correctamente"})
        except Exception as e:
            logger.error(f"Error updating pipeline stage: {e}")
            return json.dumps({"error": str(e)})

    def get_contact_pipeline(self, contact_id: int, tenant_id: int):
        """Lee el pipeline asociado al contacto y todas sus etapas disponibles."""
        logger.info(f"Getting pipeline stages for contact {contact_id} (Tenant: {tenant_id})")
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST, user=config.DB_USER,
                password=config.DB_PASSWORD, database=config.DB_NAME
            )
            cursor = conn.cursor(dictionary=True)

            # Leer pipeline_id y stage_id actuales del contacto
            cursor.execute(
                "SELECT pipeline_id, stage_id FROM contacts WHERE id = %s AND tenant_id = %s",
                (contact_id, tenant_id)
            )
            contact = cursor.fetchone()

            if not contact or not contact.get('pipeline_id'):
                conn.close()
                return json.dumps({"error": "El contacto no tiene pipeline asignado"})

            pipeline_id = contact['pipeline_id']
            current_stage_id = contact['stage_id']

            # Leer nombre del pipeline
            cursor.execute("SELECT id, name FROM pipelines WHERE id = %s", (pipeline_id,))
            pipeline = cursor.fetchone()

            # Leer todas las etapas del pipeline
            cursor.execute(
                "SELECT id, name, position, color FROM pipeline_stages WHERE pipeline_id = %s ORDER BY position ASC",
                (pipeline_id,)
            )
            stages = cursor.fetchall()
            conn.close()

            return json.dumps({
                "pipeline_id": pipeline_id,
                "pipeline_name": pipeline['name'] if pipeline else None,
                "current_stage_id": current_stage_id,
                "stages": stages
            })
        except Exception as e:
            logger.error(f"Error getting contact pipeline: {e}")
            return json.dumps({"error": str(e)})

    def generate_pipeline_chart(self, tenant_id: int):
        """Genera un gráfico horizontal de contactos por etapa."""
        logger.info(f"Generating pipeline chart (Tenant: {tenant_id})")
        plt.switch_backend('Agg') # Headless mode
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor(dictionary=True)
            
            # Query stage names, colors and contact counts
            query = """
                SELECT ps.name, ps.color, COUNT(c.id) as count 
                FROM pipeline_stages ps
                LEFT JOIN contacts c ON c.stage_id = ps.id AND c.tenant_id = %s
                WHERE ps.pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = %s)
                GROUP BY ps.id, ps.name, ps.color, ps.position
                ORDER BY ps.position ASC
            """
            cursor.execute(query, (tenant_id, tenant_id))
            data = cursor.fetchall()
            conn.close()
            
            if not data:
                return json.dumps({"error": "No hay datos de pipeline para este tenant"})
            
            stages = [d['name'] for d in data]
            counts = [d['count'] for d in data]
            colors = [d['color'] if d['color'] else '#8884d8' for d in data]
            
            fig, ax = plt.subplots(figsize=(10, 6))
            bars = ax.barh(stages, counts, color=colors)
            
            ax.set_xlabel('Número de Contactos')
            ax.set_title('Contactos por Etapa del Pipeline')
            ax.invert_yaxis() # Highest position at top
            
            # Add labels to the ends of the bars
            for bar in bars:
                width = bar.get_width()
                ax.text(width + 0.1, bar.get_y() + bar.get_height()/2, f'{int(width)}', ha='left', va='center')
            
            # Save to shared volume
            os.makedirs("/app/uploads/charts", exist_ok=True)
            filename = f"pipeline_stats_{tenant_id}_{int(datetime.now().timestamp())}.png"
            filepath = f"/app/uploads/charts/{filename}"
            plt.tight_layout()
            plt.savefig(filepath)
            plt.close()
            
            public_url = f"https://api.cloudfly.com.co/uploads/charts/{filename}"
            return json.dumps({"success": True, "chart_url": public_url, "message": "Gráfico generado exitosamente"})
            
        except Exception as e:
            logger.error(f"Error generating chart: {e}")
            return json.dumps({"error": str(e)})

    async def generate_response(self, tenant_id, contact_id, conversation_id, message, history, pipeline_state=None, message_id=None):
        company_info = self.get_company_context(tenant_id)

        # Fetch pipeline state for this contact
        pipeline_info_json = self.get_contact_pipeline(contact_id, tenant_id)
        pipeline_data = json.loads(pipeline_info_json)
        
        pipeline_context = ""
        if "error" not in pipeline_data:
            stages_list = "\n".join([f"- {s['name']} (ID: {s['id']})" for s in pipeline_data['stages']])
            current_stage_name = "Desconocido"
            for s in pipeline_data['stages']:
                if s['id'] == pipeline_data['current_stage_id']:
                    current_stage_name = s['name']
                    break
            
            pipeline_context = f"""
[ESTADO INTERNO DEL PIPELINE - SOLO PARA TU USO]
Nombre del Pipeline: {pipeline_data.get('pipeline_name', 'N/A')}
Etapa Actual: {current_stage_name} (ID: {pipeline_data['current_stage_id']})

Etapas disponibles en este pipeline (Usa estos IDs con update_pipeline_stage):
{stages_list}
"""

        system_prompt = f"""Eres un asistente de ventas profesional de la plataforma CloudFly.
Tu objetivo es ayudar al cliente con sus dudas y ventas de manera entusiasta e inmediata.

INFORMACIÓN DE LA EMPRESA ACTUAL:
{company_info}
{pipeline_context}

REGLAS ESTRICTAS DE FORMATO SI HABLAS DE UN PRODUCTO:
¡CUANDO MENCIONES UN PRODUCTO QUE ENCONTRASTE, DEBES USAR OBLIGATORIAMENTE ESTE FORMATO TEXTUAL EXACTO POR CADA PRODUCTO!
Si el producto tiene imagen (image_url válida), escribe el primer renglón con la URL. Si no tiene o es nula, omite la primera línea.

[URL_DE_LA_IMAGEN]
*{'{'}Nombre del Producto{'}'}*
{'{'}Descripción breve{'}'}
Precio: ${'{'}Precio{'}'}
Estado: {'{'}Disponible (X unidades) / Agotado{'}'}

GESTIÓN AUTÓNOMA DEL PIPELINE (PROCESO INTERNO - NUNCA MENCIONAR AL USUARIO):
- Las herramientas de pipeline son operaciones internas silenciosas. El usuario NUNCA debe saber que existen.
- Ya tienes arriba el [ESTADO INTERNO DEL PIPELINE]. Úsalo para decidir si cambiar la etapa.
- Evalúa el contexto de la conversación y decide AUTÓNOMAMENTE si cambiar la etapa usando update_pipeline_stage con el ID correcto.
- Si detectas que el usuario avanza en su interés, muévelo a la siguiente etapa lógica.
- Usa update_pipeline_stage SOLO cuando el cambio sea relevante y esté justificado.
- FLUJO DE CIERRE DE PEDIDO (IMPORTANTE):
  1. Identifica los productos que el cliente quiere.
  2. Confirma si sus datos de contacto (Nombre, Email, NIT, Dirección, etc.) están actualizados usando get_contact. Si falta información o es incorrecta, usa manage_contact(action='update').
  3. Si el cliente solo está pidiendo un presupuesto o precio total, usa create_quote.
  4. Si el cliente confirma la compra o acepta una cotización previa, usa create_order (para pedido directo) o convert_quote_to_order (si ya existe una cotización).
  5. Una vez creado el pedido, usa update_pipeline_stage para mover al contacto a la etapa de "Facturado" o "Cierre de Venta" (usa get_contact_pipeline para saber el ID correcto de la etapa).
  6. Informa amigablemente al cliente que su pedido o cotización ha sido procesado.

- FLUJO DE RECTIFICACIÓN:
  1. Si un cliente quiere corregir algo en su pedido actual o previo, usa get_order para ver los detalles.
  2. Ajusta los productos/cantidades mediante modify_order.

PROHIBICIONES ABSOLUTAS - NUNCA HAGAS ESTO:
- JAMÁS menciones pipelines, etapas, stages, IDs, bases de datos o procesos técnicos al usuario.
- JAMÁS digas frases como "te moví de etapa", "ya estás en el pipeline", etc.
- JAMÁS menciones errores internos o fallos de herramientas.
- JAMÁS pidas al usuario que visite páginas de registro externas a menos que sea parte del producto.

OTRAS REGLAS:
- Saluda de forma amigable y mantén la respuesta natural.
- Si te piden Catálogo, usa search_products_semantically.
- Responde siempre en el idioma que use el cliente.
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
                    "description": "Busca productos en el catálogo usando lenguaje natural. Úsalo cuando el cliente pregunte por precios, catálogo o disponibilidad de productos.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Término de búsqueda o descripción del producto."
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
                    "description": "Consulta el inventario real y estado de uno o varios productos por su ID numérico.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "product_ids": {
                                "type": "array",
                                "items": { "type": "integer" },
                                "description": "Lista de IDs de productos a consultar."
                            }
                        },
                        "required": ["product_ids"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_contact",
                    "description": "Busca un contacto existente por su teléfono o correo electrónico.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "identifier": {
                                "type": "string",
                                "description": "Teléfono o email del contacto."
                            }
                        },
                        "required": ["identifier"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "manage_contact",
                    "description": "Crea o actualiza la información básica de un contacto.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": { "type": "string", "enum": ["create", "update"] },
                            "name": { "type": "string" },
                            "email": { "type": "string" },
                            "phone": { "type": "string" },
                            "address": { "type": "string" },
                            "tax_id": { "type": "string", "description": "NIT o Identificación Tributaria" },
                            "document_type": { "type": "string", "enum": ["CC", "NIT", "TI", "PASAPORTE"] },
                            "document_number": { "type": "string" },
                            "contact_id": { "type": "integer", "description": "ID del contacto (requerido para update)" }
                        },
                        "required": ["action"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_pipeline_stage",
                    "description": "Actualiza la etapa de venta de un contacto dado su ID y el ID de la etapa.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "contact_id": { "type": "integer" },
                            "stage_id": { "type": "integer" }
                        },
                        "required": ["contact_id", "stage_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_pipeline_chart",
                    "description": "Genera una visualización de los contactos por etapa para la empresa actual.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_contact_pipeline",
                    "description": "Lee el pipeline asignado al contacto y devuelve todas las etapas disponibles con sus IDs y nombres. Llama a esta herramienta ANTES de update_pipeline_stage para conocer los IDs correctos.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "contact_id": {
                                "type": "integer",
                                "description": "ID del contacto actual."
                            }
                        },
                        "required": ["contact_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_order",
                    "description": "Crea un pedido oficial de productos para un cliente. Llama a esta función cuando el cliente confirme explícitamente que desea comprar.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "customer_id": { "type": "integer" },
                            "notes": { "type": "string" },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "productId": { "type": "integer" },
                                        "productName": { "type": "string" },
                                        "quantity": { "type": "integer" },
                                        "unitPrice": { "type": "number" }
                                    },
                                    "required": ["productId", "productName", "quantity", "unitPrice"]
                                }
                            }
                        },
                        "required": ["customer_id", "items"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_quote",
                    "description": "Crea una cotización (proforma) de productos para un cliente. Úsalo cuando el cliente pregunte por precios o solicite un presupuesto sin confirmar la compra final.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "customer_id": { "type": "integer" },
                            "notes": { "type": "string" },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "productId": { "type": "integer" },
                                        "productName": { "type": "string" },
                                        "quantity": { "type": "integer" },
                                        "unitPrice": { "type": "number" }
                                    },
                                    "required": ["productId", "productName", "quantity", "unitPrice"]
                                }
                            }
                        },
                        "required": ["customer_id", "items"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "convert_quote_to_order",
                    "description": "Convierte una cotización existente en un pedido oficial. Llama a esta función cuando el cliente acepte una cotización previa.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "quote_id": { "type": "integer" }
                        },
                        "required": ["quote_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_order",
                    "description": "Obtiene el detalle de un pedido existente por su ID. Úsalo para rectificar o confirmar datos de un pedido previo.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": { "type": "integer" }
                        },
                        "required": ["order_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "modify_order",
                    "description": "Modifica un pedido existente (rectificación).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": { "type": "integer" },
                            "notes": { "type": "string" },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "productId": { "type": "integer" },
                                        "productName": { "type": "string" },
                                        "quantity": { "type": "integer" },
                                        "unitPrice": { "type": "number" }
                                    },
                                    "required": ["productId", "productName", "quantity", "unitPrice"]
                                }
                            }
                        },
                        "required": ["order_id", "items"]
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
                    elif function_name == "get_contact":
                        function_response = self.get_contact(function_args.get("identifier"), int(tenant_id))
                    elif function_name == "manage_contact":
                        function_response = self.manage_contact(
                            function_args.get("action"), 
                            int(tenant_id), 
                            name=function_args.get("name"),
                            email=function_args.get("email"),
                            phone=function_args.get("phone"),
                            contact_id=function_args.get("contact_id"),
                            address=function_args.get("address"),
                            tax_id=function_args.get("tax_id"),
                            document_type=function_args.get("document_type"),
                            document_number=function_args.get("document_number")
                        )
                    elif function_name == "update_pipeline_stage":
                        function_response = self.update_pipeline_stage(
                            function_args.get("contact_id"),
                            function_args.get("stage_id"),
                            int(tenant_id)
                        )
                    elif function_name == "generate_pipeline_chart":
                        function_response = self.generate_pipeline_chart(int(tenant_id))
                    elif function_name == "get_contact_pipeline":
                        function_response = self.get_contact_pipeline(
                            function_args.get("contact_id"),
                            int(tenant_id)
                        )
                    elif function_name == "create_order":
                        function_response = self.create_order(
                            function_args.get("customer_id"),
                            function_args.get("items"),
                            int(tenant_id),
                            notes=function_args.get("notes")
                        )
                    elif function_name == "create_quote":
                        function_response = self.create_quote(
                            function_args.get("customer_id"),
                            function_args.get("items"),
                            int(tenant_id),
                            notes=function_args.get("notes")
                        )
                    elif function_name == "convert_quote_to_order":
                        function_response = self.convert_quote_to_order(
                            function_args.get("quote_id"),
                            int(tenant_id)
                        )
                    elif function_name == "get_order":
                        function_response = self.get_order(
                            function_args.get("order_id"),
                            int(tenant_id)
                        )
                    elif function_name == "modify_order":
                        function_response = self.modify_order(
                            function_args.get("order_id"),
                            function_args.get("items"),
                            int(tenant_id),
                            notes=function_args.get("notes")
                        )
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
