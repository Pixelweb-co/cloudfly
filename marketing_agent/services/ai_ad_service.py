import json
import requests
import logging
from config import Config

logger = logging.getLogger(__name__)

class AIAdService:
    """
    Service responsible for generating marketing ad copy using OpenRouter API.
    
    Uses NVIDIA Nemotron model to generate structured ad content for Meta platforms.
    """
    
    def __init__(self):
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.api_key = Config.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def generate_ad(self, product: dict) -> dict:
        """
        Generate marketing ad copy for a product.
        
        Args:
            product: Dictionary containing product information with keys:
                - productName: str
                - description: str
                - price: float/int
                - salePrice: float/int (optional)
                
        Returns:
            dict: Structured ad content with keys:
                - headline: str
                - primary_text: str
                - description: str
                - cta: str
                
        Raises:
            AIAdGenerationException: If ad generation fails
        """
        prompt = self._build_prompt(product)
        
        payload = {
            "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "messages": [
                {
                    "role": "system",
                    "content": "Eres un experto en marketing digital para Meta (Facebook e Instagram). Genera contenido publicitario persuasivo y atractivo en español colombiano. Responde SOLO con un JSON válido."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        try:
            response = requests.post(
                self.api_url,
                json=payload,
                headers=self.headers,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse JSON response
            ad_content = json.loads(content)
            
            # Validate required fields
            required_fields = ["headline", "primary_text", "description", "cta"]
            for field in required_fields:
                if field not in ad_content:
                    raise AIAdGenerationException(f"Missing required field: {field}")
            
            logger.info(f"✅ Ad generated for product: {product.get('productName')}")
            return ad_content
            
        except requests.Timeout:
            raise AIAdGenerationException("Timeout generating ad with OpenRouter API")
        except requests.HTTPError as e:
            raise AIAdGenerationException(f"HTTP error from OpenRouter API: {e.response.status_code}")
        except json.JSONDecodeError as e:
            raise AIAdGenerationException(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise AIAdGenerationException(f"Unexpected error generating ad: {e}")
    
    def _build_prompt(self, product: dict) -> str:
        """Build the prompt for the AI model."""
        name = product.get("productName", "Producto")
        description = product.get("description", "")
        price = product.get("salePrice") or product.get("price", 0)
        
        # Format price in Colombian Pesos
        formatted_price = f"{int(price):,}".replace(",", ".")
        
        return f"""Genera un anuncio de marketing para Meta (Facebook/Instagram) para el siguiente producto:

Nombre: {name}
Descripción: {description}
Precio: ${formatted_price} COP

Genera un JSON con la siguiente estructura:
{{
    "headline": "Un titular llamativo y corto (máximo 40 caracteres)",
    "primary_text": "Texto principal del anuncio que destaque los beneficios y genere interés (máximo 125 palabras)",
    "description": "Descripción breve del producto para el anuncio (máximo 30 palabras)",
    "cta": "Llamada a la acción (ej: Comprar ahora, Más información, Contáctanos)"
}}

El tono debe ser persuasivo, profesional y adaptado al mercado colombiano."""


class AIAdGenerationException(Exception):
    """Raised when AI ad generation fails."""
    pass
