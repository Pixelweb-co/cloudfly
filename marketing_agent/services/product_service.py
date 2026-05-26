import os
import requests
import logging
from config import Config

logger = logging.getLogger(__name__)

class ProductService:
    """
    Service responsible for fetching and filtering products from the CloudFly backend API.
    
    Business Rules:
    - Only ACTIVE products are eligible for campaigns
    - Product must have a non-empty description
    - Product must have at least one valid image URL
    """
    
    def __init__(self):
        self.base_url = Config.BACKEND_URL
        api_key = Config.BACKEND_API_KEY or os.getenv("AUTHENTICATION_API_KEY", "")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def get_active_product_with_image(self, tenant_id: int) -> dict:
        """
        Fetches products from backend API and returns the first active product
        with a valid image and description.
        
        Args:
            tenant_id: The tenant ID to filter products by
            
        Returns:
            dict: Product data with image_url field added
            
        Raises:
            ProductNotFoundException: If no valid product is found
            requests.HTTPError: If API returns error status
            requests.Timeout: If request times out
        """
        url = f"{self.base_url}/productos/tenant/{tenant_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            products = data.get("data", [])
            
            for product in products:
                if self._is_valid_product(product):
                    # Get first image URL
                    images = product.get("images", [])
                    if images:
                        product["image_url"] = images[0].get("url")
                        return product
            
            raise ProductNotFoundException(
                f"No active product with image and description found for tenant {tenant_id}"
            )
            
        except requests.Timeout:
            raise ProductNotFoundException(
                f"Timeout fetching products for tenant {tenant_id}"
            )
        except requests.HTTPError as e:
            raise ProductNotFoundException(
                f"HTTP error fetching products: {e.response.status_code}"
            )
    
    def _is_valid_product(self, product: dict) -> bool:
        """
        Validates if a product meets all campaign criteria.
        
        Criteria:
        - status must be "ACTIVE"
        - description must be non-null and non-empty
        - imageIds must be non-null and non-empty
        """
        status = product.get("status")
        description = product.get("description")
        image_ids = product.get("imageIds")
        
        return (
            status in ("ACTIVE", "PUBLISHED") and
            description and
            description.strip() and
            image_ids and
            len(image_ids) > 0
        )


class ProductNotFoundException(Exception):
    """Raised when no valid product is found for campaign."""
    pass
