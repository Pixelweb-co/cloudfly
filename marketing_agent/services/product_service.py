import requests
import logging
from config import Config
from models.campaign import CampaignMessage

logger = logging.getLogger(__name__)

class ProductService:
    def __init__(self):
        self.base_url = Config.BACKEND_URL
        self.headers = {
            "Authorization": f"Bearer {Config.BACKEND_API_KEY}",
            "Content-Type": "application/json"
        }
    
    def get_active_product_with_image(self, tenant_id: int) -> dict:
        """
        Fetches products from backend API and returns the first active product
        with a valid image and description.
        """
        url = f"{self.base_url}/productos/tenant/{tenant_id}"
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching products: {e}")
            raise ProductNotFoundException(f"Failed to fetch products: {e}")
        
        data = response.json()
        products = data.get("data", [])
        
        for product in products:
            if (product.get("status") == "ACTIVE" and 
                product.get("description") and 
                product.get("imageIds") and 
                len(product.get("imageIds", [])) > 0):
                
                # Get first image URL
                images = product.get("images", [])
                if images:
                    product["image_url"] = images[0].get("url")
                    return product
        
        raise ProductNotFoundException("No active product with image and description found")

class ProductNotFoundException(Exception):
    pass
