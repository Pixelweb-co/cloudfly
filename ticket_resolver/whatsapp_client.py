import os
import logging
import requests
from typing import Dict

log = logging.getLogger(__name__)

class WhatsAppClient:
    """Thin wrapper around Twilio/WhatsApp API."""
    BASE_URL = "https://api.twilio.com/2010-04-01/Accounts"

    def __init__(self) -> None:
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("WHATSAPP_API_TOKEN")
        self.sender = os.getenv("WHATSAPP_SENDER_NUMBER")
        if not all([self.account_sid, self.auth_token, self.sender]):
            raise EnvironmentError("Missing required WhatsApp env vars")

    def _request(self, to: str, body: str) -> Dict:
        url = f"{self.BASE_URL}/{self.account_sid}/Messages.json"
        data = {
            "From": f"whatsapp:{self.sender}",
            "To": f"whatsapp:{to}",
            "Body": body,
        }
        response = requests.post(url, data=data, auth=(self.account_sid, self.auth_token))
        response.raise_for_status()
        return response.json()

    def send_message(self, to: str, body: str) -> bool:
        try:
            self._request(to, body)
            log.info("WhatsApp message sent to %s", to)
            return True
        except Exception as exc:
            log.exception("WhatsApp send failure: %s", exc)
            return False
