import logging
import json
import requests
import os
from datetime import datetime, timedelta

from crews.marketing_crew import build_analysis_crew, build_campaign_crew
from tools.mysql_tool import MySQLTool
from tools.redis_tool import RedisTool
from services.prospector_service import ProspectorService
from config import Config

logger = logging.getLogger("cloudfly_ai")

class AutonomousMarketingFlow:

    def __init__(self):
        self.prospector_service = ProspectorService()
        self.scheduler_url = os.getenv("SCHEDULER_SERVICE_URL", "http://scheduler-service:8080")

    def get_active_companies(self):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor(dictionary=True)

        query = '''
        SELECT c.id, c.tenant_id, c.name,
               cl.business_type,
               cl.business_description,
               cl.pais_nombre
        FROM companies c
        JOIN clientes cl ON c.tenant_id = cl.id
        WHERE c.status = 1
        '''

        cursor.execute(query)
        companies = cursor.fetchall()

        cursor.close()
        conn.close()

        return companies

    def get_products(self, tenant_id, company_id):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor(dictionary=True)

        query = '''
        SELECT id, product_name, description
        FROM productos
        WHERE tenant_id = %s
        AND company_id = %s
        AND status IN ('ACTIVE', 'PUBLISHED')
        '''

        cursor.execute(query, (tenant_id, company_id))
        products = cursor.fetchall()

        cursor.close()
        conn.close()

        return products

    def get_active_whatsapp_channel(self, tenant_id, company_id):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor()
        query = '''
        SELECT id FROM channels 
        WHERE tenant_id = %s AND company_id = %s AND platform = 'WHATSAPP' AND status = 1 
        LIMIT 1
        '''
        cursor.execute(query, (tenant_id, company_id))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return row[0] if row else None

    def get_or_create_sending_list(self, tenant_id, company_id, name):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor()
        query_find = "SELECT id FROM sending_lists WHERE tenant_id = %s AND company_id = %s AND name = %s LIMIT 1"
        cursor.execute(query_find, (tenant_id, company_id, name))
        row = cursor.fetchone()
        if row:
            cursor.close()
            conn.close()
            return row[0]
        
        query_insert = """
            INSERT INTO sending_lists (tenant_id, company_id, name, description, status)
            VALUES (%s, %s, %s, %s, 'ACTIVE')
        """
        cursor.execute(query_insert, (tenant_id, company_id, name, f"Lista automática para {name}"))
        conn.commit()
        list_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return list_id

    def save_qualified_leads_to_crm(self, tenant_id, company_id, sending_list_id, leads):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor()
        saved_ids = []
        
        query_check_contact = """
            SELECT id FROM contacts 
            WHERE tenant_id = %s AND company_id = %s AND phone = %s
            LIMIT 1
        """
        query_insert_contact = """
            INSERT INTO contacts (tenant_id, company_id, name, phone, is_active, position, type)
            VALUES (%s, %s, %s, %s, 1, 'Manager', 'LEAD')
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
                
                cursor.execute(query_check_contact, (tenant_id, company_id, phone))
                contact_row = cursor.fetchone()
                if contact_row:
                    contact_id = contact_row[0]
                else:
                    cursor.execute(query_insert_contact, (tenant_id, company_id, name, phone))
                    contact_id = cursor.lastrowid
                
                cursor.execute(query_check_list_contact, (sending_list_id, contact_id))
                if not cursor.fetchone():
                    cursor.execute(query_insert_list_contact, (sending_list_id, contact_id))
                    saved_ids.append(contact_id)
            
            conn.commit()
            if saved_ids:
                query_update_counter = "UPDATE sending_lists SET total_contacts = total_contacts + %s WHERE id = %s"
                cursor.execute(query_update_counter, (len(saved_ids), sending_list_id))
                conn.commit()
            return saved_ids
        except Exception as e:
            logger.error(f"Error saving leads to CRM: {e}")
            conn.rollback()
            return []
        finally:
            cursor.close()
            conn.close()

    def create_campaign_in_db(self, tenant_id, company_id, category_name, sending_list_id, channel_id, message_body, product_id, scheduled_at):
        conn = MySQLTool.get_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO campaigns (
                tenant_id, company_id, name, description, status,
                channel_id, sending_list_id, message, product_id, scheduled_at
            ) VALUES (%s, %s, %s, %s, 'SCHEDULED', %s, %s, %s, %s, %s)
        """
        name = f"Campaña Autónoma - {category_name}"
        description = f"Campaña de prospección automatizada para {category_name}"
        
        try:
            cursor.execute(query, (
                tenant_id, company_id, name, description,
                channel_id, sending_list_id, message_body, product_id, scheduled_at
            ))
            conn.commit()
            campaign_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return campaign_id
        except Exception as e:
            logger.error(f"Error creating campaign in DB: {e}")
            conn.rollback()
            cursor.close()
            conn.close()
            return None

    def sync_redis_campaign_context(self, contact_ids, campaign_id, product_id, company_id):
        try:
            r = RedisTool.get_client()
            r.ping()
            for contact_id in contact_ids:
                key = f"campaign_context:contact:{contact_id}"
                mapping = {
                    "campaign_id": str(campaign_id),
                    "product_id": str(product_id) if product_id else "",
                    "company_id": str(company_id),
                    "timestamp": datetime.now().isoformat()
                }
                r.hset(key, mapping=mapping)
                r.expire(key, 604800) # 7-day TTL
            logger.info(f"🔗 Synced campaign context in Redis for {len(contact_ids)} contacts.")
        except Exception as e:
            logger.warning(f"⚠️ Redis sync context failed: {e}")

    def call_scheduler_service(self, tenant_id, company_id, campaign_id, campaign_name, scheduled_at):
        url = f"{self.scheduler_url}/api/events"
        scheduled_at_iso = scheduled_at.strftime('%Y-%m-%dT%H:%M:%S')
        ended_at_iso = (scheduled_at + timedelta(minutes=30)).strftime('%Y-%m-%dT%H:%M:%S')
        
        scheduler_payload = {
            "topic": "campaign-worker-queue",
            "data": {
                "campaignId": campaign_id,
                "tenantId": tenant_id,
                "companyId": company_id
            }
        }
        
        event_dto = {
            "tenantId": tenant_id,
            "companyId": company_id,
            "calendarId": 1,
            "title": f"Campaña: {campaign_name}",
            "description": "Ejecución automática de campaña de marketing programada autónomamente",
            "eventType": "KAFKA_QUEUE",
            "eventSubtype": "CAMPAIGN_WORKER",
            "status": "SCHEDULED",
            "startTime": scheduled_at_iso,
            "endTime": ended_at_iso,
            "allDay": False,
            "relatedEntityType": "CAMPAIGN",
            "relatedEntityId": campaign_id,
            "campaignId": campaign_id,
            "payload": json.dumps(scheduler_payload)
        }
        
        try:
            logger.info(f"📅 POSTing campaign calendar event to {url} at {scheduled_at_iso}")
            resp = requests.post(url, json=event_dto, timeout=15)
            resp.raise_for_status()
            logger.info("✅ Campaign successfully scheduled in scheduler-service calendar!")
        except Exception as e:
            logger.error(f"❌ Failed to schedule campaign calendar event: {e}")

    def run(self):
        companies = self.get_active_companies()
        logger.info(f"Found {len(companies)} companies")

        for company in companies:
            logger.info(f"Processing company {company['name']}")

            products = self.get_products(
                company['tenant_id'],
                company['id']
            )

            if not products:
                continue

            for product in products:
                logger.info(f"Processing campaign for product: {product.get('product_name')} (ID: {product.get('id')})")

                # Phase 1: B2B Analysis Crew (Researcher & ICP Strategist)
                analysis_crew = build_analysis_crew(
                    company=company,
                    product=product
                )
                result = analysis_crew.kickoff()
                logger.info(f"Crew kickoff results: {result}")

                # Parse strategist task output
                analysis_raw = analysis_crew.tasks[1].output.raw.strip()
                if analysis_raw.startswith("```json"):
                    analysis_raw = analysis_raw[7:]
                if analysis_raw.endswith("```"):
                    analysis_raw = analysis_raw[:-3]
                analysis_raw = analysis_raw.strip()

                try:
                    analysis_json = json.loads(analysis_raw)
                    logger.info("✅ B2B analysis successfully parsed as JSON!")
                except Exception:
                    logger.warning(f"B2B analysis output is not valid JSON: {analysis_raw}")
                    continue

                if not analysis_json.get("is_b2b"):
                    logger.info(f"✗ Product {product.get('product_name')} is not B2B. Skipping prospecting.")
                    continue

                raw_categories = analysis_json.get("categories", [])
                # Normalize categories into objects with singular 'category' and explicit 'country'
                normalized_categories = []
                for cat in raw_categories:
                    if isinstance(cat, dict):
                        name = cat.get('category') or cat.get('name') or ''
                        country = cat.get('country') or company.get('pais_nombre') or 'Colombia'
                    else:
                        name = str(cat)
                        country = company.get('pais_nombre') or 'Colombia'

                    # use prospector normalization to singularize and strip noise
                    try:
                        norm_name = self.prospector_service.normalize_keyword(name)
                    except Exception:
                        norm_name = name

                    normalized_categories.append({
                        'category': norm_name,
                        'country': country
                    })

                categories = normalized_categories
                logger.info(f"Target categories for prospecting: {categories}")

                # Fetch active WhatsApp channel
                channel_id = self.get_active_whatsapp_channel(company['tenant_id'], company['id'])
                if not channel_id:
                    logger.warning("✗ No active WhatsApp channel found. Cannot create campaign.")
                    continue

                for cat in categories:
                    # support either simple string categories or dicts with explicit country
                    if isinstance(cat, dict):
                        category_name = cat.get('category') or cat.get('name') or ''
                        category_country = cat.get('country') or company.get('pais_nombre') or 'Colombia'
                    else:
                        category_name = str(cat)
                        category_country = company.get('pais_nombre') or 'Colombia'

                    logger.info(f"🎯 Processing category: '{category_name}' for product: {product.get('product_name')} (country: {category_country})")

                    # 1. Fetch leads
                    leads = self.prospector_service.fetch_leads_from_generator(
                        keyword=category_name,
                        country=category_country,
                        limit=5
                    )
                    if not leads:
                        logger.warning(f"No leads found for category {category_name}")
                        continue

                    # Phase 2: Qualification & Copywriting Crew
                    campaign_crew = build_campaign_crew(
                        company=company,
                        product=product,
                        leads=leads
                    )
                    campaign_result = campaign_crew.kickoff()
                    
                    campaign_raw = campaign_crew.tasks[1].output.raw.strip()
                    if campaign_raw.startswith("```json"):
                        campaign_raw = campaign_raw[7:]
                    if campaign_raw.endswith("```"):
                        campaign_raw = campaign_raw[:-3]
                    campaign_raw = campaign_raw.strip()

                    try:
                        campaign_json = json.loads(campaign_raw)
                        logger.info("✅ Campaign copywriting parsed as JSON!")
                    except Exception:
                        logger.warning(f"Campaign copywriting output is not valid JSON: {campaign_raw}")
                        continue

                    message_body = campaign_json.get("message")
                    if not message_body:
                        logger.warning("WhatsApp campaign message body is empty. Skipping.")
                        continue

                    # Extract qualified leads list from qualification task
                    qual_raw = campaign_crew.tasks[0].output.raw.strip()
                    if qual_raw.startswith("```json"):
                        qual_raw = qual_raw[7:]
                    if qual_raw.endswith("```"):
                        qual_raw = qual_raw[:-3]
                    qual_raw = qual_raw.strip()

                    try:
                        qualified_leads = json.loads(qual_raw)
                        if isinstance(qualified_leads, dict) and "qualified_leads" in qualified_leads:
                            qualified_leads = qualified_leads["qualified_leads"]
                    except Exception:
                        qualified_leads = leads

                    # 2. Get/create list & Link contacts
                    sending_list_id = self.get_or_create_sending_list(company['tenant_id'], company['id'], category_name)
                    contact_ids = self.save_qualified_leads_to_crm(company['tenant_id'], company['id'], sending_list_id, qualified_leads)
                    
                    if not contact_ids:
                        logger.warning("No new unique contacts saved for list. Skipping campaign.")
                        continue

                    # 3. Create Campaign and Schedule for 2 days (48 hours) later!
                    scheduled_at = datetime.now() + timedelta(days=2)
                    
                    campaign_id = self.create_campaign_in_db(
                        tenant_id=company['tenant_id'],
                        company_id=company['id'],
                        category_name=category,
                        sending_list_id=sending_list_id,
                        channel_id=channel_id,
                        message_body=message_body,
                        product_id=product.get('id'),
                        scheduled_at=scheduled_at
                    )

                    if campaign_id:
                        # 4. Schedule event in scheduler-service calendar
                        self.call_scheduler_service(
                            tenant_id=company['tenant_id'],
                            company_id=company['id'],
                            campaign_id=campaign_id,
                            campaign_name=f"{product.get('product_name')} - {category}",
                            scheduled_at=scheduled_at
                        )
                        
                        # 5. Redis sync context
                        self.sync_redis_campaign_context(
                            contact_ids=contact_ids,
                            campaign_id=campaign_id,
                            product_id=product.get('id'),
                            company_id=company['id']
                        )
                        logger.info(f"🎉 Fully completed autonomous workflow for product '{product.get('product_name')}' and category '{category}'!")
                    else:
                        logger.error("Failed to create campaign record.")or("Failed to create campaign record.")

