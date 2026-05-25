"""
Meta Ads Service - Integration with Meta Marketing API.

This service handles the complete flow of creating image ads on Meta platforms
(Facebook and Instagram) using the Meta Marketing API v18.0.

Flow:
1. Upload product image to Meta
2. Create Ad Creative with image and AI-generated copy
3. Create Campaign (PAUSED status for review)
4. Create Ad Set with targeting (Colombia)
5. Create Ad with the creative

Required Environment Variables:
- META_ACCESS_TOKEN: Meta API access token
- META_AD_ACCOUNT_ID: Ad account ID (format: act_XXXXXXXX)
- META_PAGE_ID: Facebook Page ID for the ad
"""

import time
import logging
import requests
from typing import Optional
from config import Config

logger = logging.getLogger(__name__)

# Meta Marketing API version
META_API_VERSION = "v18.0"
META_API_BASE_URL = f"https://graph.facebook.com/{META_API_VERSION}"


class MetaAdsException(Exception):
    """Raised when Meta Ads operations fail."""
    pass


class MetaAdsService:
    """
    Service responsible for creating and managing Meta Ads.
    
    Uses Meta Marketing API to:
    - Upload images
    - Create ad creatives
    - Create campaigns
    - Create ad sets with targeting
    - Create and publish ads
    """
    
    def __init__(self):
        self.access_token = Config.META_ACCESS_TOKEN
        self.ad_account_id = Config.META_AD_ACCOUNT_ID
        self.page_id = Config.META_PAGE_ID
        self.api_base = META_API_BASE_URL
        
        # Validate configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate that all required configuration is present."""
        if not self.access_token:
            raise MetaAdsException(
                "META_ACCESS_TOKEN is not configured. "
                "Please set it in your .env file."
            )
        if not self.ad_account_id:
            raise MetaAdsException(
                "META_AD_ACCOUNT_ID is not configured. "
                "Please set it in your .env file."
            )
        if not self.page_id:
            raise MetaAdsException(
                "META_PAGE_ID is not configured. "
                "Please set it in your .env file."
            )
        
        # Ensure ad_account_id has 'act_' prefix
        if not self.ad_account_id.startswith("act_"):
            self.ad_account_id = f"act_{self.ad_account_id}"
    
    def _make_request(self, method: str, endpoint: str, 
                      data: dict = None, 
                      files: dict = None,
                      max_retries: int = 3) -> dict:
        """
        Make a request to Meta Marketing API with retry logic.
        
        Args:
            method: HTTP method ('GET', 'POST', 'DELETE')
            endpoint: API endpoint (without base URL)
            data: Request data/payload
            files: Files to upload
            max_retries: Maximum number of retries for rate limits
            
        Returns:
            dict: API response data
            
        Raises:
            MetaAdsException: If request fails after all retries
        """
        url = f"{self.api_base}/{endpoint}"
        
        # Add access token to params
        params = {"access_token": self.access_token}
        
        for attempt in range(max_retries):
            try:
                if method.upper() == "POST":
                    if files:
                        response = requests.post(
                            url, 
                            data=data, 
                            files=files,
                            params=params,
                            timeout=60
                        )
                    else:
                        response = requests.post(
                            url, 
                            json=data, 
                            params=params,
                            timeout=60
                        )
                elif method.upper() == "GET":
                    response = requests.get(
                        url, 
                        params={**params, **(data or {})},
                        timeout=30
                    )
                else:
                    raise MetaAdsException(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                return response.json()
                
            except requests.HTTPError as e:
                error_data = {}
                try:
                    error_data = e.response.json()
                except:
                    pass
                
                error_message = error_data.get("error", {}).get("message", str(e))
                error_code = error_data.get("error", {}).get("code", 0)
                
                # Rate limit error (code 32 or 17) - retry with backoff
                if error_code in [17, 32] and attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 5
                    logger.warning(
                        f"Rate limited by Meta API. "
                        f"Retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})"
                    )
                    time.sleep(wait_time)
                    continue
                
                raise MetaAdsException(
                    f"Meta API error: {error_message} (code: {error_code})"
                )
                
            except requests.Timeout:
                if attempt < max_retries - 1:
                    logger.warning(f"Request timeout. Retrying...")
                    time.sleep(2)
                    continue
                raise MetaAdsException("Meta API request timed out")
                
            except requests.RequestException as e:
                raise MetaAdsException(f"Request failed: {str(e)}")
        
        raise MetaAdsException("Max retries exceeded")
    
    def upload_image(self, image_url: str) -> str:
        """
        Upload an image to Meta Ad Account.
        
        Args:
            image_url: URL of the image to upload
            
        Returns:
            str: Meta image hash for use in ad creative
            
        Raises:
            MetaAdsException: If image upload fails
        """
        logger.info(f"📤 Uploading image to Meta: {image_url}")
        
        # Download image first
        try:
            image_response = requests.get(image_url, timeout=30)
            image_response.raise_for_status()
        except requests.RequestException as e:
            raise MetaAdsException(f"Failed to download image from URL: {e}")
        
        # Upload to Meta
        endpoint = f"{self.ad_account_id}/adimages"
        files = {"file": ("image.jpg", image_response.content, "image/jpeg")}
        
        result = self._make_request("POST", endpoint, files=files)
        
        # Extract image hash
        images = result.get("images", {})
        if not images:
            raise MetaAdsException("No image hash returned from Meta")
        
        # Get the first (and usually only) image hash
        image_hash = list(images.values())[0].get("hash")
        if not image_hash:
            raise MetaAdsException("Failed to extract image hash from response")
        
        logger.info(f"✅ Image uploaded successfully. Hash: {image_hash}")
        return image_hash
    
    def create_ad_creative(self, name: str, image_hash: str, 
                          headline: str, primary_text: str,
                          description: str, cta: str,
                          website_url: str = None) -> str:
        """
        Create an Ad Creative with the uploaded image and ad copy.
        
        Args:
            name: Name for the creative
            image_hash: Meta image hash from upload_image()
            headline: Ad headline (max 40 characters)
            primary_text: Primary ad text (max 125 words recommended)
            description: Ad description (max 30 words recommended)
            cta: Call to action text
            website_url: Optional website URL for the ad
            
        Returns:
            str: Ad creative ID
            
        Raises:
            MetaAdsException: If creative creation fails
        """
        logger.info(f"🎨 Creating ad creative: {name}")
        
        # Build object story spec for image ad
        object_story_spec = {
            "page_id": self.page_id,
            "link_data": {
                "image_hash": image_hash,
                "message": primary_text,
                "name": headline,
                "description": description,
                "call_to_action": {
                    "type": cta.upper().replace(" ", "_"),
                    "value": {
                        "link": website_url or f"https://www.facebook.com/{self.page_id}"
                    }
                }
            }
        }
        
        # If no website URL, use a simpler format
        if not website_url:
            object_story_spec["link_data"]["link"] = f"https://www.facebook.com/{self.page_id}"
        
        endpoint = f"{self.ad_account_id}/adcreatives"
        data = {
            "name": name,
            "object_story_spec": str(object_story_spec),
            "degrees_of_freedom_spec": {
                "creative_features_spec": {
                    "standard_enhancements": {
                        "enroll_status": "OPT_IN"
                    }
                }
            }
        }
        
        result = self._make_request("POST", endpoint, data=data)
        creative_id = result.get("id")
        
        if not creative_id:
            raise MetaAdsException("Failed to create ad creative")
        
        logger.info(f"✅ Ad creative created: {creative_id}")
        return creative_id
    
    def create_campaign(self, name: str, objective: str = "OUTCOME_SALES") -> str:
        """
        Create a new campaign in PAUSED status.
        
        Args:
            name: Campaign name
            objective: Campaign objective (default: OUTCOME_SALES)
            
        Returns:
            str: Campaign ID
            
        Raises:
            MetaAdsException: If campaign creation fails
        """
        logger.info(f"📢 Creating campaign: {name}")
        
        endpoint = f"{self.ad_account_id}/campaigns"
        data = {
            "name": name,
            "objective": objective,
            "status": "PAUSED",  # Always start paused for review
            "special_ad_categories": [],  # No special ad categories
            "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
        }
        
        result = self._make_request("POST", endpoint, data=data)
        campaign_id = result.get("id")
        
        if not campaign_id:
            raise MetaAdsException("Failed to create campaign")
        
        logger.info(f"✅ Campaign created: {campaign_id}")
        return campaign_id
    
    def create_ad_set(self, name: str, campaign_id: str,
                     daily_budget: int = 5000,
                     billing_event: str = "IMPRESSIONS",
                     optimization_goal: str = "OFFSITE_CONVERSIONS") -> str:
        """
        Create an Ad Set with targeting for Colombia.
        
        Args:
            name: Ad set name
            campaign_id: Parent campaign ID
            daily_budget: Daily budget in cents (e.g., 5000 = $50.00 COP)
            billing_event: Billing event type
            optimization_goal: Optimization goal
            
        Returns:
            str: Ad set ID
            
        Raises:
            MetaAdsException: If ad set creation fails
        """
        logger.info(f"🎯 Creating ad set: {name}")
        
        endpoint = f"{self.ad_account_id}/adsets"
        data = {
            "name": name,
            "campaign_id": campaign_id,
            "daily_budget": daily_budget,
            "billing_event": billing_event,
            "optimization_goal": optimization_goal,
            "status": "PAUSED",
            "targeting": {
                "geo_locations": {
                    "countries": ["CO"],  # Colombia
                    "location_types": ["home", "recent"]
                },
                "publisher_platforms": ["facebook", "instagram"],
                "facebook_positions": ["feed", "instant_article", "marketplace", "story", "reels"],
                "instagram_positions": ["stream", "story", "explore", "reels"]
            },
            "promoted_object": {
                "page_id": self.page_id
            }
        }
        
        result = self._make_request("POST", endpoint, data=data)
        ad_set_id = result.get("id")
        
        if not ad_set_id:
            raise MetaAdsException("Failed to create ad set")
        
        logger.info(f"✅ Ad set created: {ad_set_id}")
        return ad_set_id
    
    def create_ad(self, name: str, ad_set_id: str, 
                 creative_id: str) -> str:
        """
        Create an Ad with the specified creative.
        
        Args:
            name: Ad name
            ad_set_id: Parent ad set ID
            creative_id: Ad creative ID
            
        Returns:
            str: Ad ID
            
        Raises:
            MetaAdsException: If ad creation fails
        """
        logger.info(f"🚀 Creating ad: {name}")
        
        endpoint = f"{self.ad_account_id}/ads"
        data = {
            "name": name,
            "adset_id": ad_set_id,
            "creative": {"creative_id": creative_id},
            "status": "PAUSED"
        }
        
        result = self._make_request("POST", endpoint, data=data)
        ad_id = result.get("id")
        
        if not ad_id:
            raise MetaAdsException("Failed to create ad")
        
        logger.info(f"✅ Ad created: {ad_id}")
        return ad_id
    
    def create_complete_ad(self, product: dict, ad_content: dict,
                          daily_budget_cop: int = 50000) -> dict:
        """
        Create a complete Meta ad from product and AI-generated content.
        
        This is the main method that orchestrates the full ad creation flow:
        1. Upload product image
        2. Create ad creative with AI copy
        3. Create campaign
        4. Create ad set with Colombia targeting
        5. Create ad
        
        Args:
            product: Product data dictionary with keys:
                - productName: str
                - image_url: str
                - description: str
            ad_content: AI-generated ad content with keys:
                - headline: str
                - primary_text: str
                - description: str
                - cta: str
            daily_budget_cop: Daily budget in Colombian Pesos
            
        Returns:
            dict: Created ad details with IDs:
                - campaign_id: str
                - ad_set_id: str
                - ad_id: str
                - creative_id: str
                - image_hash: str
                
        Raises:
            MetaAdsException: If any step fails
        """
        product_name = product.get("productName", "Producto")
        image_url = product.get("image_url", "")
        
        if not image_url:
            raise MetaAdsException("Product must have an image_url")
        
        # Convert budget from COP to cents (Meta uses cents)
        daily_budget_cents = int(daily_budget_cop * 100)
        
        # Step 1: Upload image
        image_hash = self.upload_image(image_url)
        
        # Step 2: Create ad creative
        creative_id = self.create_ad_creative(
            name=f"Ad Creative - {product_name}",
            image_hash=image_hash,
            headline=ad_content.get("headline", product_name),
            primary_text=ad_content.get("primary_text", ""),
            description=ad_content.get("description", ""),
            cta=ad_content.get("cta", "LEARN_MORE")
        )
        
        # Step 3: Create campaign
        campaign_id = self.create_campaign(
            name=f"Campaign - {product_name}"
        )
        
        # Step 4: Create ad set
        ad_set_id = self.create_ad_set(
            name=f"Ad Set - {product_name}",
            campaign_id=campaign_id,
            daily_budget=daily_budget_cents
        )
        
        # Step 5: Create ad
        ad_id = self.create_ad(
            name=f"Ad - {product_name}",
            ad_set_id=ad_set_id,
            creative_id=creative_id
        )
        
        result = {
            "campaign_id": campaign_id,
            "ad_set_id": ad_set_id,
            "ad_id": ad_id,
            "creative_id": creative_id,
            "image_hash": image_hash,
            "product_name": product_name,
            "daily_budget_cop": daily_budget_cop
        }
        
        logger.info(f"""
        ✅ Meta Ad created successfully!
        📊 Summary:
           - Product: {product_name}
           - Campaign ID: {campaign_id}
           - Ad Set ID: {ad_set_id}
           - Ad ID: {ad_id}
           - Creative ID: {creative_id}
           - Daily Budget: ${daily_budget_cop:,} COP
        """)
        
        return result
    
    def get_ad_status(self, ad_id: str) -> dict:
        """
        Get the current status of an ad.
        
        Args:
            ad_id: Ad ID to check
            
        Returns:
            dict: Ad status information
        """
        endpoint = f"{ad_id}"
        data = {
            "fields": "id,name,status,effective_status,created_time,updated_time"
        }
        
        return self._make_request("GET", endpoint, data=data)
    
    def activate_ad(self, ad_id: str) -> bool:
        """
        Activate a paused ad.
        
        Args:
            ad_id: Ad ID to activate
            
        Returns:
            bool: True if successful
        """
        logger.info(f"▶️ Activating ad: {ad_id}")
        
        endpoint = f"{ad_id}"
        data = {"status": "ACTIVE"}
        
        result = self._make_request("POST", endpoint, data=data)
        return result.get("success", False)
    
    def pause_ad(self, ad_id: str) -> bool:
        """
        Pause an active ad.
        
        Args:
            ad_id: Ad ID to pause
            
        Returns:
            bool: True if successful
        """
        logger.info(f"⏸️ Pausing ad: {ad_id}")
        
        endpoint = f"{ad_id}"
        data = {"status": "PAUSED"}
        
        result = self._make_request("POST", endpoint, data=data)
        return result.get("success", False)
