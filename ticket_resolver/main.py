# ticket_resolver/main.py
from fastapi import FastAPI
from api import router as api_router
import logging

log = logging.getLogger(__name__)

app = FastAPI(title="Ticket Resolver Service")
app.include_router(api_router)

# --- Event Bus placeholder (simplified) ---
# In the existing codebase there is an event system used for ticket creation.
# We'll mimic that pattern for transfer creation.

class SimpleEventBus:
    def __init__(self):
        self._subscribers = {}

    def subscribe(self, event_name: str, handler):
        self._subscribers.setdefault(event_name, []).append(handler)
        log.debug("Subscribed %s to %s", handler.__name__, event_name)

    def publish(self, event_name: str, *args, **kwargs):
        for handler in self._subscribers.get(event_name, []):
            try:
                handler(*args, **kwargs)
            except Exception as exc:
                log.exception("Error in event handler %s for %s: %s", handler.__name__, event_name, exc)

# Global event bus instance used by the application
event_bus = SimpleEventBus()

# Import the notification function
from api import send_whatsapp_transfer_notification

def on_transfer_created(transfer_id: str) -> None:
    """Hook called after a transfer record is committed."""
    if not send_whatsapp_transfer_notification(transfer_id):
        log.warning("WhatsApp notification failed for transfer %s", transfer_id)

# Register the hook – the same way other services register their listeners
event_bus.subscribe("transfer_created", on_transfer_created)
