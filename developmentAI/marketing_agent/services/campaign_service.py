"""
Campaign Service — structures marketing campaign messages using product data.

Creates formatted WhatsApp messages with:
- Product name (bold)
- Product description
- Price in Colombian Peso format
- Image URL (if available)
- Call to action
"""

import logging
from models.campaign import CampaignMessage

logger = logging.getLogger(__name__)


class CampaignService:
    """
    Service responsible for building marketing campaign messages using product data.
    """

    def build_campaign_message(self, product: dict) -> CampaignMessage:
        """
        Structures a marketing campaign message using product data.

        Args:
            product: Dictionary containing product information with keys:
                - productName: str
                - description: str
                - price: float/int
                - salePrice: float/int (optional)
                - image_url: str (optional)

        Returns:
            CampaignMessage object with text, media_url, media_type, and caption
        """
        name = product.get("productName", "Producto")
        description = product.get("description", "")
        price = product.get("salePrice") or product.get("price", 0)
        image_url = product.get("image_url", "")

        # Format price in Colombian Pesos (e.g., 100000 -> $100.000)
        formatted_price = self._format_colombian_peso(price)

        # Build message text
        text = self._build_message_text(name, description, formatted_price, image_url)

        logger.info(f"📝 Campaign message built for product: {name}")

        return CampaignMessage(
            text=text,
            media_url=image_url if image_url else None,
            media_type="image" if image_url else None,
            caption=text if image_url else None,
        )

    def _format_colombian_peso(self, price: float) -> str:
        """
        Format price in Colombian Peso format.

        Examples:
            100000 -> $100.000
            99999 -> $99.999
            1000000 -> $1.000.000
            0 -> $0
        """
        try:
            formatted = f"{int(price):,}".replace(",", ".")
            return f"${formatted}"
        except (ValueError, TypeError):
            return "$0"

    def _build_message_text(self, name: str, description: str,
                            formatted_price: str, image_url: str) -> str:
        """
        Build the formatted message text for WhatsApp.

        Uses WhatsApp Markdown formatting:
        - *text* for bold
        - _text_ for italic
        """
        lines = [
            "🎉 ¡Nuevo Producto Disponible!",
            "",
            f"📦 *{name}*",
            "",
            description,
            "",
            f"💰 Precio: {formatted_price}",
        ]

        if image_url:
            lines.append(f"🖼️ Imagen: {image_url}")

        lines.extend([
            "",
            "¡Contáctanos para más información!"
        ])

        return "\n".join(lines)
