"""Evolution Service

Provides methods to interact with the Evolution API (WhatsApp messaging).
Implements sending composing presence, text messages, and media messages.
"""

import time
import random
import logging
import requests
from config import Config

logger = logging.getLogger(__name__)


class EvolutionService:
    def __init__(self):
        self.api_url = Config.EVOLUTION_API_URL
        self.api_key = Config.EVOLUTION_API_KEY
        self.instance = Config.EVOLUTION_INSTANCE
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json",
        }

    def send_campaign(self, phone: str, message: "CampaignMessage") -> bool:
        """Send a campaign message (text or media) to a phone number.

        Replicates the exact flow used by the AI agent:
        1. Send composing presence.
        2. Random short delay.
        3. Send text or media payload.
        """
        try:
            self._send_presence(phone, "composing")
            # short random delay 1.5‑3.5 s
            time.sleep(1.5 + random.random() * 2.0)
            if getattr(message, "media_url", None):
                return self._send_media(phone, message)
            else:
                return self._send_text(phone, message.text)
        except Exception as exc:
            logger.error(f"Error sending campaign to {phone}: {exc}")
            return False

    def _send_presence(self, phone: str, presence: str):
        url = f"{self.api_url}/chat/updatePresence/{self.instance}"
        payload = {"number": phone, "presence": presence}
        try:
            requests.post(url, json=payload, headers=self.headers, timeout=10)
        except Exception as exc:
            logger.debug(f"Presence update failed (ignored): {exc}")

    def _send_text(self, phone: str, text: str) -> bool:
        url = f"{self.api_url}/message/sendText/{self.instance}"
        payload = {
            "number": phone,
            "text": text,
            "delay": 1200 + random.randint(0, 3000),
        }
        response = requests.post(url, json=payload, headers=self.headers, timeout=30)
        response.raise_for_status()
        logger.info(f"✅ Text sent to {phone}")
        return True

    def _send_media(self, phone: str, message: "CampaignMessage") -> bool:
        url = f"{self.api_url}/message/sendMedia/{self.instance}"
        payload = {
            "number": phone,
            "media": message.media_url,
            "mediatype": message.media_type or "image",
            "caption": message.caption or message.text,
            "delay": 1500 + random.randint(0, 3000),
        }
        response = requests.post(url, json=payload, headers=self.headers, timeout=30)
        response.raise_for_status()
        logger.info(f"✅ Media sent to {phone}")
        return True
