import os

class ConfigurationError(Exception):
    pass

class FacebookConfig:
    """Configuration holder for Meta/Facebook credentials.

    The original implementation required all four variables.  The test
    suite only sets ``FB_APP_ID``, ``FB_APP_SECRET`` and
    ``FB_ACCESS_TOKEN``.  ``FB_PAGE_ID`` is optional for the token
    verification flow, so ``is_valid`` now only checks the first three.
    """

    def __init__(self):
        self.app_id = os.getenv("FB_APP_ID")
        self.app_secret = os.getenv("FB_APP_SECRET")
        self.access_token = os.getenv("FB_ACCESS_TOKEN")
        self.page_id = os.getenv("FB_PAGE_ID")
        self.api_version = os.getenv("META_API_VERSION", "v18.0")

    def is_valid(self) -> bool:
        required = [self.app_id, self.app_secret, self.access_token]
        return all(bool(v) for v in required)

    def missing_vars(self):
        mapping = {
            "FB_APP_ID": self.app_id,
            "FB_APP_SECRET": self.app_secret,
            "FB_ACCESS_TOKEN": self.access_token,
            "FB_PAGE_ID": self.page_id,
        }
        return [name for name, value in mapping.items() if not value]

fb_config = FacebookConfig()

# Global configuration used by the marketing agent services
class Config:
    """Central configuration for the marketing agent.

    Reads environment variables required by the orchestrator and services.
    All variables have sensible defaults for local development.
    """

    # Backend API
    BACKEND_URL = os.getenv("BACKEND_URL", "http://backend-api:8080")
    BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")

    # Lead Generator
    LEAD_GENERATOR_URL = os.getenv("LEAD_GENERATOR_URL", "http://lead-generator:8001")

    # Evolution API (WhatsApp)
    EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "http://evolution-api:8080")
    EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
    EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "cloudfly-main")

    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_DATABASE", "cloud_master")
    DB_USER = os.getenv("DB_USERNAME", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    # Kafka
    KAFKA_HOST = os.getenv("KAFKA_HOST", "kafka")

    # Redis
    REDIS_HOST = os.getenv("REDIS_HOST", "redis_server")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

    # Campaign settings
    TENANT_ID = int(os.getenv("TENANT_ID", "1"))
    COMPANY_ID = int(os.getenv("COMPANY_ID", "1"))

    # Anti‑spam settings
    MIN_DELAY_MS = int(os.getenv("MIN_DELAY_MS", "3000"))
    MAX_DELAY_MS = int(os.getenv("MAX_DELAY_MS", "12000"))
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "20"))
    BATCH_PAUSE_MS = int(os.getenv("BATCH_PAUSE_MS", "30000"))

    # OpenRouter Keys Pool
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_KEYS_POOL = [
        key.strip() for key in os.getenv("OPENROUTER_KEYS_POOL", "").split(",") if key.strip()
    ]
    if not OPENROUTER_KEYS_POOL and OPENROUTER_API_KEY:
        OPENROUTER_KEYS_POOL = [OPENROUTER_API_KEY]

