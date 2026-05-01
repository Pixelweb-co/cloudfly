import time
import json
import logging
import mysql.connector
import config

logger = logging.getLogger(__name__)

class ChatbotConfigLoader:
    _cache = {}
    _ttl = 300  # 5 minutes

    @classmethod
    def get(cls, tenant_id: int) -> dict:
        """Obtiene la configuración del chatbot para un tenant, con caché."""
        now = time.time()
        
        # Check cache
        if tenant_id in cls._cache:
            data, timestamp = cls._cache[tenant_id]
            if now - timestamp < cls._ttl:
                return data

        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM chatbots WHERE tenant_id = %s AND is_active = 1"
            cursor.execute(query, (tenant_id,))
            config_db = cursor.fetchone()
            conn.close()

            if config_db:
                # Parse JSON tools if it's a string
                if isinstance(config_db.get('enabled_tools'), str):
                    config_db['enabled_tools'] = json.loads(config_db['enabled_tools'])
                
                cls._cache[tenant_id] = (config_db, now)
                return config_db

        except Exception as e:
            logger.error(f"Error loading chatbot config for tenant {tenant_id}: {e}")

        # Return default if not found or error
        default = cls._default_config(tenant_id)
        cls._cache[tenant_id] = (default, now)
        return default

    @classmethod
    def invalidate(cls, tenant_id: int):
        """Invalida el caché para un tenant específico."""
        if tenant_id in cls._cache:
            del cls._cache[tenant_id]
            logger.info(f"Cache invalidated for tenant {tenant_id}")

    @staticmethod
    def _default_config(tenant_id: int) -> dict:
        return {
            "tenant_id": tenant_id,
            "agent_type": "sales",
            "agent_name": "Asistente",
            "language": "es",
            "tone": "profesional",
            "system_prompt_override": None,
            "extra_instructions": None,
            "enabled_tools": [
                "search_products_semantically", "check_products_stock",
                "get_contact", "manage_contact",
                "create_order", "create_quote"
            ],
            "max_history": 10,
            "max_tool_loops": 5,
            "temperature": 0.7,
            "is_active": 1
        }
