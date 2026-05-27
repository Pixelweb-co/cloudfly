import os
import re
import httpx
import logging
import mysql.connector
import redis
import requests
from typing import Dict, List, Optional
from config import Config
from services.ai_ad_service import _get_api_key
from services.product_service import ProductService
from services.campaign_service import CampaignService

logger = logging.getLogger(__name__)

class ProspectorService:
    """
    Service responsible for automatic B2B cold prospecting.
    Integrates with lead-generator FastAPI microservice, saves leads to database,
    creates campaigns, and stores campaign context in Redis.
    """
    
    def __init__(self):
        self.db_config = {
            "host": Config.DB_HOST,
            "port": Config.DB_PORT,
            "database": Config.DB_NAME,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD
        }
        self.lead_generator_url = Config.LEAD_GENERATOR_URL
        self.product_service = ProductService()
        self.campaign_service = CampaignService()
        
    def generate_keywords(self, product_name: str, description: str) -> str:
        """
        Generates optimal search keywords using OpenRouter LLM based on the product.
        """
        # Prefer OpenAI for autonomous prospecting keywords (use OPENAI_API_KEY)
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY") or _get_api_key()
        url = "https://api.openai.com/v1/chat/completions"

        prompt = f"""Analiza este producto y genera una única palabra clave de búsqueda en español (máximo 2 palabras) para encontrar clientes B2B potenciales en Google Maps.
Por ejemplo, si el producto es "Software para restaurantes", la palabra clave debe ser "restaurantes" o "cafeterías".
Si el producto es "Harina de trigo premium para panaderías", la palabra clave debe ser "panaderías".

Producto: {product_name}
Descripción: {description}

Devuelve únicamente la palabra clave, sin explicaciones ni texto adicional."""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 12
        }

        try:
            logger.info("🤖 Generating prospecting keywords using OpenAI GPT...")
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            # Support both OpenAI and OpenRouter response shapes
            content = ""
            if isinstance(data.get("choices"), list) and data["choices"]:
                msg = data["choices"][0].get("message") or data["choices"][0]
                if isinstance(msg, dict):
                    content = msg.get("content", "").strip()
                else:
                    content = str(msg).strip()

            content = content.replace('"', '').replace("'", "").strip()
            logger.info(f"✅ Keywords generated: {content}")
            return content
        except Exception as e:
            logger.warning(f"⚠️ Failed to generate keywords using LLM: {e}. Falling back to default.")
            if "restaurante" in product_name.lower():
                return "restaurante"
            if "panader" in product_name.lower():
                return "panaderia"
            return "empresa"

    def _remove_accents(self, s: str) -> str:
        accents = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
            'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U'
        }
        return ''.join(accents.get(c, c) for c in s)

    def normalize_keyword(self, keyword: str) -> str:
        """
        Normalize a generated category/keyword to a compact, singular form
        suitable for searching (e.g., 'peluquerías cerca de mí' -> 'peluqueria',
        'salones de belleza' -> 'salon de belleza').
        """
        if not keyword:
            return keyword

        # remove bracketed placeholders like [ciudad]
        keyword = re.sub(r"\[.*?\]", "", keyword)
        keyword = keyword.lower()

        # remove accents first for consistent processing
        keyword = self._remove_accents(keyword)

        # remove common noisy phrases (use word boundaries)
        noisy_patterns = [
            r"\bcerca de mi\b", r"\bcerca de mi\b", r"\bcerca\b",
            r"\ben linea\b", r"\bcon servicio a domicilio\b", r"\bcon servicio\b",
            r"\blocales\b", r"\bnear\b"
        ]
        for n in noisy_patterns:
            keyword = re.sub(n, "", keyword)

        # strip punctuation and normalize whitespace
        keyword = re.sub(r"[\,\.\;\:\"\(\)\[\]]", "", keyword)
        keyword = re.sub(r"\s+", " ", keyword).strip()

        words = keyword.split()
        if not words:
            return keyword

        first = words[0]

        # Do not singularize, as Apify works best with single-word plural terms
        result = first
        if len(words) >= 3 and words[1] == 'de':
            second = words[2]
            result = f"{first} de {second}"

        return result
            
    def fetch_leads_from_generator(self, keyword: str, country: str = "Colombia", state: str = None, city: str = None, limit: int = 10) -> List[Dict]:
        """
        Calls lead-generator FastAPI client (port 8000) to fetch potential cold leads.
        """
        # Normalize keyword to increase chance of matching in lead-generator
        normalized = self.normalize_keyword(keyword)
        url = f"{self.lead_generator_url}/leads/generate"
        payload = {
            "mode": "automatic",
            "filters": {
                "keyword": normalized,
                "country": country,
                "state": state,
                "city": city,
                "limit": limit,
                "source": "auto",
                "enrich": True
            }
        }
        
        try:
            logger.info(f"📞 Calling lead-generator at {url} for keyword '{keyword}' (normalized: '{normalized}') in {city or 'any city'}, {state or 'any state'}, {country}...")
            resp = requests.post(url, json=payload, timeout=90)
            resp.raise_for_status()
            data = resp.json()
            leads = data.get("leads", [])
            logger.info(f"✅ Successfully retrieved {len(leads)} leads from lead-generator")
            return leads
        except Exception as e:
            logger.error(f"❌ Failed to fetch leads from lead-generator: {e}")
            return []

    def save_leads_to_crm(self, tenant_id: int, company_id: int, leads: List[Dict]) -> List[int]:
        """
        Saves the fetched B2B leads into the MySQL contacts table.
        """
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        saved_contact_ids = []
        
        query_insert = """
            INSERT INTO contacts (tenant_id, company_id, name, phone, is_active)
            VALUES (%s, %s, %s, %s, 1)
        """
        
        query_check = """
            SELECT id FROM contacts 
            WHERE tenant_id = %s AND company_id = %s AND phone = %s
            LIMIT 1
        """
        
        try:
            for lead in leads:
                name = lead.get("name", "Cliente Frío")
                phone = lead.get("phone", "")
                
                # Clean phone number
                phone = ''.join(filter(str.isdigit, phone))
                if not phone:
                    continue
                
                # Check duplicate
                cursor.execute(query_check, (tenant_id, company_id, phone))
                existing = cursor.fetchone()
                if existing:
                    logger.info(f"⏭️ Skipping duplicate contact: {name} ({phone})")
                    saved_contact_ids.append(existing[0])
                    continue
                
                # Insert new contact
                cursor.execute(query_insert, (tenant_id, company_id, name, phone))
                contact_id = cursor.lastrowid
                saved_contact_ids.append(contact_id)
                logger.info(f"💾 Saved lead as contact: {name} ({phone}) with ID {contact_id}")
                
            conn.commit()
            return saved_contact_ids
        except Exception as e:
            logger.error(f"❌ Error saving leads to CRM: {e}")
            conn.rollback()
            return []
        finally:
            cursor.close()
            conn.close()

    def create_campaign(self, tenant_id: int, company_id: int, product_id: int, message_text: str, media_url: str) -> Optional[int]:
        """
        Creates a campaign record in the campaigns table.
        """
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor()
        
        query = """
            INSERT INTO campaigns (
                tenant_id, company_id, name, description, status, 
                message, media_url, media_type, product_id
            ) VALUES (
                %s, %s, %s, %s, 'DRAFT', 
                %s, %s, 'IMAGE', %s
            )
        """
        
        name = f"Campaña Promocional IA - Producto ID {product_id}"
        description = f"Campaña automatizada de prospección en frío para producto ID {product_id}"
        
        try:
            cursor.execute(query, (
                tenant_id, company_id, name, description,
                message_text, media_url, product_id
            ))
            campaign_id = cursor.lastrowid
            conn.commit()
            logger.info(f"📣 Created campaign: '{name}' with ID {campaign_id}")
            return campaign_id
        except Exception as e:
            logger.error(f"❌ Failed to create campaign in DB: {e}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()

    def sync_redis_campaign_context(self, contact_ids: List[int], campaign_id: int, product_id: int, company_id: int):
        """
        Saves the campaign context into Redis for each contact ID to synchronize conversational tracking.
        """
        try:
            redis_client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                password=Config.REDIS_PASSWORD,
                decode_responses=True
            )
            
            # Test connection
            redis_client.ping()
            
            for contact_id in contact_ids:
                key = f"campaign_context:contact:{contact_id}"
                mapping = {
                    "campaign_id": str(campaign_id),
                    "product_id": str(product_id),
                    "company_id": str(company_id),
                    "timestamp": str(os.getenv("CURRENT_TIME", ""))
                }
                
                redis_client.hset(key, mapping=mapping)
                redis_client.expire(key, 604800) # 7-day TTL
                logger.info(f"🔗 Synced campaign context in Redis for contact ID {contact_id}")
                
        except Exception as e:
            logger.warning(f"⚠️ Redis is not running or failed to sync context: {e}. Skipping Redis sync.")

    def run_prospecting_workflow(self, tenant_id: int, company_id: int, limit: int = 10) -> dict:
        """
        Executes the full B2B cold prospecting workflow:
        1. Fetch active product
        2. Generate search keywords
        3. Call lead-generator API
        4. Save leads to CRM
        5. Create marketing campaign
        6. Synchronize campaign context to Redis for WhatsApp conversational follow-up.
        """
        logger.info(f"🚀 Starting B2B prospecting workflow for Tenant {tenant_id}, Company {company_id}...")
        
        # 1. Fetch active product
        try:
            product = self.product_service.get_active_product_with_image(tenant_id)
        except Exception as e:
            logger.error(f"❌ Prospecting failed: no active product found. Error: {e}")
            return {"status": "error", "message": "No active product found"}
            
        product_id = product.get("id")
        product_name = product.get("productName", "Producto")
        description = product.get("description", "")
        media_url = product.get("image_url", "")
        
        # 2. Generate search keywords
        keyword = self.generate_keywords(product_name, description)
        
        # 3. Call lead-generator FastAPI client
        leads = self.fetch_leads_from_generator(keyword, limit)
        if not leads:
            logger.warning("⚠️ No leads found from lead-generator. Prospecting completed with 0 results.")
            return {"status": "success", "leads_found": 0, "contacts_saved": 0}
            
        # 4. Save leads to CRM
        contact_ids = self.save_leads_to_crm(tenant_id, company_id, leads)
        if not contact_ids:
            logger.warning("⚠️ No contacts saved to DB.")
            return {"status": "success", "leads_found": len(leads), "contacts_saved": 0}
            
        # 5. Build campaign message and Create campaign
        campaign_msg = self.campaign_service.build_campaign_message(product)
        campaign_id = self.create_campaign(
            tenant_id, company_id, product_id,
            campaign_msg.text, media_url
        )
        
        if not campaign_id:
            logger.error("❌ Failed to create campaign in database.")
            return {
                "status": "error",
                "message": "Failed to create campaign in DB",
                "contacts_saved": len(contact_ids)
            }
            
        # 6. Synchronize Redis campaign context for conversation continuation
        self.sync_redis_campaign_context(contact_ids, campaign_id, product_id, company_id)
        
        return {
            "status": "success",
            "leads_found": len(leads),
            "contacts_saved": len(contact_ids),
            "campaign_id": campaign_id,
            "product_id": product_id
        }
