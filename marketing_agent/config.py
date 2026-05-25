"""
Configuration module for Marketing Agent.

Loads environment variables from .env file and provides
a centralized Config class for all service configurations.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Configuration class for Marketing Agent.
    
    All settings are loaded from environment variables with sensible defaults
    for local development.
    """
    
    # Backend API
    BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080")
    BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")
    
    # Evolution API (WhatsApp)
    EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "http://evolution-api:8080")
    EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
    EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "cloudfly-main")
    
    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_NAME", "cloud_master")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    
    # Campaign Settings
    TENANT_ID = int(os.getenv("TENANT_ID", "1"))
    COMPANY_ID = int(os.getenv("COMPANY_ID", "1"))
    
    # Anti-spam settings (in milliseconds)
    MIN_DELAY_MS = int(os.getenv("MIN_DELAY_MS", "3000"))
    MAX_DELAY_MS = int(os.getenv("MAX_DELAY_MS", "12000"))
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "20"))
    BATCH_PAUSE_MS = int(os.getenv("BATCH_PAUSE_MS", "30000"))
    
    # OpenRouter API (for AI Ad Generation)
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    
    # Meta Marketing API (for Meta Ads Creation)
    META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
    META_AD_ACCOUNT_ID = os.getenv("META_AD_ACCOUNT_ID", "")
    META_PAGE_ID = os.getenv("META_PAGE_ID", "")
