"""
application/main.py

Async orchestrator for the CloudFly AI Agent.

Startup sequence:
  1. JSON logging
  2. MySQL pool
  3. Redis connection
  4. Qdrant (optional)
  5. Kafka consumer loop

Processing flow (per message):
  1. Parse payload → MessagePayload
  2. Idempotency check (Redis)
  3. Rate-limit check (Redis per-tenant daily counter)
  4. Ensure pipeline assigned (MySQL atomic UPDATE WHERE pipeline_id IS NULL)
  5. Load conversation history (Redis)
  6. Fetch current pipeline state (MySQL JOIN)
  7. Call AI service (OpenAI with tenacity retries)
  8. Execute pipeline update if the LLM requested one (MySQL transaction)
  9. Persist history (Redis LPUSH + LTRIM)
  10. Publish response to Kafka
  11. On failure → DLQ
"""
import asyncio
import logging
import signal
import sys
from typing import Dict

from qdrant_client import QdrantClient

from application.config import config
from application.logger import setup_logging
from domain.ai_service import AIService
from domain.exceptions import NonRetryableError, RetryableError, RateLimitExceededError
from domain.models import MessagePayload
from infrastructure.kafka_consumer import AsyncKafkaConsumer
from infrastructure.kafka_producer import AsyncKafkaProducer
from infrastructure.mysql_client import AsyncMySQLClient
from infrastructure.redis_client import AsyncRedisClient

logger = logging.getLogger("ai-agent")


class AIAgentApp:
    """
    Wires all infrastructure clients together and drives the processing loop.
    All I/O is async; the Kafka poll runs in a background thread.
    """

    def __init__(self) -> None:
        self.db = AsyncMySQLClient()
        self.redis = AsyncRedisClient()
        self.producer = AsyncKafkaProducer()
        self.consumer: AsyncKafkaConsumer | None = None
        self.ai: AIService | None = None
        self._shutdown_event = asyncio.Event()

    # ── Startup / Shutdown ────────────────────────────────────────────────

    async def startup(self) -> None:
        if not config.openai_api_key:
            logger.error("OPENAI_API_KEY is not configured. Exiting.")
            sys.exit(1)

        await self.db.connect()
        await self.redis.connect()

        # Qdrant is optional — agent degrades gracefully if unreachable
        qdrant: QdrantClient | None = None
        try:
            qdrant = QdrantClient(host=config.qdrant_host, port=config.qdrant_port)
            logger.info("Qdrant connected", extra={"host": config.qdrant_host})
        except Exception as exc:
            logger.warning("Qdrant unavailable — product search disabled", extra={"error": str(exc)})

        self.ai = AIService(db=self.db, qdrant=qdrant)
        self.consumer = AsyncKafkaConsumer(callback=self._process_message)
        logger.info("AI Agent started")

    async def shutdown(self) -> None:
        logger.info("Shutting down AI Agent...")
        if self.consumer:
            await self.consumer.stop()
        await self.db.close()
        await self.redis.close()
        self.producer.flush()
        logger.info("Shutdown complete")

    # ── Core Message Processor ─────────────────────────────────────────────

    async def _process_message(self, raw_payload: Dict) -> None:
        """
        End-to-end processing of a single inbound Kafka message.
        Non-retryable errors go to DLQ. Retryable errors are re-raised
        (Kafka consumer will not commit the offset on failure if needed).
        """
        try:
            payload = MessagePayload.from_dict(raw_payload)
        except (KeyError, ValueError) as exc:
            logger.error("Invalid payload — skipping", extra={"error": str(exc), "raw": str(raw_payload)[:200]})
            self.producer.send_to_dlq(raw_payload, f"Invalid payload: {exc}")
            return

        log_ctx = {
            "tenant_id": payload.tenant_id,
            "contact_id": payload.contact_id,
            "conversation_id": payload.conversation_id,
            "message_id": payload.message_id,
            "message_text": payload.message_text[:100],  # Log first 100 chars
        }

        # ① Idempotency
        if await self.redis.is_already_processed(payload.message_id):
            logger.info("Duplicate message — skipping", extra=log_ctx)
            return

        logger.info("Processing message", extra=log_ctx)

        # ② Rate limiting
        if not await self.redis.check_and_increment_rate_limit(payload.tenant_id):
            raise RateLimitExceededError(f"Tenant {payload.tenant_id} rate limit exceeded")

        try:
            # ③ Ensure pipeline assigned (atomic, race-condition safe)
            await self.db.ensure_pipeline_assigned(payload.tenant_id, payload.contact_id)

            # ④ Load history
            history = await self.redis.get_memory(
                payload.tenant_id, payload.contact_id, payload.conversation_id
            )

            # ⑤ Fetch current pipeline state (for prompt injection)
            pipeline_state = await self.db.get_contact_pipeline_state(
                payload.contact_id, payload.tenant_id
            )

            # ⑥ Generate AI response
            response_text, pipeline_update, handoff_request, token_usage = await self.ai.generate_response(
                payload.tenant_id,
                payload.contact_id,
                payload.conversation_id,
                payload.message_text,
                history,
                pipeline_state,
                payload.message_id,
            )

            # ⑦ Execute pipeline stage update if LLM requested one
            if pipeline_update:
                # Security/Logic fix: Always use the contact_id from the original payload
                # to prevent the AI from accidentally updating a different contact (or getting IDs mixed up).
                await self.db.update_stage(
                    contact_id=payload.contact_id,
                    stage_id=pipeline_update["stage_id"],
                    tenant_id=payload.tenant_id,
                )

            # ⑦.1 Handle human handoff if requested by LLM
            is_handoff = False
            if handoff_request:
                is_handoff = True
                await self.db.disable_chatbot(payload.contact_id, payload.tenant_id)
                await self.redis.invalidate_chatbot_cache(payload.tenant_id, payload.contact_id)
                logger.info(
                    "Handoff triggered by AI",
                    extra={**log_ctx, "reason": handoff_request.get("reason")},
                )

            # ⑧ Persist conversation turns
            await self.redis.save_message(
                payload.tenant_id, payload.contact_id, payload.conversation_id,
                "user", payload.message_text,
            )
            await self.redis.save_message(
                payload.tenant_id, payload.contact_id, payload.conversation_id,
                "assistant", response_text,
            )

            # ⑨ Publish reply
            self.producer.send_response(
                payload.tenant_id,
                payload.contact_id,
                payload.conversation_id,
                response_text,
                is_bot_handoff=is_handoff,
            )
            logger.info("Response sent", extra={**log_ctx, "response_text": response_text[:100]})

        except RateLimitExceededError:
            raise  # propagate — don't DLQ rate limit errors
        except NonRetryableError as exc:
            logger.error("Non-retryable error", extra={**log_ctx, "error": str(exc)})
            self.producer.send_to_dlq(raw_payload, str(exc))
        except RetryableError as exc:
            logger.warning("Retryable error — re-raising", extra={**log_ctx, "error": str(exc)})
            raise
        except Exception as exc:
            logger.error("Unexpected error", extra={**log_ctx, "error": str(exc)})
            self.producer.send_to_dlq(raw_payload, f"Unexpected: {exc}")

    # ── Run ───────────────────────────────────────────────────────────────

    async def run(self) -> None:
        await self.startup()

        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._shutdown_event.set)

        consumer_task = asyncio.create_task(self.consumer.start())
        shutdown_task = asyncio.create_task(self._shutdown_event.wait())

        done, pending = await asyncio.wait(
            {consumer_task, shutdown_task},
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

        await self.shutdown()


def main() -> None:
    setup_logging(config.log_level)
    app = AIAgentApp()
    asyncio.run(app.run())


if __name__ == "__main__":
    main()
