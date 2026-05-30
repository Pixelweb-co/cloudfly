"""
config/settings.py

Central configuration loader for ia_marketing_operation module.
Loads environment variables from .env file and provides typed access.
"""

import os
from dotenv import load_dotenv

# Load .env from the module directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


class Settings:
    """Application settings loaded from environment variables."""

    # MySQL Configuration
    DB_HOST = os.getenv("DB_HOST", "mysql")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_DATABASE", "cloud_master")
    DB_USER = os.getenv("DB_USERNAME", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "widowmaker")

    # SSH Configuration (for external VPS access)
    SSH_HOST = os.getenv("SSH_HOST", "89.117.147.134")
    SSH_PORT = int(os.getenv("SSH_PORT", "10622"))
    SSH_USER = os.getenv("SSH_USER", "root")
    SSH_KEY_PATH = os.getenv("SSH_KEY_PATH", "~/.ssh/id_rsa_cloudfly")

    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

    # Redis Configuration
    REDIS_HOST = os.getenv("REDIS_HOST", "redis_server")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "Elian2020#")

    # Qdrant Configuration
    QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
    QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

    # API Keys
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Service URLs
    BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://backend-api:8080")
    EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "http://evolution-api:8080")

    # Timezone
    TZ = os.getenv("TZ", "America/Bogota")


# Singleton instance
settings = Settings()
