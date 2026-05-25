import logging
from models.campaign import CampaignMessage

logger = logging.getLogger(__name__)

class CampaignService:
    def build_campaign_message(self, product: dict) -> CampaignMessage:
        """
        Structures a marketing campaign message using product data.
        """
        name = product.get("productName", "Producto")
        description = product.get("description", "")
        price = product.get("salePrice") or product.get("price", 0)
        image_url = product.get("image_url", "")
        
        # Format price in Colombian Pesos
        formatted_price = f"{price:,.0f}".replace(",", ".")
        
        text = f"""🎉 ¡Nuevo Producto Disponible!

📦 *{name}*

{description}

💰 Precio: ${formatted_price}
🖼️ Imagen: {image_url}

¡Contáctanos para más información!
"""
        
        return CampaignMessage(
            text=text,
            media_url=image_url if image_url else None,
            media_type="image" if image_url else None,
            caption=text if image_url else None
        )
