import time, random, logging, requests
from config import Config

logger = logging.getLogger(__name__)

class EvolutionService:
    def __init__(self):
        self.api_url = Config.EVOLUTION_API_URL
        self.api_key = Config.EVOLUTION_API_KEY
        self.instance = Config.EVOLUTION_INSTANCE
        self.headers = {"apikey": self.api_key, "Content-Type": "application/json"}

    def send_campaign(self, phone: str, message: 'CampaignMessage') -> bool:
        try:
            self._send_presence(phone, "composing")
            time.sleep(1.5 + random.random() * 2.0)
            if message.media_url:
                return self._send_media(phone, message)
            else:
                return self._send_text(phone, message.text)
        except Exception as e:
            logger.error(f"Error sending message to {phone}: {e}")
            return False

    def _send_presence(self, phone: str, presence: str):
        url = f"{self.api_url}/chat/updatePresence/{self.instance}"
        payload = {"number": phone, "presence": presence}
        try:
            requests.post(url, json=payload, headers=self.headers, timeout=10)
        except Exception:
            pass

    def _send_text(self, phone: str, text: str) -> bool:
        url = f"{self.api_url}/message/sendText/{self.instance}"
        payload = {"number": phone, "text": text, "delay": 1200 + random.randint(0, 3000)}
        resp = requests.post(url, json=payload, headers=self.headers, timeout=30)
        resp.raise_for_status()
        logger.info(f"✅ Text sent to {phone}")
        return True

    def _send_media(self, phone: str, message: 'CampaignMessage') -> bool:
        url = f"{self.api_url}/message/sendMedia/{self.instance}"
        payload = {
            "number": phone,
            "media": message.media_url,
            "mediatype": message.media_type or "image",
            "caption": message.caption or message.text,
            "delay": 1500 + random.randint(0, 3000),
        }
        resp = requests.post(url, json=payload, headers=self.headers, timeout=30)
        resp.raise_for_status()
        logger.info(f"✅ Media sent to {phone}")
        return True
