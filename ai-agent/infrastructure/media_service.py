import logging
import httpx
import os
import tempfile
from typing import Optional
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self, openai_client: AsyncOpenAI):
        self.openai = openai_client

    async def transcribe_audio(self, audio_url: str, tenant_id: int) -> Optional[str]:
        """
        Downloads audio from a URL and transcribes it using OpenAI Whisper.
        """
        logger.info(f"🎙️ [AI_AUDIO_STT] Starting transcription for URL: {audio_url}")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(audio_url, timeout=30.0)
                response.raise_for_status()
                audio_content = response.content

            # Whisper requires a file-like object with a name
            with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as tmp:
                tmp.write(audio_content)
                tmp_path = tmp.name

            try:
                with open(tmp_path, "rb") as audio_file:
                    transcript = await self.openai.audio.transcriptions.create(
                        model="whisper-1", 
                        file=audio_file,
                        language="es"  # Assuming Spanish for now
                    )
                
                logger.info(f"✅ [AI_AUDIO_STT] Transcription OK for tenant {tenant_id}")
                return transcript.text
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            logger.error(f"❌ [AI_AUDIO_STT] Error transcribing audio: {e}")
            return None

    async def analyze_image(self, image_url: str, tenant_id: int) -> Optional[str]:
        """
        Analyzes an image using GPT-4o-mini Vision.
        """
        logger.info(f"🖼️ [AI_VISION] Starting image analysis for URL: {image_url}")
        
        prompt = (
            "Describe la imagen, si es un comprobante de pago del pulguero virtual obten el numero, "
            "la fecha, codigo de comprobante, monto nombre a quien se envia. "
            "si no es comprobante de pago solo describe la imagen"
        )

        try:
            response = await self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url},
                            },
                        ],
                    }
                ],
                max_tokens=300,
            )
            
            description = response.choices[0].message.content
            logger.info(f"✅ [AI_VISION] Image analyzed for tenant {tenant_id}. Result: {description[:50]}...")
            return f"<image>\n{description}\n</image>"
        except Exception as e:
            logger.error(f"❌ [AI_VISION] Error analyzing image: {e}")
            return None

    async def generate_tts(self, text: str, tenant_id: int) -> Optional[str]:
        """
        Generates audio from text using ElevenLabs and returns the audio as base64.
        """
        logger.info(f"🎙️ [AI_AUDIO_TTS] Generating audio for tenant {tenant_id}")
        
        eleven_api_key = os.getenv("ELEVENLABS_API_KEY")
        voice_id = os.getenv("ELEVENLABS_VOICE_ID", "J4vZAFDEcpenkMp3f3R9") # Default voice from n8n

        if not eleven_api_key:
            logger.warning("⚠️ [AI_AUDIO_TTS] ElevenLabs API Key missing - skipping TTS")
            return None

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": eleven_api_key
        }
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers, timeout=60.0)
                response.raise_for_status()
                
                import base64
                audio_base64 = base64.b64encode(response.content).decode("utf-8")
                logger.info(f"✅ [AI_AUDIO_TTS] Audio generated OK (base64 size: {len(audio_base64)})")
                return audio_base64
        except Exception as e:
            logger.error(f"❌ [AI_AUDIO_TTS] Error generating TTS: {e}")
            return None
