"""
infrastructure/redis_client.py

Async Redis client providing:
  - Conversation memory  (list with LTRIM + TTL)
  - UUID-based idempotency check (SET NX + TTL)
  - Per-tenant daily rate limiting (INCR + EXPIRE)
"""
import json
import hashlib
import logging
from typing import List

import redis.asyncio as aioredis

from application.config import config
from domain.models import ChatMessage

logger = logging.getLogger(__name__)


class AsyncRedisClient:
    """
    Wraps redis.asyncio.Redis.
    Call await client.connect() before use; await client.close() on shutdown.
    """

    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None

    async def connect(self) -> None:
        self._redis = aioredis.Redis(
            host=config.redis_host,
            port=config.redis_port,
            password=config.redis_password or None,
            decode_responses=True,
        )
        await self._redis.ping()
        logger.info("Redis connection established", extra={"host": config.redis_host})

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()

    # ── Conversation Memory ────────────────────────────────────────────────

    def _memory_key(self, tenant_id: int, contact_id: int, conversation_id: str) -> str:
        return f"chat:{tenant_id}:{contact_id}:{conversation_id}"

    async def get_memory(
        self, tenant_id: int, contact_id: int, conversation_id: str
    ) -> List[ChatMessage]:
        """Return the last N messages, oldest-first (chronological order)."""
        key = self._memory_key(tenant_id, contact_id, conversation_id)
        try:
            # List is stored newest-first (lpush), so we reverse for LLM
            raw = await self._redis.lrange(key, 0, config.redis_max_memory_messages - 1)
            messages = [ChatMessage(**json.loads(m)) for m in reversed(raw)]
            return messages
        except Exception as exc:
            logger.error("Redis get_memory failed", extra={"error": str(exc)})
            return []

    async def save_message(
        self,
        tenant_id: int,
        contact_id: int,
        conversation_id: str,
        role: str,
        content: str,
    ) -> None:
        """Prepend message to list, trim excess, reset TTL."""
        key = self._memory_key(tenant_id, contact_id, conversation_id)
        entry = json.dumps({"role": role, "content": content})
        try:
            pipe = self._redis.pipeline()
            pipe.lpush(key, entry)
            pipe.ltrim(key, 0, config.redis_max_memory_messages - 1)
            pipe.expire(key, config.redis_memory_ttl_seconds)
            await pipe.execute()
        except Exception as exc:
            logger.error("Redis save_message failed", extra={"error": str(exc)})

    # ── Idempotency ────────────────────────────────────────────────────────

    @staticmethod
    def _idempotency_key(message_id: str) -> str:
        # Hash avoids injecting arbitrary strings into the key namespace
        digest = hashlib.sha256(message_id.encode()).hexdigest()[:16]
        return f"idem:{digest}"

    async def is_already_processed(self, message_id: str) -> bool:
        """
        Returns True (already processed) or False (first time seen).
        SET NX ensures exactly-once semantics even under concurrent workers.
        """
        key = self._idempotency_key(message_id)
        try:
            # SET key 1 EX ttl NX — returns True if key was set (first time)
            result = await self._redis.set(
                key, "1", ex=config.redis_idempotency_ttl_seconds, nx=True
            )
            return result is None  # None → key already existed
        except Exception as exc:
            logger.error("Redis idempotency check failed", extra={"error": str(exc)})
            return False  # Fail open: process the message rather than drop it

    # ── Per-Tenant Rate Limiting ───────────────────────────────────────────

    def _rate_limit_key(self, tenant_id: int) -> str:
        from datetime import date
        return f"rl:{tenant_id}:{date.today().isoformat()}"

    async def check_and_increment_rate_limit(self, tenant_id: int) -> bool:
        """
        Returns True if the tenant is within their daily quota.
        Increments the counter and sets TTL on first call of the day.
        """
        key = self._rate_limit_key(tenant_id)
        try:
            pipe = self._redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, 86400)  # expire at end of day window
            results = await pipe.execute()
            count = results[0]
            allowed = count <= config.ai_rate_limit_per_tenant_per_day
            if not allowed:
                logger.warning(
                    "Rate limit exceeded",
                    extra={"tenant_id": tenant_id, "count": count},
                )
            return allowed
        except Exception as exc:
            logger.error("Redis rate limit check failed", extra={"error": str(exc)})
            return True  # Fail open

    # ── Chatbot Gateway Sync ──────────────────────────────────────────────

    def _chatbot_gate_key(self, tenant_id: int, contact_id: int) -> str:
        return f"chatbot:{tenant_id}:{contact_id}"

    async def invalidate_chatbot_cache(self, tenant_id: int, contact_id: int) -> None:
        """
        Invalidates the cache key used by chat-socket-service to determine
        if the chatbot is enabled. Call this after DB updates to chatbot_enabled.
        """
        key = self._chatbot_gate_key(tenant_id, contact_id)
        try:
            await self._redis.delete(key)
            logger.info(
                "Chatbot cache invalidated in Redis",
                extra={"tenant_id": tenant_id, "contact_id": contact_id},
            )
        except Exception as exc:
            logger.warning(
                "Failed to invalidate chatbot cache",
                extra={"error": str(exc), "key": key},
            )
