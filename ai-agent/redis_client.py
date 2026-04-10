import redis
import json
import logging
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
