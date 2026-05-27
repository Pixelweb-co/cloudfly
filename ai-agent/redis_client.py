import redis
import json
import logging
import hashlib
import config

logger = logging.getLogger(__name__)

class RedisMemoryClient:
    def __init__(self):
        self.client = redis.Redis(
            host=config.REDIS_HOST,
            port=config.REDIS_PORT,
            password=config.REDIS_PASSWORD,
            decode_responses=True
        )

    def get_memory(self, tenant_id, contact_id, conversation_id):
        """
        Loads the last MAX_MEMORY_MESSAGES from Redis.
        Key: chat:{tenant}:{contact}:{conv}
        """
        key = f"chat:{tenant_id}:{contact_id}:{conversation_id}"
        try:
            messages_json = self.client.lrange(key, 0, config.MAX_MEMORY_MESSAGES - 1)
            # Redis lrange returns oldest first if we RPUSH, but we'll manage order
            messages = [json.loads(m) for m in reversed(messages_json)]
            return messages
        except Exception as e:
            logger.error(f"Error loading memory from Redis: {e}")
            return []

    def save_message(self, tenant_id, contact_id, conversation_id, role, content):
        """
        Saves a message (user or assistant) to Redis and trims the list.
        """
        key = f"chat:{tenant_id}:{contact_id}:{conversation_id}"
        message = json.dumps({"role": role, "content": content})
        try:
            # Shift to the left: newest at index 0
            self.client.lpush(key, message)
            self.client.ltrim(key, 0, config.MAX_MEMORY_MESSAGES - 1)
            # Set TTL to 24h to keep it relatively clean
            self.client.expire(key, 86400)
        except Exception as e:
            logger.error(f"Error saving message to Redis: {e}")

    def is_processed(self, tenant_id, contact_id, conversation_id, timestamp):
        """
        Idempotency check to avoid double processing.
        """
        key = f"processed:{tenant_id}:{contact_id}:{conversation_id}:{timestamp}"
        try:
            if self.client.get(key):
                return True
            self.client.set(key, "1", ex=3600) # 1 hour cache for idempotency
            return False
        except Exception as e:
            logger.error(f"Error checking idempotency in Redis: {e}")
            return False

    def check_tool_idempotency(self, key_data: str, ttl: int = 60):
        """
        Checks if a tool call with same data is in progress or done.
        Returns (is_duplicate, stored_result)
        """
        digest = hashlib.sha256(key_data.encode()).hexdigest()[:24]
        key = f"tool_idem:{digest}"
        try:
            res = self.client.get(key)
            if res:
                return True, res
            
            # SET NX to block concurrent calls
            # Use a placeholder "PROCESSING"
            self.client.set(key, "PROCESSING", ex=ttl, nx=True)
            return False, None
        except Exception as e:
            logger.error(f"Error checking tool idempotency: {e}")
            return False, None

    def save_tool_result(self, key_data: str, result: str, ttl: int = 120):
        """
        Saves the final result of a tool call to Redis.
        """
        digest = hashlib.sha256(key_data.encode()).hexdigest()[:24]
        key = f"tool_idem:{digest}"
        try:
            self.client.set(key, result, ex=ttl)
        except Exception as e:
            logger.error(f"Error saving tool result: {e}")
