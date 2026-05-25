import os

def hello():
    """Return the ticket key from environment or a default placeholder."""
    return os.getenv("CLOUD_TICKET_KEY", "CLOUD-100")
