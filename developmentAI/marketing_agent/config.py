"""
Configuration management for Marketing Agent microservice.
Loads settings from environment variables with sensible defaults.
"""

import os
import logging
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

logger = logging.getLogger(__name__)


class Config:
    """
    Central configuration class for the Marketing Agent.
    All settings are loaded from environment variables with fallback defaults.
    """

    # ── Backend API ────────────────────────────────────────────────
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://backend:8080")
    BACKEND_API_KEY: str = os.getenv("BACKEND_API_KEY", "")

    # ── Evolution API (WhatsApp) ────────────────────────────────────
    EVOLUTION_API_URL: str = os.getenv("EVOLUTION_API_URL", "http://evolution-api:8080")
    EVOLUTION_API_KEY: str = os.getenv("EVOLUTION_API_KEY", "")
    EVOLUTION_INSTANCE: str = os.getenv("EVOLUTION_INSTANCE", "cloudfly-main")

    # ── Database (MySQL) ────────────────────────────────────────────
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "cloud_master")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # ── Campaign Settings ───────────────────────────────────────────
    TENANT_ID: int = int(os.getenv("TENANT_ID", "1"))
    COMPANY_ID: int = int(os.getenv("COMPANY_ID", "1"))

    # ── Anti-spam Settings (milliseconds) ───────────────────────────
    MIN_DELAY_MS: int = int(os.getenv("MIN_DELAY_MS", "3000"))
    MAX_DELAY_MS: int = int(os.getenv("MAX_DELAY_MS", "12000"))
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "20"))
    BATCH_PAUSE_MS: int = int(os.getenv("BATCH_PAUSE_MS", "30000"))

    # ── Logging ─────────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def validate(cls) -> None:
        """Validate that required configuration values are present."""
        required = {
            "BACKEND_URL": cls.BACKEND_URL,
            "EVOLUTION_API_URL": cls.EVOLUTION_API_URL,
            "EVOLUTION_API_KEY": cls.EVOLUTION_API_KEY,
            "DB_HOST": cls.DB_HOST,
            "DB_NAME": cls.DB_NAME,
        }
        missing = [k for k, v in required.items() if not v]
        if missing:
            raise ValueError(
                f"Missing required configuration keys: {', '.join(missing)}"
            )
        logger.info("✅ Configuration validated successfully")

    @classmethod
    def summary(cls) -> str:
        """Return a human-readable summary of the current config (secrets masked)."""
        return (
            f"BACKEND_URL={cls.BACKEND_URL}\n"
            f"EVOLUTION_API_URL={cls.EVOLUTION_API_URL}\n"
            f"EVOLUTION_API_KEY={'***' if cls.EVOLUTION_API_KEY else '(not set)'}\n"
            f"EVOLUTION_INSTANCE={cls.EVOLUTION_INSTANCE}\n"
            f"DB_HOST={cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}\n"
            f"TENANT_ID={cls.TENANT_ID}, COMPANY_ID={cls.COMPANY_ID}\n"
            f"Anti-spam: delay {cls.MIN_DELAY_MS}-{cls.MAX_DELAY_MS}ms, "
            f"batch {cls.BATCH_SIZE}, pause {cls.BATCH_PAUSE_MS}ms"
        )
