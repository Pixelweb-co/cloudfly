import os
import time
import json
import logging
import mysql.connector
import requests
import redis
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from config import Config
from services.prospector_service import ProspectorService
from services.campaign_service import CampaignService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("autonomous_worker")

class AutonomousMarketingWorker:
    def __init__(self):
        self.db_config = {
            "host": Config.DB_HOST,
            "port": Config.DB_PORT,
            "database": Config.DB_NAME,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD
        }

        print("🔑 OpenAI API Key is set: ", os.getenv("OPENAI_API_KEY"))
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.prospector_service = ProspectorService()
        self.campaign_service = CampaignService()
        
    def _call_openai_gpt4o(self, system_prompt: str, user_prompt: str, json_response: bool = True) -> str:
        """Helper to invoke OpenAI GPT-4o directly using requests module."""
        if not self.openai_api_key:
            logger.error("❌ OpenAI API Key is missing!")
            return ""
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }
        
        if json_response:
            payload["response_format"] = {"type": "json_object"}
            
        try:
            logger.info("🤖 Calling OpenAI GPT-4o...")
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            logger.info("⏳ Waiting 20 seconds to respect API rate limits...")
            time.sleep(20)
            return content
        except Exception as e:
            logger.error(f"❌ OpenAI GPT-4o call failed: {e}")
            logger.info("⏳ Waiting 20 seconds to respect API rate limits...")
            time.sleep(20)
            return ""

    def get_active_companies_for_tenant(self, tenant_id: int) -> List[Dict]:
        """Fetch active companies for a given tenant."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT c.id, c.tenant_id, c.name, cl.business_type, cl.business_description,
                   cl.pais_nombre, cl.ciudad_dian, cl.departamento_dian
            FROM companies c
            JOIN clientes cl ON c.tenant_id = cl.id
            WHERE c.tenant_id = %s AND c.status = 1
        """
        try:
            cursor.execute(query, (tenant_id,))
            companies = cursor.fetchall()
            return companies
        except Exception as e:
            logger.error(f"❌ Failed to fetch companies: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_company_products(self, tenant_id: int, company_id: int) -> List[Dict]:
        """Fetch active products for a company."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT id, product_name, description, price, sale_price 
            FROM productos 
            WHERE tenant_id = %s AND company_id = %s AND status IN ('ACTIVE', 'PUBLISHED')
        """
        try:
            cursor.execute(query, (tenant_id, company_id))
            products = cursor.fetchall()
            return products
        except Exception as e:
            logger.error(f"❌ Failed to fetch products: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_or_create_b2b_pipeline(self, tenant_id: int) -> tuple:
        """Finds or creates a pipeline for B2B Prospecion with 6 stages, returning (pipeline_id, initial_stage_id)."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        
        # Check if pipeline exists
        query_find_pipeline = "SELECT id FROM pipelines WHERE tenant_id = %s AND name = %s LIMIT 1"
        try:
            cursor.execute(query_find_pipeline, (tenant_id, "Prospección B2B"))
            row = cursor.fetchone()
            if row:
                pipeline_id = row[0]
            else:
                # Create pipeline
                query_insert_pipeline = """
                    INSERT INTO pipelines (tenant_id, name, description, type, color, icon)
                    VALUES (%s, 'Prospección B2B', 'Pipeline para contactos prospectados de manera automática', 'MARKETING', '#4F46E5', 'ri-user-search-line')
                """
                cursor.execute(query_insert_pipeline, (tenant_id,))
                pipeline_id = cursor.lastrowid
                conn.commit()
                logger.info(f"🛣️ Created new pipeline 'Prospección B2B' with ID {pipeline_id}")
                
            # Stages to ensure exist
            stages = [
                {"name": "Prospecto", "desc": "Contacto frío inicialmente prospectado por IA", "pos": 1, "init": 1, "final": 0, "outcome": "OPEN"},
                {"name": "Contactado", "desc": "Mensaje automático de campaña enviado", "pos": 2, "init": 0, "final": 0, "outcome": "OPEN"},
                {"name": "Interesado", "desc": "Lead demostró interés o respondió positivamente", "pos": 3, "init": 0, "final": 0, "outcome": "OPEN"},
                {"name": "Reunión Agendada", "desc": "Cita programada con el asesor comercial", "pos": 4, "init": 0, "final": 0, "outcome": "OPEN"},
                {"name": "Vendido", "desc": "Negocio cerrado con éxito", "pos": 5, "init": 0, "final": 1, "outcome": "WON"},
                {"name": "Perdido", "desc": "Lead descartado o no interesado", "pos": 6, "init": 0, "final": 1, "outcome": "LOST"}
            ]
            
            initial_stage_id = None
            
            for s in stages:
                query_find_stage = "SELECT id FROM pipeline_stages WHERE pipeline_id = %s AND name = %s LIMIT 1"
                cursor.execute(query_find_stage, (pipeline_id, s["name"]))
                stage_row = cursor.fetchone()
                if stage_row:
                    stage_id = stage_row[0]
                else:
                    query_insert_stage = """
                        INSERT INTO pipeline_stages (pipeline_id, name, description, position, is_initial, is_final, outcome)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(query_insert_stage, (
                        pipeline_id, s["name"], s["desc"], s["pos"], s["init"], s["final"], s["outcome"]
                    ))
                    stage_id = cursor.lastrowid
                    conn.commit()
                    logger.info(f"📍 Created pipeline stage '{s['name']}' with ID {stage_id}")
                    
                if s["init"] == 1:
                    initial_stage_id = stage_id
                    
            return pipeline_id, initial_stage_id
        except Exception as e:
            logger.error(f"❌ Error in get_or_create_b2b_pipeline: {e}")
            return None, None
        finally:
            cursor.close()
            conn.close()

    def analyze_company_and_products(self, company_name: str, biz_type: str, biz_desc: str, products: List[Dict]) -> Dict:
        """Classify company and extract target categories using GPT-4o."""
        system_prompt = "Eres un analista de marketing experto en B2B. Responde estrictamente con un objeto JSON."
        
        products_info = "\n".join([
            f"- {p.get('product_name')}: {p.get('description')} (Precio: {p.get('price')})"
            for p in products
        ])
        
        user_prompt = f"""Analiza la siguiente compañía y sus productos.
Compañía: {company_name}
Tipo de Negocio: {biz_type}
Descripción: {biz_desc}

Productos:
{products_info}

Determina:
1. Si la empresa es B2B (su público objetivo principal son otras empresas/negocios) o B2C (público masivo/consumidor final).
2. Si es B2B, genera una lista de hasta 4 categorías específicas de clientes ideales (ICP / Nichos) en español que se puedan buscar en Google Maps (ej: "restaurantes", "hoteles", "panaderías", "consultorios médicos").
Cada categoría debe ser una palabra o frase muy corta de búsqueda.

Responde únicamente con el siguiente formato JSON:
{{
  "is_b2b": true,
  "categories": ["categoria1", "categoria2"]
}}
"""
        response_text = self._call_openai_gpt4o(system_prompt, user_prompt, json_response=True)
        if not response_text:
            return {"is_b2b": False, "categories": []}
            
        try:
            return json.loads(response_text)
        except Exception as e:
            logger.error(f"❌ Failed to parse GPT-4o response: {e}")
            return {"is_b2b": False, "categories": []}

    def check_duplicate_list_or_campaign(self, tenant_id: int, company_id: int, name: str) -> bool:
        """Check if sending list or campaign with this name already exists."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        
        # Check sending lists
        query_list = "SELECT id FROM sending_lists WHERE tenant_id = %s AND company_id = %s AND name = %s LIMIT 1"
        # Check campaigns
        query_camp = "SELECT id FROM campaigns WHERE tenant_id = %s AND company_id = %s AND name = %s LIMIT 1"
        
        try:
            cursor.execute(query_list, (tenant_id, company_id, name))
            if cursor.fetchone():
                return True
                
            cursor.execute(query_camp, (tenant_id, company_id, name))
            if cursor.fetchone():
                return True
                
            return False
        except Exception as e:
            logger.error(f"❌ Error checking duplicates: {e}")
            return True
        finally:
            cursor.close()
            conn.close()

    def check_campaign_exists(self, tenant_id: int, company_id: int, name: str) -> Optional[int]:
        """Checks if a campaign with this name already exists, returning its ID if found."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        query = "SELECT id FROM campaigns WHERE tenant_id = %s AND company_id = %s AND name = %s LIMIT 1"
        try:
            cursor.execute(query, (tenant_id, company_id, name))
            row = cursor.fetchone()
            if row:
                return row[0]
            return None
        except Exception as e:
            logger.error(f"❌ Error checking campaign existence: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def get_or_create_sending_list(self, tenant_id: int, company_id: int, name: str) -> Optional[int]:
        """Finds an existing active sending list by name, or creates a new one."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        
        query_find = "SELECT id FROM sending_lists WHERE tenant_id = %s AND company_id = %s AND name = %s LIMIT 1"
        try:
            cursor.execute(query_find, (tenant_id, company_id, name))
            row = cursor.fetchone()
            if row:
                logger.info(f"📋 Found existing sending list '{name}' with ID {row[0]}")
                return row[0]
            
            # If not found, create new
            query_insert = """
                INSERT INTO sending_lists (tenant_id, company_id, name, description, status)
                VALUES (%s, %s, %s, %s, 'ACTIVE')
            """
            cursor.execute(query_insert, (tenant_id, company_id, name, f"Lista automática para nicho {name}"))
            conn.commit()
            list_id = cursor.lastrowid
            logger.info(f"📋 Created sending list '{name}' with ID {list_id}")
            return list_id
        except Exception as e:
            logger.error(f"❌ Failed to get or create sending list: {e}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()

    def qualify_leads_gpt4o(self, leads: List[Dict], products: List[Dict]) -> List[Dict]:
        """Qualify cold leads against products using GPT-4o."""
        if not leads:
            return []
            
        system_prompt = "Eres un calificador de leads B2B. Responde estrictamente con un objeto JSON."
        
        products_info = "\n".join([
            f"- {p.get('product_name')}: {p.get('description')}"
            for p in products
        ])
        
        leads_info = json.dumps([{"name": l.get("name"), "phone": l.get("phone")} for l in leads], ensure_ascii=False)
        
        user_prompt = f"""Califica a los siguientes clientes potenciales para ver si son compradores idóneos de nuestros productos.
Productos de la Empresa:
{products_info}

Clientes Potenciales a Evaluar:
{leads_info}

Para cada cliente en el listado, evalúa si es razonable ofrecerles nuestros productos.
Responde únicamente con un objeto JSON que contenga una lista "qualified_leads" con los objetos que tengan un nivel alto o medio de idoneidad.
Formato de respuesta:
{{
  "qualified_leads": [
    {{"name": "Nombre cliente idóneo", "phone": "teléfono"}}
  ]
}}
"""
        response_text = self._call_openai_gpt4o(system_prompt, user_prompt, json_response=True)
        if not response_text:
            return []
            
        try:
            qualified = json.loads(response_text).get("qualified_leads", [])
            logger.info(f"✅ GPT-4o Qualified {len(qualified)} leads out of {len(leads)}")
            return qualified
        except Exception as e:
            logger.error(f"❌ Failed to parse qualification output: {e}")
            return []

    def save_qualified_leads(self, tenant_id: int, company_id: int, sending_list_id: int, leads: List[Dict]) -> List[int]:
        """Saves qualified leads ensuring no duplicates exist in this category list and assigns them to 'Manager' role/position & Pipeline."""
        pipeline_id, stage_id = self.get_or_create_b2b_pipeline(tenant_id)
        if not pipeline_id or not stage_id:
            logger.warning("⚠️ B2B Pipeline or Stage could not be retrieved/created. Leads will be saved without pipeline association.")
            
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        saved_ids = []
        
        query_check_contact = """
            SELECT id FROM contacts 
            WHERE tenant_id = %s AND company_id = %s AND phone = %s
            LIMIT 1
        """
        
        query_insert_contact = """
            INSERT INTO contacts (tenant_id, company_id, name, phone, is_active, position, pipeline_id, stage_id, type)
            VALUES (%s, %s, %s, %s, 1, 'Manager', %s, %s, 'LEAD')
        """
        
        query_check_list_contact = """
            SELECT id FROM sending_list_contacts
            WHERE sending_list_id = %s AND contact_id = %s
            LIMIT 1
        """
        
        query_insert_list_contact = """
            INSERT INTO sending_list_contacts (sending_list_id, contact_id, status)
            VALUES (%s, %s, 'ACTIVE')
        """
        
        try:
            for lead in leads:
                name = lead.get("name", "Cliente Frío")
                phone = ''.join(filter(str.isdigit, lead.get("phone", "")))
                
                if not phone:
                    continue
                    
                # 1. Find/insert contact in contacts table, assigning position='Manager' & B2B Pipeline
                cursor.execute(query_check_contact, (tenant_id, company_id, phone))
                contact_row = cursor.fetchone()
                
                if contact_row:
                    contact_id = contact_row[0]
                    # Update pipeline and position for existing contact to match rules
                    query_update_contact = "UPDATE contacts SET position = 'Manager', pipeline_id = %s, stage_id = %s WHERE id = %s"
                    cursor.execute(query_update_contact, (pipeline_id, stage_id, contact_id))
                else:
                    cursor.execute(query_insert_contact, (tenant_id, company_id, name, phone, pipeline_id, stage_id))
                    contact_id = cursor.lastrowid
                    
                # 2. Check if already associated to this specific sending list (no duplicates in category)
                cursor.execute(query_check_list_contact, (sending_list_id, contact_id))
                if cursor.fetchone():
                    logger.info(f"⏭️ Lead with phone {phone} already belongs to category list {sending_list_id}. Skipping duplicate.")
                    continue
                    
                # 3. Associate to list
                cursor.execute(query_insert_list_contact, (sending_list_id, contact_id))
                saved_ids.append(contact_id)
                logger.info(f"💾 Linked lead {name} ({phone}) to list {sending_list_id} in B2B Pipeline")
                
            conn.commit()
            
            # Update counter in sending_lists
            if saved_ids:
                query_update_counter = "UPDATE sending_lists SET total_contacts = total_contacts + %s WHERE id = %s"
                cursor.execute(query_update_counter, (len(saved_ids), sending_list_id))
                conn.commit()
                
            return saved_ids
        except Exception as e:
            logger.error(f"❌ Error saving qualified leads: {e}")
            conn.rollback()
            return []
        finally:
            cursor.close()
            conn.close()

    def get_active_whatsapp_channel(self, tenant_id: int, company_id: int) -> Optional[int]:
        """Fetch active WhatsApp channel ID."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        
        query = """
            SELECT id FROM channels 
            WHERE tenant_id = %s AND company_id = %s AND platform = 'WHATSAPP' AND status = 1 
            LIMIT 1
        """
        try:
            cursor.execute(query, (tenant_id, company_id))
            row = cursor.fetchone()
            if row:
                return row[0]
            return None
        except Exception as e:
            logger.error(f"❌ Error getting channel: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def create_and_schedule_campaign(self, tenant_id: int, company_id: int, category_name: str, sending_list_id: int, channel_id: int, products: List[Dict]) -> Optional[int]:
        """Create and schedule campaign in DB using custom formatted message copy."""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        
        product = products[0] if products else {}
        product_id = product.get("id")
        
        # Build attractive copywriting
        system_prompt = "Eres un redactor experto en marketing conversacional por WhatsApp. Responde estrictamente con un objeto JSON."
        user_prompt = f"""Crea un mensaje altamente persuasivo y directo para WhatsApp ofreciendo el siguiente producto a prospectos del nicho '{category_name}'.
Producto: {product.get('product_name')}
Descripción: {product.get('description')}

El mensaje debe incluir emojis, saltos de línea legibles y una llamada a la acción clara para agendar una reunión o solicitar demo.

Responde únicamente con este formato JSON:
{{
  "message": "Cuerpo del mensaje en WhatsApp aquí..."
}}
"""
        response_text = self._call_openai_gpt4o(system_prompt, user_prompt, json_response=True)
        message_body = ""
        if response_text:
            try:
                message_body = json.loads(response_text).get("message", "")
            except Exception:
                pass
                
        if not message_body:
            message_body = f"Hola! Te escribimos de CloudFly. Pensamos que tu negocio en el sector de {category_name} podría beneficiarse de nuestro producto {product.get('product_name')}. Hablemos!"
            
        query = """
            INSERT INTO campaigns (
                tenant_id, company_id, name, description, status,
                channel_id, sending_list_id, message, product_id, scheduled_at
            ) VALUES (%s, %s, %s, %s, 'SCHEDULED', %s, %s, %s, %s, %s)
        """
        
        # Schedule it 5 minutes into the future
        scheduled_time = datetime.now() + timedelta(minutes=5)
        
        try:
            cursor.execute(query, (
                tenant_id,
                company_id,
                category_name,
                f"Campaña automatizada para nicho {category_name}",
                channel_id,
                sending_list_id,
                message_body,
                product_id,
                scheduled_time
            ))
            conn.commit()
            campaign_id = cursor.lastrowid
            logger.info(f"📣 Scheduled campaign '{category_name}' (ID {campaign_id}) at {scheduled_time}")
            return campaign_id
        except Exception as e:
            logger.error(f"❌ Failed to create campaign: {e}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()

    def sync_redis_campaign_context(self, contact_ids: List[int], campaign_id: int, product_id: Optional[int], company_id: int):
        """Link contact tracking context in Redis."""
        try:
            redis_client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                password=Config.REDIS_PASSWORD,
                decode_responses=True
            )
            redis_client.ping()
            
            for contact_id in contact_ids:
                key = f"campaign_context:contact:{contact_id}"
                mapping = {
                    "campaign_id": str(campaign_id),
                    "product_id": str(product_id) if product_id else "",
                    "company_id": str(company_id),
                    "timestamp": str(datetime.now().isoformat())
                }
                redis_client.hset(key, mapping=mapping)
                redis_client.expire(key, 604800) # 7-day TTL
                
            logger.info(f"🔗 Successfully synced campaign context in Redis for {len(contact_ids)} contacts.")
        except Exception as e:
            logger.warning(f"⚠️ Redis is not reachable: {e}")

    def execute_workflow(self):
        """Autonomous campaign execution entry point."""
        logger.info("\n" + "="*80)
        logger.info(f"🤖 START: B2B Prospecting & Campaign Generator Workflow at {datetime.now().isoformat()}")
        logger.info("="*80)
        
        # Strictly query companies belonging to tenant 1 for testing (as requested by user)
        companies = self.get_active_companies_for_tenant(1)
        logger.info(f"✓ Fetched {len(companies)} active companies for tenant 1.")
        if not companies:
            logger.warning("⚠️ No companies found. Workflow cannot proceed.")
            return
        
        for idx, company in enumerate(companies, 1):
            company_id = company["id"]
            company_name = company["name"]
            logger.info(f"\n[Company {idx}/{len(companies)}] 🏢 Processing: {company_name} (ID: {company_id})")
            desc = company.get('business_description') or ''
            logger.info(f"   Business Type: {company.get('business_type', 'N/A')}, Desc: {desc[:50]}...")
            
            # 1. Fetch active products
            logger.info(f"   → Fetching active products for company {company_id}...")
            products = self.get_company_products(1, company_id)
            if not products:
                logger.warning(f"   ✗ No active products found. Skipping this company.")
                continue
            logger.info(f"   ✓ Found {len(products)} active products")
                
            # 2. Classify and determine ICP categories via GPT-4o
            logger.info(f"   → Analyzing company profile & products with GPT-4o...")
            analysis = self.analyze_company_and_products(
                company_name,
                company.get("business_type") or "",
                company.get("business_description") or "",
                products
            )
            logger.info(f"   ✓ Analysis complete. Result: {analysis}")
            
            if not analysis.get("is_b2b"):
                logger.info(f"   ✗ Company classified as B2C. Skipping B2B prospecting.")
                continue
                
            categories = analysis.get('categories', [])
            logger.info(f"   ✓ Company classified as B2B. Target categories ({len(categories)}): {categories}")
            
            # Fetch active WhatsApp channel
            logger.info(f"   → Fetching active WhatsApp channel...")
            channel_id = self.get_active_whatsapp_channel(1, company_id)
            if not channel_id:
                logger.warning(f"   ✗ No active WhatsApp channel found. Skipping campaign creation.")
                continue
            logger.info(f"   ✓ Found WhatsApp channel ID: {channel_id}")
                
            # 3. Process each category
            for cat_idx, category in enumerate(analysis.get("categories", []), 1):
                category = category.strip()
                if not category:
                    continue
                    
                logger.info(f"   [Category {cat_idx}] 🎯 Processing ICP category: '{category}'")
                
                # Find or create sending list
                logger.info(f"      → Finding or creating sending list '{category}'...")
                sending_list_id = self.get_or_create_sending_list(1, company_id, category)
                if not sending_list_id:
                    logger.error(f"      ✗ Failed to find or create sending list. Skipping category.")
                    continue
                    
                # Extract location from company/tenant database columns
                country = company.get("pais_nombre") or "Colombia"
                state = company.get("departamento_dian")
                city = company.get("ciudad_dian")

                # Fetch leads via Prospector with dynamic location
                logger.info(f"      → Prospecting leads for '{category}' in {city or 'any city'}, {state or 'any state'}, {country} (limit=5)...")
                leads = self.prospector_service.fetch_leads_from_generator(
                    keyword=category,
                    country=country,
                    state=state,
                    city=city,
                    limit=5
                )
                
                # Wait 25 seconds to respect lead-generator rate limits
                logger.info("⏳ Waiting 25 seconds to respect lead-generator rate limits...")
                time.sleep(25)
                
                if not leads:
                    logger.warning(f"      ✗ No leads found from generator. Skipping category.")
                    continue
                logger.info(f"      ✓ Fetched {len(leads)} leads from generator")
                    
                # Qualify leads via GPT-4o
                logger.info(f"      → Qualifying {len(leads)} leads with GPT-4o...")
                qualified_leads = self.qualify_leads_gpt4o(leads, products)
                if not qualified_leads:
                    logger.info(f"      ✗ No leads passed GPT-4o qualification. Skipping category.")
                    continue
                logger.info(f"      ✓ {len(qualified_leads)} leads qualified (passed filter)")
                    
                # Save qualified leads without duplicates
                logger.info(f"      → Saving {len(qualified_leads)} qualified leads to database...")
                contact_ids = self.save_qualified_leads(1, company_id, sending_list_id, qualified_leads)
                if not contact_ids:
                    logger.warning(f"      ✗ No new unique leads added to list (all duplicates?). Skipping campaign workflow.")
                    continue
                logger.info(f"      ✓ Saved {len(contact_ids)} new unique leads to sending list {sending_list_id}")
                    
                # Check if campaign already exists
                existing_campaign_id = self.check_campaign_exists(1, company_id, category)
                if existing_campaign_id:
                    logger.info(f"      ℹ️ Campaign for category '{category}' already exists with ID {existing_campaign_id}. Bypassing creation.")
                    campaign_id = existing_campaign_id
                else:
                    # Create and schedule campaign
                    logger.info(f"      → Creating and scheduling WhatsApp campaign...")
                    campaign_id = self.create_and_schedule_campaign(
                        1, company_id, category, sending_list_id, channel_id, products
                    )
                
                if campaign_id:
                    # Sync Redis context
                    logger.info(f"      → Syncing campaign context to Redis...")
                    self.sync_redis_campaign_context(contact_ids, campaign_id, products[0].get("id"), company_id)
                    logger.info(f"      ✓ Category '{category}' workflow completed successfully!")
                else:
                    logger.error(f"      ✗ Campaign processing failed. Skipping Redis sync.")

def run_worker_loop():
    """Loop running the worker every 10 minutes."""
    logger.info("\n" + "#"*80)
    logger.info("# MARKETING AGENT WORKER INITIALIZED - Starting autonomous loop")
    logger.info(f"# Starting time: {datetime.now().isoformat()}")
    logger.info(f"# Execution interval: 10 minutes")
    logger.info("#"*80)
    
    worker = AutonomousMarketingWorker()
    cycle_count = 0
    
    while True:
        cycle_count += 1
        try:
            logger.info(f"\n### CYCLE {cycle_count} START (Time: {datetime.now().isoformat()}) ###")
            worker.execute_workflow()
            logger.info(f"### CYCLE {cycle_count} END - Workflow completed successfully ###")
        except Exception as e:
            logger.error(f"### CYCLE {cycle_count} ERROR: {e}", exc_info=True)
        
        next_run = datetime.now() + timedelta(minutes=10)
        logger.info(f"⏳ Waiting 10 minutes... Next execution at {next_run.isoformat()}")
        time.sleep(600)

if __name__ == "__main__":
    logger.info("Starting Marketing Agent autonomous worker...")
    worker = AutonomousMarketingWorker()
    logger.info("Worker initialized. Entering autonomous loop...")
    worker.execute_workflow()
