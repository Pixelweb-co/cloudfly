import logging
import redis
import mysql.connector
from datetime import datetime
import config
from types import SimpleNamespace

logger = logging.getLogger(__name__)

class TokenTracker:
    def __init__(self):
        # Redis settings with fallbacks
        self.redis_host = getattr(config, 'REDIS_HOST', 'localhost')
        self.redis_port = getattr(config, 'REDIS_PORT', 6379)
        self.redis_db = getattr(config, 'REDIS_DB', 0)
        self.redis_password = getattr(config, 'REDIS_PASSWORD', None)
        
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                db=self.redis_db,
                password=self.redis_password,
                decode_responses=True
            )
        except Exception as e:
            logger.warning(f"[TOKENS] Redis initialization failed: {e}")
            self.redis_client = None

        # Pricing from config
        self.prompt_price = getattr(config, 'PROMPT_TOKEN_PRICE', 0.00000015)
        self.completion_price = getattr(config, 'COMPLETION_TOKEN_PRICE', 0.0000006)
        self.model = getattr(config, 'OPENAI_MODEL', 'gpt-4o-mini')

    def track(self, usage, label: str, tenant_id: int, conversation_id: str):
        """Calcula costo, loguea y persiste el uso de tokens."""
        try:
            prompt = usage.prompt_tokens
            completion = usage.completion_tokens
            total = usage.total_tokens
            cost = (prompt * self.prompt_price) + (completion * self.completion_price)
            
            logger.info(
                f"[TOKENS] {label} | tenant={tenant_id} conv={conversation_id} | "
                f"prompt={prompt} completion={completion} total={total} | "
                f"cost_usd=${cost:.8f}"
            )
            
            # Push to Redis (Daily and Monthly)
            try:
                self._push_redis(tenant_id, prompt, completion, total, cost)
            except Exception as e:
                logger.warning(f"[TOKENS] Redis update failed (non-critical): {e}")

            # Persist to MySQL for specific labels
            if label in ("TOTAL_TURNO", "LLAMADA_DIRECTA"):
                try:
                    self._persist_mysql(tenant_id, conversation_id, label, prompt, completion, total, cost)
                except Exception as e:
                    logger.warning(f"[TOKENS] MySQL persist failed (non-critical): {e}")
                    
        except Exception as e:
            logger.error(f"[TOKENS] Critical error in tracker: {e}")

    def _push_redis(self, tenant_id, prompt, completion, total, cost):
        if not self.redis_client:
            return
            
        today = datetime.now().strftime("%Y-%m-%d")
        month = datetime.now().strftime("%Y-%m")
        ttl = 90 * 24 * 60 * 60 # 90 days
        
        pipe = self.redis_client.pipeline()
        
        # Daily keys
        d_prefix = f"tokens:tenant:{tenant_id}:daily:{today}"
        pipe.incrby(f"{d_prefix}:prompt", prompt)
        pipe.incrby(f"{d_prefix}:completion", completion)
        pipe.incrby(f"{d_prefix}:total", total)
        pipe.incrbyfloat(f"{d_prefix}:cost_usd", cost)
        for suffix in ["prompt", "completion", "total", "cost_usd"]:
            pipe.expire(f"{d_prefix}:{suffix}", ttl)
            
        # Monthly keys
        m_prefix = f"tokens:tenant:{tenant_id}:monthly:{month}"
        pipe.incrby(f"{m_prefix}:total", total)
        pipe.incrbyfloat(f"{m_prefix}:cost_usd", cost)
        for suffix in ["total", "cost_usd"]:
            pipe.expire(f"{m_prefix}:{suffix}", ttl)
            
        pipe.execute()

    def _persist_mysql(self, tenant_id, conversation_id, label, prompt, completion, total, cost):
        conn = None
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor()
            query = """
                INSERT INTO token_usage_log 
                (tenant_id, conversation_id, label, prompt_tokens, completion_tokens, total_tokens, cost_usd, model) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (tenant_id, conversation_id, label, prompt, completion, total, cost, self.model))
            conn.commit()
        finally:
            if conn:
                conn.close()

    def get_daily_summary(self, tenant_id, date=None) -> dict:
        if not self.redis_client: return {}
        target_date = date if date else datetime.now().strftime("%Y-%m-%d")
        prefix = f"tokens:tenant:{tenant_id}:daily:{target_date}"
        
        return {
            "date": target_date,
            "tenant_id": tenant_id,
            "prompt_tokens": int(self.redis_client.get(f"{prefix}:prompt") or 0),
            "completion_tokens": int(self.redis_client.get(f"{prefix}:completion") or 0),
            "total_tokens": int(self.redis_client.get(f"{prefix}:total") or 0),
            "cost_usd": float(self.redis_client.get(f"{prefix}:cost_usd") or 0)
        }

    def get_monthly_summary(self, tenant_id, month=None) -> dict:
        if not self.redis_client: return {}
        target_month = month if month else datetime.now().strftime("%Y-%m")
        prefix = f"tokens:tenant:{tenant_id}:monthly:{target_month}"
        
        return {
            "month": target_month,
            "tenant_id": tenant_id,
            "total_tokens": int(self.redis_client.get(f"{prefix}:total") or 0),
            "cost_usd": float(self.redis_client.get(f"{prefix}:cost_usd") or 0)
        }

    def get_history(self, tenant_id, limit=30) -> list:
        conn = None
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT DATE(created_at) as date, SUM(total_tokens) as total_tokens, SUM(cost_usd) as cost_usd
                FROM token_usage_log 
                WHERE tenant_id = %s
                GROUP BY DATE(created_at) 
                ORDER BY date DESC 
                LIMIT %s
            """
            cursor.execute(query, (tenant_id, limit))
            return cursor.fetchall()
        except Exception as e:
            logger.warning(f"[TOKENS] History fetch failed: {e}")
            return []
        finally:
            if conn:
                conn.close()
