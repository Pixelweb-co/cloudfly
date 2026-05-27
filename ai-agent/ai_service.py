import asyncio
import logging
import json
import hashlib
import requests
from functools import lru_cache
from openai import OpenAI
import mysql.connector
import mysql.connector.pooling
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import config
import matplotlib.pyplot as plt
from datetime import datetime
from types import SimpleNamespace
from token_tracker import TokenTracker

# Constantes de configuración
API_TIMEOUT = getattr(config, 'API_TIMEOUT', 10)
CHARTS_LOCAL_PATH = getattr(config, 'CHARTS_LOCAL_PATH', "/app/uploads/charts")
CHARTS_PUBLIC_URL = getattr(config, 'CHARTS_PUBLIC_URL', "https://api.cloudfly.com.co/uploads/charts/")
ALLOWED_CONTACT_FIELDS = {"name", "email", "phone", "address", "tax_id", "document_type", "document_number"}
MAX_HISTORY = 6
PROMPT_TOKEN_PRICE = getattr(config, 'PROMPT_TOKEN_PRICE', 0.0000025)
COMPLETION_TOKEN_PRICE = getattr(config, 'COMPLETION_TOKEN_PRICE', 0.00001)

logger = logging.getLogger(__name__)

@lru_cache(maxsize=128)
def _fetch_company_context(tenant_id: int):
    """Obtiene el contexto de la compañía desde la base de datos con cache LRU."""
    try:
        conn = mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME,
            connect_timeout=API_TIMEOUT
        )
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, nit, address, phone FROM companies WHERE tenant_id = %s", (tenant_id,))
        company = cursor.fetchone()
        conn.close()
        
        if company:
            return f"Compañía: {company['name']}\nNIT: {company['nit']}\nDirección: {company['address']}\nTeléfono: {company['phone']}"
        return "Compañía: CloudFly SaaS"
    except Exception as e:
        logger.error(f"Error fetching company context for tenant {tenant_id}: {e}")
        return "Compañía: CloudFly SaaS"


class AIService:
    def __init__(self, redis_client=None):
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)
        self.qdrant = None
        self.redis_client = redis_client
        try:
            self.qdrant = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT)
            # Inicializar pool de conexiones MySQL
            self.pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="ai_pool",
                pool_size=5,
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            # Inicializar tracker de tokens
            self.tracker = TokenTracker()
        except Exception as e:
            logger.error(f"Failed to initialize AIService components: {e}")

    def get_company_context(self, tenant_id: int):
        """Llama a la función de módulo con cache."""
        return _fetch_company_context(tenant_id)

    async def search_products(self, query: str, tenant_id: int):
        logger.info(f"Searching Qdrant for '{query}' (Tenant: {tenant_id})")
        if not self.qdrant:
            return json.dumps({"error": "Vector database unreachable"})
            
        try:
            # Envolver llamadas síncronas en to_thread
            vector_res = await asyncio.to_thread(
                self.client.embeddings.create,
                input=query,
                model="text-embedding-3-small"
            )
            query_vector = vector_res.data[0].embedding
            
            search_result = await asyncio.to_thread(
                self.qdrant.query_points,
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
            points_list = search_result.points if hasattr(search_result, 'points') else search_result
            
            for hit in points_list:
                p = hit.payload
                slim = {
                    "id":          p.get("id"),
                    "name":        p.get("name"),
                    "price":       p.get("price"),
                    "stock":       p.get("stock"),
                    "image_url":   p.get("image_url"),
                    "description": str(p.get("description", ""))[:120]
                }
                results.append(slim)
                
            return json.dumps(results)

        except Exception as e:
            if "404" in str(e) or "doesn't exist" in str(e):
                logger.warning("Vector collection 'products' not found. Returning empty catalog.")
                return json.dumps([])
            logger.error(f"Vector search failed: {e}")
            return json.dumps({"error": str(e)})

    async def check_products_stock(self, product_ids: list, tenant_id: int):
        logger.info(f"Checking stock for {product_ids} (Tenant: {tenant_id})")
        try:
            def _fetch():
                ids_str = ",".join(map(str, product_ids))
                url = f"{config.JAVA_API_URL}/productos/stock/multiple?ids={ids_str}&tenantId={tenant_id}"
                headers = {
                    "X-AI-Secret": config.AI_API_SECRET,
                    "Authorization": f"AI-Secret {config.AI_API_SECRET}"
                }
                res = requests.get(url, headers=headers, timeout=API_TIMEOUT)
                if res.status_code == 200:
                    data = res.json()
                    slim_data = [{"id": p["id"], "stock": p["inventoryQty"], "manage_stock": p["manageStock"], "status": p["inventoryStatus"]} for p in data]
                    return json.dumps(slim_data)
                return json.dumps({"error": f"API returned {res.status_code}"})
            
            return await asyncio.to_thread(_fetch)
        except Exception as e:
            logger.error(f"Stock check failed: {e}")
            return json.dumps({"error": str(e)})



    async def get_contact(self, identifier: str, tenant_id: int):
        """Busca un contacto por email o teléfono."""
        logger.info(f"Searching contact '{identifier}' (Tenant: {tenant_id})")
        try:
            def _query():
                conn = self.pool.get_connection()
                cursor = conn.cursor(dictionary=True)
                query = "SELECT * FROM contacts WHERE (email = %s OR phone = %s) AND tenant_id = %s"
                cursor.execute(query, (identifier, identifier, tenant_id))
                contact = cursor.fetchone()
                conn.close()
                
                if contact:
                    CONTACT_LLM_FIELDS = {"id", "name", "email", "phone", "address",
                                         "tax_id", "document_type", "document_number", "stage_id"}
                    contact = {k: v for k, v in contact.items() if k in CONTACT_LLM_FIELDS}
                    
                    for key, val in contact.items():
                        if isinstance(val, (datetime,)):
                            contact[key] = val.isoformat()
                    return json.dumps(contact)
                return json.dumps({"error": "Contact not found"})
            
            return await asyncio.to_thread(_query)
        except Exception as e:
            logger.error(f"Error fetching contact: {e}")
            return json.dumps({"error": str(e)})

    async def manage_contact(self, action: str, tenant_id: int, **kwargs):
        """Crea o actualiza un contacto con validación de campos."""
        logger.info(f"Manage contact: {action} (Tenant: {tenant_id})")
        try:
            def _db_op():
                conn = self.pool.get_connection()
                cursor = conn.cursor()
                
                if action == "create":
                    fields = ["name", "email", "phone", "tenant_id", "created_at", "updated_at", "is_active"]
                    values = [kwargs.get("name"), kwargs.get("email"), kwargs.get("phone"), tenant_id, datetime.now(), datetime.now(), 1]
                    
                    # Dinámicamente añadir campos permitidos
                    for field in ["address", "tax_id", "document_type", "document_number"]:
                        if kwargs.get(field):
                            fields.append(field)
                            values.append(kwargs.get(field))
                    
                    placeholders = ", ".join(["%s"] * len(values))
                    query = f"INSERT INTO contacts ({', '.join(fields)}) VALUES ({placeholders})"
                    cursor.execute(query, tuple(values))
                    conn.commit()
                    new_id = cursor.lastrowid
                    conn.close()
                    return json.dumps({"success": True, "id": new_id, "message": "Contacto creado exitosamente"})
                
                elif action == "update":
                    contact_id = kwargs.get("contact_id")
                    if not contact_id:
                        return json.dumps({"error": "contact_id is required for update"})
                    
                    updates = []
                    params = []
                    
                    # Validar campos contra ALLOWED_CONTACT_FIELDS
                    for field, value in kwargs.items():
                        if field in ALLOWED_CONTACT_FIELDS and value is not None:
                            updates.append(f"{field} = %s")
                            params.append(value)
                    
                    if not updates:
                        return json.dumps({"error": "No valid fields to update"})
                    
                    query = f"UPDATE contacts SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s AND tenant_id = %s"
                    params.extend([contact_id, tenant_id])
                    cursor.execute(query, params)
                    conn.commit()
                    conn.close()
                    return json.dumps({"success": True, "message": "Contacto actualizado exitosamente"})
                    
                conn.close()
                return json.dumps({"error": "Invalid action"})
            
            return await asyncio.to_thread(_db_op)
        except Exception as e:
            logger.error(f"Error managing contact: {e}")
            return json.dumps({"error": str(e)})

    async def create_order(self, customer_id: int, items: list, tenant_id: int, notes: str = None, conversation_id: str = None):
        """Crea un pedido en el sistema con protección de duplicados."""
        logger.info(f"Creating order for customer {customer_id} (Tenant: {tenant_id})")
        
        # 1. Idempotency Key Generation
        items_json = json.dumps(items, sort_keys=True)
        # Unique identifier based on payload + context
        idem_data = f"order:{customer_id}:{items_json}:{conversation_id or 'no-conv'}"
        
        if self.redis_client:
            is_dup, stored_res = self.redis_client.check_tool_idempotency(idem_data, ttl=90)
            if is_dup:
                if stored_res == "PROCESSING":
                    logger.warning(f"Order creation already in progress for {customer_id}")
                    return json.dumps({"error": "Order is being processed. Please wait.", "status": "processing"})
                logger.info(f"Returning cached order result for {customer_id}")
                return stored_res

        try:
            def _post():
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
                    "total": sum(item["subtotal"] for item in order_items),
                    "externalReference": f"AI-{hashlib.md5(idem_data.encode()).hexdigest()[:12]}"
                }

                url = f"{config.JAVA_API_URL}/orders?tenantId={tenant_id}"
                headers = {
                    "X-AI-Secret": config.AI_API_SECRET,
                    "Authorization": f"AI-Secret {config.AI_API_SECRET}"
                }
                logger.info(f"🚀 [AI-API-TOOL] Calling POST {url}")
                
                res = requests.post(url, json=payload, headers=headers, timeout=API_TIMEOUT)
                
                logger.info(f"📥 [AI-API-TOOL] Response Status: {res.status_code}")
                result_json = ""
                if res.status_code in [200, 201]:
                    result_json = json.dumps(res.json())
                else:
                    result_json = json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
                
                # 2. Save result in Redis
                if self.redis_client:
                    self.redis_client.save_tool_result(idem_data, result_json, ttl=180)
                
                return result_json
            
            return await asyncio.to_thread(_post)
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            return json.dumps({"error": str(e)})

    async def create_quote(self, customer_id: int, items: list, tenant_id: int, notes: str = None, conversation_id: str = None):
        """Crea una cotización en el sistema con protección de duplicados."""
        logger.info(f"Creating quote for customer {customer_id} (Tenant: {tenant_id})")
        
        items_json = json.dumps(items, sort_keys=True)
        idem_data = f"quote:{customer_id}:{items_json}:{conversation_id or 'no-conv'}"

        if self.redis_client:
            is_dup, stored_res = self.redis_client.check_tool_idempotency(idem_data, ttl=90)
            if is_dup:
                if stored_res == "PROCESSING":
                    return json.dumps({"error": "Quote is being processed. Please wait.", "status": "processing"})
                return stored_res

        try:
            def _post():
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
                    "total": sum(item["subtotal"] for item in quote_items),
                    "externalReference": f"AI-Q-{hashlib.md5(idem_data.encode()).hexdigest()[:12]}"
                }

                url = f"{config.JAVA_API_URL}/quotes?tenantId={tenant_id}"
                headers = {
                    "X-AI-Secret": config.AI_API_SECRET,
                    "Authorization": f"AI-Secret {config.AI_API_SECRET}"
                }
                res = requests.post(url, json=payload, headers=headers, timeout=API_TIMEOUT)
                
                result_json = ""
                if res.status_code in [200, 201]:
                    result_json = json.dumps(res.json())
                else:
                    result_json = json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
                
                if self.redis_client:
                    self.redis_client.save_tool_result(idem_data, result_json, ttl=180)
                
                return result_json
            
            return await asyncio.to_thread(_post)
        except Exception as e:
            logger.error(f"Error creating quote: {e}")
            return json.dumps({"error": str(e)})

    async def convert_quote_to_order(self, quote_id: int, tenant_id: int):
        """Convierte una cotización en un pedido oficial."""
        logger.info(f"Converting quote {quote_id} to order (Tenant: {tenant_id})")
        try:
            def _post():
                url = f"{config.JAVA_API_URL}/quotes/{quote_id}/convert-to-order?tenantId={tenant_id}"
                headers = {
                    "X-AI-Secret": config.AI_API_SECRET,
                    "Authorization": f"AI-Secret {config.AI_API_SECRET}"
                }
                res = requests.post(url, headers=headers, timeout=API_TIMEOUT)
                if res.status_code in [200, 201]:
                    return json.dumps(res.json())
                return json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
            
            return await asyncio.to_thread(_post)
        except Exception as e:
            logger.error(f"Error converting quote to order: {e}")
            return json.dumps({"error": str(e)})

    async def get_order(self, order_id: int, tenant_id: int):
        """Obtiene el detalle de un pedido."""
        logger.info(f"Fetching order {order_id} (Tenant: {tenant_id})")
        try:
            def _fetch():
                url = f"{config.JAVA_API_URL}/orders/{order_id}?tenantId={tenant_id}"
                headers = {
                    "X-AI-Secret": config.AI_API_SECRET,
                    "Authorization": f"AI-Secret {config.AI_API_SECRET}"
                }
                res = requests.get(url, headers=headers, timeout=API_TIMEOUT)
                if res.status_code == 200:
                    return json.dumps(res.json())
                return json.dumps({"error": f"API returned {res.status_code}"})
            
            return await asyncio.to_thread(_fetch)
        except Exception as e:
            logger.error(f"Error fetching order: {e}")
            return json.dumps({"error": str(e)})

    async def modify_order(self, order_id: int, items: list, tenant_id: int, notes: str = None):
        """Modifica un pedido existente."""
        logger.info(f"Modifying order {order_id} (Tenant: {tenant_id})")
        try:
            def _put():
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
                res = requests.put(url, json=payload, headers=headers, timeout=API_TIMEOUT)
                if res.status_code == 200:
                    return json.dumps(res.json())
                return json.dumps({"error": f"API returned {res.status_code}", "detail": res.text})
            
            return await asyncio.to_thread(_put)
        except Exception as e:
            logger.error(f"Error modifying order: {e}")
            return json.dumps({"error": str(e)})

    async def update_pipeline_stage(self, contact_id: int, stage_id: int, tenant_id: int):
        """Actualiza la etapa del pipeline para un contacto."""
        logger.info(f"Updating stage to {stage_id} for contact {contact_id} (Tenant: {tenant_id})")
        try:
            def _update():
                conn = self.pool.get_connection()
                cursor = conn.cursor()
                
                # Step 1: Update contact table
                query = "UPDATE contacts SET stage_id = %s, updated_at = NOW() WHERE id = %s AND tenant_id = %s"
                cursor.execute(query, (stage_id, contact_id, tenant_id))
                
                # Step 2: Update conversation_pipeline_state
                cursor.execute("SELECT id FROM conversation_pipeline_state WHERE contact_id = %s AND tenant_id = %s", (contact_id, tenant_id))
                state = cursor.fetchone()
                
                if state:
                    cursor.execute("UPDATE conversation_pipeline_state SET current_stage_id = %s, updated_at = NOW(), entered_stage_at = NOW() WHERE contact_id = %s AND tenant_id = %s", 
                                   (stage_id, contact_id, tenant_id))
                else:
                    cursor.execute("SELECT pipeline_id FROM pipeline_stages WHERE id = %s", (stage_id,))
                    ps = cursor.fetchone()
                    pipeline_id = ps[0] if ps else None
                    
                    cursor.execute("INSERT INTO conversation_pipeline_state (tenant_id, contact_id, pipeline_id, current_stage_id, entered_stage_at, is_active, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), 1, NOW(), NOW())",
                                   (tenant_id, contact_id, pipeline_id, stage_id))
                
                conn.commit()
                conn.close()
                return json.dumps({"success": True, "message": f"Etapa actualizada a {stage_id} correctamente"})
            
            return await asyncio.to_thread(_update)
        except Exception as e:
            logger.error(f"Error updating pipeline stage: {e}")
            return json.dumps({"error": str(e)})

    async def get_contact_pipeline(self, contact_id: int, tenant_id: int):
        """Lee el pipeline asociado al contacto y todas sus etapas disponibles."""
        logger.info(f"Getting pipeline stages for contact {contact_id} (Tenant: {tenant_id})")
        try:
            def _fetch():
                conn = self.pool.get_connection()
                cursor = conn.cursor(dictionary=True)

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

                cursor.execute("SELECT id, name FROM pipelines WHERE id = %s", (pipeline_id,))
                pipeline = cursor.fetchone()

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
            
            return await asyncio.to_thread(_fetch)
        except Exception as e:
            logger.error(f"Error getting contact pipeline: {e}")
            return json.dumps({"error": str(e)})

    async def generate_pipeline_chart(self, tenant_id: int):
        """Genera un gráfico horizontal de contactos por etapa."""
        logger.info(f"Generating pipeline chart (Tenant: {tenant_id})")
        plt.switch_backend('Agg')
        try:
            def _generate():
                conn = self.pool.get_connection()
                cursor = conn.cursor(dictionary=True)
                
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
                ax.invert_yaxis()
                
                for bar in bars:
                    width = bar.get_width()
                    ax.text(width + 0.1, bar.get_y() + bar.get_height()/2, f'{int(width)}', ha='left', va='center')
                
                os.makedirs(CHARTS_LOCAL_PATH, exist_ok=True)
                filename = f"pipeline_stats_{tenant_id}_{int(datetime.now().timestamp())}.png"
                filepath = os.path.join(CHARTS_LOCAL_PATH, filename)
                plt.tight_layout()
                plt.savefig(filepath)
                plt.close()
                
                public_url = f"{CHARTS_PUBLIC_URL}{filename}"
                return json.dumps({"success": True, "chart_url": public_url, "message": "Gráfico generado exitosamente"})
            
            return await asyncio.to_thread(_generate)
        except Exception as e:
            logger.error(f"Error generating chart: {e}")
            return json.dumps({"error": str(e)})

    async def _dispatch_tool(self, function_name: str, args: dict, tenant_id: int, conversation_id: str = None) -> str:
        """Despacha llamadas a herramientas usando un diccionario de handlers."""
        handlers = {
            "search_products_semantically": lambda a: self.search_products(a.get("query"), int(tenant_id)),
            "check_products_stock": lambda a: self.check_products_stock(a.get("product_ids"), int(tenant_id)),
            "get_contact": lambda a: self.get_contact(a.get("identifier"), int(tenant_id)),
            "manage_contact": lambda a: self.manage_contact(a.get("action"), int(tenant_id), **a),
            "update_pipeline_stage": lambda a: self.update_pipeline_stage(a.get("contact_id"), a.get("stage_id"), int(tenant_id)),
            "generate_pipeline_chart": lambda a: self.generate_pipeline_chart(int(tenant_id)),
            "get_contact_pipeline": lambda a: self.get_contact_pipeline(a.get("contact_id"), int(tenant_id)),
            "create_order": lambda a: self.create_order(a.get("customer_id"), a.get("items"), int(tenant_id), notes=a.get("notes"), conversation_id=conversation_id),
            "create_quote": lambda a: self.create_quote(a.get("customer_id"), a.get("items"), int(tenant_id), notes=a.get("notes"), conversation_id=conversation_id),
            "convert_quote_to_order": lambda a: self.convert_quote_to_order(a.get("quote_id"), int(tenant_id)),
            "get_order": lambda a: self.get_order(a.get("order_id"), int(tenant_id)),
            "modify_order": lambda a: self.modify_order(a.get("order_id"), a.get("items"), int(tenant_id), notes=a.get("notes"))
        }
        
        handler = handlers.get(function_name)
        if handler:
            return await handler(args)
        return json.dumps({"error": f"Tool {function_name} not found"})

    def _get_tools_for_context(self, message: str, history: list) -> list:
        """Selecciona herramientas relevantes para ahorrar tokens."""
        context = (message + " ".join([h.get("content", "") for h in history[-3:]])).lower()
        
        # Categorías de herramientas
        sales_tools = {"check_products_stock", "create_order", "create_quote", "convert_quote_to_order", "get_order", "modify_order"}
        mgmt_tools = {"manage_contact", "update_pipeline_stage", "generate_pipeline_chart", "get_contact_pipeline"}
        base_tools = {"search_products_semantically", "get_contact"}

        # Heurísticas de activación
        sales_keywords = {"pedir", "comprar", "pedido", "cotiz", "orden", "presupuesto", "quiero", "confirmo", "acepto", "precio", "stock", "inventario", "catalogo", "productos"}
        mgmt_keywords = {"pipeline", "etapa", "contacto", "actualizar", "gráfico", "chart", "dato", "nit", "email", "identificación", "direccion", "teléfono"}
        
        include_sales = any(kw in context for kw in sales_keywords)
        include_mgmt = any(kw in context for kw in mgmt_keywords)

        # Si no hay match claro, solo enviar base tools para ahorrar ~1,400 tokens
        active_names = base_tools.copy()
        if include_sales: active_names.update(sales_tools)
        if include_mgmt: active_names.update(mgmt_tools)

        # Retornar esquemas filtrados
        return [t for t in self._get_all_tool_schemas() if t["function"]["name"] in active_names]

    def _get_all_tool_schemas(self):
        """Define todos los esquemas de herramientas disponibles."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "search_products_semantically",
                    "description": "Busca productos por nombre o descripción.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": { "type": "string", "description": "Término de búsqueda o descripción del producto." }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "check_products_stock",
                    "description": "Consulta inventario de productos por ID.",
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
                    "description": "Busca contacto por email o teléfono.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "identifier": { "type": "string", "description": "Teléfono o email del contacto." }
                        },
                        "required": ["identifier"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "manage_contact",
                    "description": "Crea o actualiza datos de un contacto.",
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
                    "description": "Mueve el contacto a otra etapa del pipeline.",
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
                    "description": "Genera gráfico de contactos por etapa.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_order",
                    "description": "Crea un pedido cuando el cliente confirma compra.",
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
                    "description": "Crea cotización cuando el cliente pide presupuesto.",
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
                    "description": "Convierte cotización existente en pedido oficial.",
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
                    "description": "Obtiene detalle de un pedido por ID.",
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
                    "description": "Modifica items o notas de un pedido existente.",
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

    def _select_model(self, message: str) -> str:
        """Decide qué modelo usar para optimizar costos."""
        msg = message.lower().strip()
        words = msg.split()
        
        # Patrones de mensajes simples/cortos
        simple_responses = {"hola", "buenos días", "buenas tardes", "gracias", "ok", "vale", "si", "no", "perfecto", "chao", "adios", "listo"}
        
        if len(words) < 6 and any(sr in msg for sr in simple_responses):
            return "gpt-4o-mini"
        
        return config.OPENAI_MODEL # gpt-4o

    def _compress_history(self, history: list) -> list:
        """Mantiene los últimos 4 mensajes literales y resume los anteriores."""
        if len(history) <= 4:
            return history
        
        recent = history[-4:]
        old = history[:-4]
        
        summary_parts = []
        for h in old:
            role = "U" if h["role"] == "user" else "A"
            content = h.get("content", "")
            if content:
                summary_parts.append(f"{role}:{content[:50]}..")
        
        summary = {"role": "system", "content": f"[CONTEXTO PREVIO: {' | '.join(summary_parts)}]"}
        return [summary] + recent

    async def generate_response(self, tenant_id, contact_id, conversation_id, message, history, pipeline_state=None, message_id=None):
        # 3. Truncar historial según MAX_HISTORY
        history = history[-MAX_HISTORY:] if len(history) > MAX_HISTORY else history
        
        # 4. Comprimir historial para ahorrar tokens
        history = self._compress_history(history)

        company_info = self.get_company_context(tenant_id)

        # Contexto reducido: El modelo lo pedirá si lo necesita
        pipeline_context = "[PIPELINE] Usa get_contact_pipeline para consultar el estado del proceso interno cuando sea relevante."

        system_prompt = f"""Asistente de ventas profesional. Objetivo: ayudar con dudas y ventas usando neuromarketing.

EMPRESA:
{company_info}
{pipeline_context}

FORMATO PRODUCTO (obligatorio si muestras productos):
[IMAGE_URL] (solo si existe)
*{{Nombre}}* | {{Descripción breve}}
Precio: ${{Precio}} | Estado: {{Disponible (X uds) / Agotado}}

GESTIÓN INTERNA (NUNCA mencionar al usuario):
- Pipeline: Operaciones silenciosas. Usa update_pipeline_stage para mover al cliente según avance su interés.
- Cierre: get_contact -> confirmar/actualizar datos (manage_contact) -> create_order/create_quote.
- Post-venta: Mover a 'Facturado' o similar tras pedido.
- Rectificar: get_order -> modify_order.

PROHIBIDO:
- Mencionar pipelines, etapas, IDs, errores técnicos o procesos internos.
- Pedir registros externos.

REGLAS: Naturalidad, saludar amigablemente, usar search_products_semantically para catálogo y responder en el idioma del cliente."""

        messages = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        tools = self._get_tools_for_context(message, history)

        selected_model = self._select_model(message)

        try:
            total_usage = SimpleNamespace(prompt_tokens=0, completion_tokens=0, total_tokens=0)
            iterations = 0
            while iterations < 5:
                # Usar el modelo económico en la 1ra llamada si es simple.
                # Si requiere herramientas (iter > 0), escalar a gpt-4o para precisión.
                current_model = selected_model if iterations == 0 else config.OPENAI_MODEL
                
                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=current_model,
                    messages=messages,
                    tools=tools,
                    temperature=0.7,
                    timeout=30
                )
                
                # Tracking por llamada
                label = "PRIMERA_LLAMADA" if iterations == 0 else f"LLAMADA_{iterations+1}"
                self.tracker.track(response.usage, label, tenant_id, conversation_id)
                
                total_usage.prompt_tokens += response.usage.prompt_tokens
                total_usage.completion_tokens += response.usage.completion_tokens
                total_usage.total_tokens += response.usage.total_tokens

                response_message = response.choices[0].message
                tool_calls = response_message.tool_calls

                if not tool_calls:
                    if iterations == 0:
                        self.tracker.track(response.usage, "LLAMADA_DIRECTA", tenant_id, conversation_id)
                    else:
                        self.tracker.track(total_usage, "TOTAL_TURNO", tenant_id, conversation_id)
                    return response_message.content

                messages.append(response_message)
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    logger.info(f"🛠️ [AGENT-LOOP] Dispatching tool: {function_name}")
                    function_response = await self._dispatch_tool(function_name, function_args, tenant_id, conversation_id)
                    
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    })
                
                iterations += 1
                logger.info(f"🔄 [AGENT-LOOP] Iteration {iterations} completed")

            logger.warning("⚠️ [AGENT-LOOP] Max iterations reached")
            self.tracker.track(total_usage, "TOTAL_TURNO", tenant_id, conversation_id)
            return "He procesado varias acciones pero la solicitud es muy compleja. ¿Podrías ser más específico con el siguiente paso?"

        except Exception as e:
            logger.error(f"Error calling OpenAI: {e}")
            return "Lo siento, estoy experimentando dificultades técnicas. ¿Podrías repetir tu consulta en un momento?"
