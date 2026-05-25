import os
import httpx
import base64
from typing import Dict

OPENROUTER_URL = os.getenv(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1/chat/completions"
)
API_KEY = os.getenv("OPENROUTER_API_KEY")
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

PROMPT_TEMPLATE = """
Eres un creativo de marketing especializado en anuncios para Meta (Facebook/Instagram). 
Genera una imagen publicitaria en alta calidad que represente el siguiente producto.

Producto: {name}
Descripción: {description}
Características visuales clave: {visual_attrs}
Formato: 1080x1080 PNG.
Devuelve la imagen codificada en base64 sin ningún otro texto.
"""


def _build_prompt(product: Dict) -> str:
    return PROMPT_TEMPLATE.format(
        name=product["name"],
        description=product["description"],
        visual_attrs=product.get("visual_attrs", "colorido, moderno"),
    )

async def generate_image_ad(product: Dict) -> bytes:
    """
    Calls OpenRouter Nemotron‑3‑nano‑omni‑30b‑a3b‑reasoning to generate an image.
    Returns raw image bytes (PNG).
    """
    if not API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    payload = {
        "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        "messages": [{"role": "user", "content": _build_prompt(product)}],
        "max_tokens": 2048,
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(OPENROUTER_URL, json=payload, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()

    try:
        b64_image = data["choices"][0]["message"]["content"]
        return base64.b64decode(b64_image)
    except (KeyError, IndexError, ValueError) as exc:
        raise RuntimeError(f"Invalid OpenRouter response: {exc}") from exc
