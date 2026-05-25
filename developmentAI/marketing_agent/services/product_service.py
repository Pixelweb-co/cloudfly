"""
Product Service — fetches active products with images from the Backend API.

This service replicates the integration pattern used by the AI agent
and marketing-worker to communicate with Cloudfly's backend.
"""

import logging
import requests
from config import Config

logger = logging.getLogger(__name__)


class ProductNotFoundException(Exception):
    """Raised when no active product with image and description is found."""
    pass


class ProductService:
    """
    Connects to the Cloudfly Backend API to retrieve product data.

    API Contract:
        GET {BACKEND_URL}/productos/tenant/{tenant_id}
        Headers: Authorization: Bearer {api_key}

    Filtering criteria:
        - status == "ACTIVE"
        - description is not null / not empty
        - imageIds array is non-empty
    """

    def __init__(self, backend_url: str = None, api_key: str = None):
        self.base_url = backend_url or Config.BACKEND_URL
        self.api_key = api_key or Config.BACKEND_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def get_active_product_with_image(self, tenant_id: int = None) -> dict:
        """
        Fetches products from the backend API and returns the first active
        product that has both a valid image and description.

        Args:
            tenant_id: The tenant/organization ID to filter products.

        Returns:
            dict: Product data including image_url field.

        Raises:
            ProductNotFoundException: If no matching product is found.
            requests.HTTPError: If the API returns an error status.
        """
        tenant_id = tenant_id or Config.TENANT_ID
        url = f"{self.base_url}/productos/tenant/{tenant_id}"

        logger.info(f"📦 Fetching products from: {url}")

        response = requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()

        data = response.json()
        products = data.get("data", [])
        logger.info(f"📦 Received {len(products)} products from API")

        for product in products:
            if self._is_valid_product(product):
                # Extract first image URL
                images = product.get("images", [])
                if images:
                    product["image_url"] = images[0].get("url", "")
                else:
                    product["image_url"] = None

                logger.info(
                    f"✅ Valid product found: {product.get('productName')} "
                    f"(id={product.get('id')}, images={len(images)})"
                )
                return product

        raise ProductNotFoundException(
            f"No active product with image and description found for tenant {tenant_id}"
        )

    @staticmethod
    def _is_valid_product(product: dict) -> bool:
        """
        Check if a product meets the criteria:
        - status is "ACTIVE"
        - description is not null/empty
        - imageIds array is non-empty
        """
        status = product.get("status", "")
        description = product.get("description", "")
        image_ids = product.get("imageIds", [])

        is_active = status == "ACTIVE"
        has_description = description is not None and len(str(description).strip()) > 0
        has_images = image_ids is not None and len(image_ids) > 0

        return is_active and has_description and has_images
