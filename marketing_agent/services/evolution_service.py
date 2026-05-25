import time
import random
import requests
import logging
from config import Config
from models.campaign import CampaignMessage

logger = logging.getLogger(__name__)

class EvolutionService:
    def __init__(self):
        self.api_url = Config.EVOLUTION_API_URL
        self.api_key = Config.EVOLUTION_API_KEY
        self.instance = Config.EVOLUTION_INSTANCE
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }
    
    def send_campaign(self, phone: str, message: CampaignMessage) -> bool:
        """
        Sends a campaign message to a phone number via Evolution API.
        Replicates the exact method used by the AI agent.
        """
        try:
            # 1. Send composing presence
            self._send_presence(phone, "composing")
            
            # 2. Random delay 1.5-3.5 seconds
            delay = 1.5 + random.random() * 2.0
            time.sleep(delay)
            
            # 3. Send text or media message
            if message.media_url:
                return self._send_media(phone, message)
            else:
                return self._send_text(phone, message.text)
                
        except Exception as e:
            logger.error(f"Error sending message to {phone}: {e}")
            return False
    
    def _send_presence(self, phone: str, presence: str):
        """Send composing/recording presence indicator"""
        url = f"{self.api_url}/chat/updatePresence/{self.instance}"
        payload = {"number": phone, "presence": presence}
        
        try:
            requests.post(url, json=payload, headers=self.headers, timeout=10)
        except Exception as e:
            logger.debug(f"Presence update skipped: {e}")
    
    def _send_text(self, phone: str, text: str) -> bool:
        """Send text message via Evolution API"""
        url = f"{self.api_url}/message/sendText/{self.instance}"
        payload = {
            "number": phone,
            "text": text,
            "delay": 1200 + random.randint(0, 3000)
        }
        
        response = requests.post(url, json=payload, headers=self.headers, timeout=30)
        response.raise_for_status()
        logger.info(f"✅ Text sent to {phone}")
        return True
    
    def _send_media(self, phone: str, message: CampaignMessage) -> bool:
        """Send media message via Evolution API"""
        url = f"{self.api_url}/message/sendMedia/{self.instance}"
        payload = {
            "number": phone,
            "media": message.media_url,
            "mediatype": message.media_type or "image",
            "caption": message.caption or message.text,
            "delay": 1500 + random.randint(0, 3000)
        }
        
        response = requests.post(url, json=payload, headers=self.headers, timeout=30)
        response.raise_for_status()
        logger.info(f"✅ Media sent to {phone}")
        return True
