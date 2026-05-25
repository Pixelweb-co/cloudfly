import time
import random
import logging
import mysql.connector
from config import Config
from services.product_service import ProductService, ProductNotFoundException
from services.campaign_service import CampaignService
from services.evolution_service import EvolutionService
from services.ai_ad_service import AIAdService, AIAdGenerationException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

class MarketingAgent:
    """
    Main orchestrator for the marketing campaign execution.
    
    Coordinates the following flow:
    1. Fetch active product with image from backend API
    2. Build campaign message from product data
    3. (Optional) Generate AI ad copy
    4. Fetch target contacts from database
    5. Send campaign to each contact with anti-spam measures
    """
    
    def __init__(self):
        self.product_service = ProductService()
        self.campaign_service = CampaignService()
        self.evolution_service = EvolutionService()
        self.ai_ad_service = AIAdService()
        self.db_config = {
            "host": Config.DB_HOST,
            "port": Config.DB_PORT,
            "database": Config.DB_NAME,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD
        }
    
    def get_active_contacts(self, tenant_id: int, company_id: int) -> list:
        """
        Fetch active contacts from database.
        
        Args:
            tenant_id: The tenant ID to filter by
            company_id: The company ID to filter by
            
        Returns:
            list: List of contact dictionaries with id, name, email, phone
        """
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
    
    def generate_ai_ad(self, product: dict) -> dict:
        """
        Generate AI-powered ad copy for the product.
        
        Args:
            product: Product data dictionary
            
        Returns:
            dict: Structured ad content with headline, primary_text, description, cta
        """
        try:
            logger.info("🤖 Generating AI ad copy...")
            ad_content = self.ai_ad_service.generate_ad(product)
            logger.info(f"✅ AI ad generated: {ad_content.get('headline', 'N/A')}")
            return ad_content
        except AIAdGenerationException as e:
            logger.warning(f"⚠️ AI ad generation failed: {e}")
            return None
    
    def run(self, generate_ad: bool = False):
        """
        Main execution loop for the marketing campaign.
        
        Args:
            generate_ad: Whether to generate AI ad copy before sending
        """
        logger.info("🚀 Marketing Agent started")
        
        try:
            # Step 1: Fetch active product with image
            logger.info(f"📦 Fetching active product for tenant {Config.TENANT_ID}...")
            product = self.product_service.get_active_product_with_image(Config.TENANT_ID)
            logger.info(f"✅ Product found: {product.get('productName')}")
            
            # Step 2: Build campaign message
            logger.info("📝 Building campaign message...")
            campaign_message = self.campaign_service.build_campaign_message(product)
            logger.info(f"✅ Campaign message built (media: {campaign_message.has_media()})")
            
            # Step 3 (Optional): Generate AI ad
            ai_ad = None
            if generate_ad:
                ai_ad = self.generate_ai_ad(product)
                if ai_ad:
                    logger.info(f"📢 AI Ad Headline: {ai_ad.get('headline')}")
            
            # Step 4: Fetch target contacts
            logger.info(f"👥 Fetching contacts for tenant {Config.TENANT_ID}...")
            contacts = self.get_active_contacts(Config.TENANT_ID, Config.COMPANY_ID)
            logger.info(f"✅ Found {len(contacts)} active contacts")
            
            if not contacts:
                logger.warning("⚠️ No contacts found. Exiting.")
                return
            
            # Step 5: Send campaign to each contact
            sent = 0
            failed = 0
            
            for idx, contact in enumerate(contacts, 1):
                phone = contact.get("phone", "")
                
                # Clean phone number - remove non-digit characters
                phone = ''.join(filter(str.isdigit, phone))
                
                if not phone:
                    logger.warning(f"⚠️ Skipping contact {contact.get('id')}: no phone")
                    failed += 1
                    continue
                
                logger.info(f"📤 [{idx}/{len(contacts)}] Sending to {phone}...")
                
                # Send message
                success = self.evolution_service.send_campaign(phone, campaign_message)
                
                if success:
                    sent += 1
                else:
                    failed += 1
                
                # Anti-spam: Random delay between messages
                if idx < len(contacts):
                    delay = Config.MIN_DELAY_MS + random.randint(0, Config.MAX_DELAY_MS - Config.MIN_DELAY_MS)
                    
                    # Longer pause every BATCH_SIZE messages
                    if idx % Config.BATCH_SIZE == 0:
                        batch_pause = Config.BATCH_PAUSE_MS + random.randint(0, 15000)
                        logger.info(f"⏸️ Anti-spam batch pause: {batch_pause/1000}s")
                        delay += batch_pause
                    
                    logger.info(f"⏳ Waiting {delay/1000}s before next message...")
                    time.sleep(delay / 1000)
            
            # Summary
            logger.info(f"""
            ✅ Campaign completed!
            📊 Summary:
               - Product: {product.get('productName')}
               - Total contacts: {len(contacts)}
               - Sent: {sent}
               - Failed: {failed}
            """)
            
            # Log AI ad if generated
            if ai_ad:
                logger.info(f"🤖 AI Ad Content:")
                logger.info(f"   Headline: {ai_ad.get('headline')}")
                logger.info(f"   CTA: {ai_ad.get('cta')}")
            
        except ProductNotFoundException as e:
            logger.error(f"❌ Product error: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}", exc_info=True)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Marketing Agent - CloudFly")
    parser.add_argument(
        "--generate-ad",
        action="store_true",
        help="Generate AI ad copy before sending campaign"
    )
    
    args = parser.parse_args()
    
    agent = MarketingAgent()
    agent.run(generate_ad=args.generate_ad)
