import os

class Config:
    """Central configuration for the CrewAI marketing team agent.
    Reads environment variables injected by Docker Compose.
    """
    # Database configuration
    DB_HOST = os.getenv("DB_HOST", "mysql")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_DATABASE", "cloud_master")
    DB_USER = os.getenv("DB_USERNAME", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "widowmaker")

    # Redis configuration
    REDIS_HOST = os.getenv("REDIS_HOST", "redis_server")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "Elian2020#")

    # Services
    LEAD_GENERATOR_URL = os.getenv("LEAD_GENERATOR_URL", "http://lead-generator:8000")
