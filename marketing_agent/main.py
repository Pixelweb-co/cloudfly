# Existing imports
import os
import time
import random
import logging
import mysql.connector
from config import Config
from services.product_service import ProductService, ProductNotFoundException
from services.campaign_service import CampaignService
from services.evolution_service import EvolutionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI for health endpoint
from fastapi import FastAPI
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

class MarketingAgent:
    def __init__(self):
        self.product_service = ProductService()
        self.campaign_service = CampaignService()
        self.evolution_service = EvolutionService()
        self.db_config = {
            "host": Config.DB_HOST,
            "port": Config.DB_PORT,
            "database": Config.DB_NAME,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD
        }
    
    def get_active_contacts(self, tenant_id: int, company_id: int) -> list:
        """Fetch active contacts from database"""
        conn = mysql.connector.connect(**self.db_config)
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT id, name, email, phone 
            FROM contacts 
            WHERE tenant_id = %s 
              AND company_id = %s 
              AND is_active = 1
        """
        cursor.execute(query, (tenant_id, company_id))
        contacts = cursor.fetchall()
        cursor.close()
        conn.close()
        return contacts
    
    def run(self):
        """Main execution loop"""
        logger.info("🚀 Marketing Agent started")
        try:
            # Step 1: Fetch active product with image
            logger.info(f"📦 Fetching active product for tenant {Config.TENANT_ID}...")
            product = self.product_service.get_active_product_with_image(Config.TENANT_ID)
            logger.info(f"✅ Product found: {product.get('productName')}")
            
            # Step 2: Build campaign message
            logger.info("📝 Building campaign message...")
            campaign_message = self.campaign_service.build_campaign_message(product)
            logger.info(f"✅ Campaign message built (media: {campaign_message.media_url is not None})")
            
            # Step 3: Fetch target contacts
            logger.info(f"👥 Fetching contacts for tenant {Config.TENANT_ID}...")
            contacts = self.get_active_contacts(Config.TENANT_ID, Config.COMPANY_ID)
            logger.info(f"✅ Found {len(contacts)} active contacts")
            
            if not contacts:
                logger.warning("⚠️ No contacts found. Exiting.")
                return
            
            sent = 0
            failed = 0
            for idx, contact in enumerate(contacts, 1):
                phone = contact.get("phone", "").replace("[^0-9]", "")
                if not phone:
                    logger.warning(f"⚠️ Skipping contact {contact.get('id')}: no phone")
                    failed += 1
                    continue
                logger.info(f"📤 [{idx}/{len(contacts)}] Sending to {phone}...")
                success = self.evolution_service.send_campaign(phone, campaign_message)
                if success:
                    sent += 1
                else:
                    failed += 1
                if idx < len(contacts):
                    delay = Config.MIN_DELAY_MS + random.randint(0, Config.MAX_DELAY_MS - Config.MIN_DELAY_MS)
                    if idx % Config.BATCH_SIZE == 0:
                        batch_pause = Config.BATCH_PAUSE_MS + random.randint(0, 15000)
                        logger.info(f"⏸️ Anti‑spam batch pause: {batch_pause/1000}s")
                        delay += batch_pause
                    logger.info(f"⏳ Waiting {delay/1000}s before next message...")
                    time.sleep(delay / 1000)
            logger.info(f"""
            ✅ Campaign completed!
            📊 Summary:
               - Product: {product.get('productName')}
               - Total contacts: {len(contacts)}
               - Sent: {sent}
               - Failed: {failed}
            """)
        except ProductNotFoundException as e:
            logger.error(f"❌ Product error: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}", exc_info=True)

if __name__ == "__main__":
    agent = MarketingAgent()
    agent.run()
