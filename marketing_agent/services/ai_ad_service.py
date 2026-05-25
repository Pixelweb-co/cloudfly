import os
import httpx
import base64
import json
import logging
import requests
from typing import Dict
from config import Config

logger = logging.getLogger(__name__)

OPENROUTER_URL = os.getenv(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1/chat/completions"
)

PROMPT_TEMPLATE = """
Eres un creativo de marketing especializado en anuncios para Meta (Facebook/Instagram). 
Genera una imagen publicitaria en alta calidad que represente el siguiente producto.

Producto: {name}
Descripción: {description}
Características visuales clave: {visual_attrs}
Formato: 1080x1080 PNG.
Devuelve la imagen codificada en base64 sin ningún otro texto.
"""

_current_key_idx = 0

def _get_api_key(rotate: bool = False) -> str:
    """Gets the active API key from the pool, rotating if requested."""
    global _current_key_idx
    pool = Config.OPENROUTER_KEYS_POOL
    if not pool:
        # Fallback to Config.OPENROUTER_API_KEY, or os.getenv, or a dummy key for testing
        return Config.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY") or "dummy_key"
    
    if rotate:
        _current_key_idx = (_current_key_idx + 1) % len(pool)
        logger.warning(f"🔄 Rotating to next API key in pool (index {_current_key_idx})")
        
    return pool[_current_key_idx]

def _build_prompt(product: Dict) -> str:
    return PROMPT_TEMPLATE.format(
        name=product.get("name", product.get("productName", "Producto")),
        description=product.get("description", ""),
        visual_attrs=product.get("visual_attrs", "colorido, moderno"),
    )

async def generate_image_ad(product: Dict) -> bytes:
    """
    Call OpenRouter to generate an image and return raw PNG bytes.
    Retries up to 6 times rotating keys on 429 rate limit or timeout errors.
    """
    max_retries = 6
    for attempt in range(1, max_retries + 1):
        api_key = _get_api_key(rotate=(attempt > 1))
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            "messages": [{"role": "user", "content": _build_prompt(product)}],
            "max_tokens": 2048,
            "temperature": 0.7,
        }
        
        try:
            logger.info(f"Generating image ad (Attempt {attempt}/{max_retries}) using key ...{api_key[-8:] if api_key else 'None'}")
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                
            b64_image = data["choices"][0]["message"]["content"]
            return base64.b64decode(b64_image.strip())
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.warning(f"⚠️ Attempt {attempt}/{max_retries} failed with error: {exc}")
            if attempt == max_retries:
                raise RuntimeError(f"All {max_retries} image generation attempts failed: {exc}") from exc
        except (KeyError, IndexError, ValueError) as exc:
            logger.error(f"❌ Failed to parse response on attempt {attempt}: {exc}")
            if attempt == max_retries:
                raise RuntimeError(f"Invalid OpenRouter response: {exc}") from exc


class AIAdService:
    """
    Service responsible for generating marketing ad copy using OpenRouter API.
    
    Uses NVIDIA Nemotron model to generate structured ad content for Meta platforms.
    """
    
    def __init__(self):
        self.api_url = OPENROUTER_URL
        self.api_key = Config.OPENROUTER_API_KEY or "dummy_key"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
    def generate_ad(self, product: dict) -> dict:
        """
        Generate marketing ad copy for a product.
        Retries up to 6 times rotating keys on 429 rate limit or timeout errors.
        """
        prompt = self._build_prompt(product)
        max_retries = 6
        
        for attempt in range(1, max_retries + 1):
            api_key = _get_api_key(rotate=(attempt > 1))
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
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
                logger.info(f"Generating text ad copy (Attempt {attempt}/{max_retries}) using key ...{api_key[-8:] if api_key else 'None'}")
                response = requests.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
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
                
            except requests.Timeout as e:
                logger.warning(f"⚠️ Attempt {attempt}/{max_retries} failed with error: {e}")
                if attempt == max_retries:
                    raise AIAdGenerationException(f"Timeout generating ad with OpenRouter API: {e}") from e
            except requests.HTTPError as e:
                logger.warning(f"⚠️ Attempt {attempt}/{max_retries} failed with error: {e}")
                if attempt == max_retries:
                    status_code = getattr(getattr(e, "response", None), "status_code", "Unknown")
                    raise AIAdGenerationException(f"HTTP error from OpenRouter API: {status_code}") from e
            except requests.RequestException as e:
                logger.warning(f"⚠️ Attempt {attempt}/{max_retries} failed with error: {e}")
                if attempt == max_retries:
                    raise AIAdGenerationException(f"All {max_retries} ad generation attempts failed: {e}") from e
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse response as JSON on attempt {attempt}: {e}")
                if attempt == max_retries:
                    raise AIAdGenerationException(f"Failed to parse AI response as JSON: {e}") from e
            except AIAdGenerationException as e:
                logger.error(f"❌ Validation error on attempt {attempt}: {e}")
                if attempt == max_retries:
                    raise
                    
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
