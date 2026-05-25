"""
Campaign Service — structures marketing campaign messages using product data.

Replicates the message formatting approach used by the marketing-worker
MessageFormatterService, adapted for the Python microservice.
"""

import logging
from models.campaign import CampaignMessage

logger = logging.getLogger(__name__)


class CampaignService:
    """
    Builds structured marketing campaign messages from product data.
    """

    def build_campaign_message(self, product: dict) -> CampaignMessage:
        """
        Creates a WhatsApp-ready campaign message from a product dict.

        Expected product fields:
            - productName (str)
            - description (str)
            - price (numeric)
            - salePrice (numeric, optional)
            - image_url (str, optional)

        Returns:
            CampaignMessage with text, media_url, media_type, and caption.
        """
        name = product.get("productName", "Producto")
        description = product.get("description", "")
        price = product.get("salePrice") or product.get("price", 0)
        image_url = product.get("image_url", "")

        # Format price in Colombian Pesos (e.g. 1.234.567)
        try:
            formatted_price = f"{int(price):,}".replace(",", ".")
        except (ValueError, TypeError):
            formatted_price = str(price)

        # Build WhatsApp markdown message
        text = (
            f"🎉 ¡Nuevo Producto Disponible!\n\n"
            f"📦 *{name}*\n\n"
            f"{description}\n\n"
            f"💰 Precio: ${formatted_price}\n"
        )

        if image_url:
            text += f"🖼️ Imagen: {image_url}\n"

        text += "\n¡Contáctanos para más información!"

        logger.info(f"📝 Campaign message built for product: {name}")

        return CampaignMessage(
            text=text,
            media_url=image_url if image_url else None,
            media_type="image" if image_url else None,
            caption=text if image_url else None,
        )
