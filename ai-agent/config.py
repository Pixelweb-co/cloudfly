import os
from dotenv import load_dotenv

load_dotenv()

# Kafka Settings
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPIC_MESSAGES_IN = "messages.in"
TOPIC_MESSAGES_OUT = "messages.out"
CONSUMER_GROUP_ID = "ai-agents"

# Redis Settings
REDIS_HOST = os.getenv("REDIS_HOST", "redis_server")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "Elian2020#")

# OpenAI Settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

# Memory Settings
MAX_MEMORY_MESSAGES = int(os.getenv("MAX_MEMORY_MESSAGES", 20))

# DB Settings (for fetching company info)
DB_HOST = os.getenv("DB_HOST", "mysql")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "widowmaker")
DB_NAME = os.getenv("DB_NAME", "cloud_master")

# API Services
JAVA_API_URL = os.getenv("JAVA_API_URL", "http://backend-api:8080")
AI_API_SECRET = os.getenv("AI_API_SECRET", "cloudfly_ai_secret_2026")
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

# General Settings
API_TIMEOUT = int(os.getenv("API_TIMEOUT", 10))
CHARTS_LOCAL_PATH = os.getenv("CHARTS_LOCAL_PATH", "/app/uploads/charts")
CHARTS_PUBLIC_URL = os.getenv("CHARTS_PUBLIC_URL", "https://api.cloudfly.com.co/uploads/charts/")

