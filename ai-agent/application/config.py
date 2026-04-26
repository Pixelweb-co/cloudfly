"""
application/config.py

Centralized, typed configuration loaded from environment variables.
All services import from here — no scattered os.getenv() calls.
"""
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class AppConfig:
    # ── Kafka ──────────────────────────────────────────────────────────────
    kafka_bootstrap_servers: str
    topic_messages_in: str
    topic_messages_out: str
    topic_dlq: str
    topic_product_updates: str
    consumer_group_id: str

    # ── Redis ──────────────────────────────────────────────────────────────
    redis_host: str
    redis_port: int
    redis_password: str
    redis_max_memory_messages: int
    redis_memory_ttl_seconds: int     # conversation history TTL
    redis_idempotency_ttl_seconds: int  # deduplication window

    # ── MySQL ──────────────────────────────────────────────────────────────
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    db_pool_size: int

    # ── OpenAI ────────────────────────────────────────────────────────────
    openai_api_key: str
    openai_model: str
    openai_temperature: float
    openai_timeout_seconds: int

    # ── Qdrant ────────────────────────────────────────────────────────────
    qdrant_host: str
    qdrant_port: int

    # ── Rate-limiting per tenant ──────────────────────────────────────────
    ai_rate_limit_per_tenant_per_day: int

    # ── External APIs ─────────────────────────────────────────────────────
    java_api_url: str

    # ── Observability ─────────────────────────────────────────────────────
    log_level: str
    ai_api_secret: str


def load_config() -> AppConfig:
    """Build and return the application config from environment variables."""
    return AppConfig(
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
        topic_messages_in=os.getenv("TOPIC_MESSAGES_IN", "messages.in"),
        topic_messages_out=os.getenv("TOPIC_MESSAGES_OUT", "messages.out"),
        topic_dlq=os.getenv("TOPIC_DLQ", "ai-agent-dlq"),
        topic_product_updates=os.getenv("TOPIC_PRODUCT_UPDATES", "product.updates"),
        consumer_group_id=os.getenv("CONSUMER_GROUP_ID", "ai-agents"),

        redis_host=os.getenv("REDIS_HOST", "redis_server"),
        redis_port=int(os.getenv("REDIS_PORT", "6379")),
        redis_password=os.getenv("REDIS_PASSWORD", ""),
        redis_max_memory_messages=int(os.getenv("MAX_MEMORY_MESSAGES", "20")),
        redis_memory_ttl_seconds=int(os.getenv("MEMORY_TTL_SECONDS", "86400")),
        redis_idempotency_ttl_seconds=int(os.getenv("IDEMPOTENCY_TTL_SECONDS", "3600")),

        db_host=os.getenv("DB_HOST", "mysql"),
        db_port=int(os.getenv("DB_PORT", "3306")),
        db_user=os.getenv("DB_USER", "root"),
        db_password=os.getenv("DB_PASSWORD", ""),
        db_name=os.getenv("DB_NAME", "cloud_master"),
        db_pool_size=int(os.getenv("DB_POOL_SIZE", "10")),

        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        openai_temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
        openai_timeout_seconds=int(os.getenv("OPENAI_TIMEOUT_SECONDS", "30")),

        qdrant_host=os.getenv("QDRANT_HOST", "qdrant"),
        qdrant_port=int(os.getenv("QDRANT_PORT", "6333")),

        ai_rate_limit_per_tenant_per_day=int(os.getenv("AI_RATE_LIMIT_PER_DAY", "500")),

        java_api_url=os.getenv("JAVA_API_URL", "http://backend:8080/api"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        ai_api_secret=os.getenv("AI_API_SECRET", "cloudfly_ai_secret_2026")
    )


# Singleton — import this everywhere
config: AppConfig = load_config()
