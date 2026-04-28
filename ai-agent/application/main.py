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
from application.vector_worker import VectorSyncWorker
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
        self.vector_worker: VectorSyncWorker | None = None
        self.vector_consumer: AsyncKafkaConsumer | None = None
        self.ai: AIService | None = None
        self.media: MediaService | None = None
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

        from infrastructure.media_service import MediaService
        from openai import AsyncOpenAI
        
        openai_client = AsyncOpenAI(api_key=config.openai_api_key)
        self.media = MediaService(openai_client=openai_client)
        self.ai = AIService(db=self.db, qdrant=qdrant)
        self.consumer = AsyncKafkaConsumer(topic=config.topic_messages_in, callback=self._process_message)
        
        if qdrant:
            self.vector_worker = VectorSyncWorker(qdrant=qdrant)
            self.vector_consumer = AsyncKafkaConsumer(
                topic=config.topic_product_updates, 
                callback=self.vector_worker.handle_product_update
            )
            
        logger.info("AI Agent started")

    async def shutdown(self) -> None:
        logger.info("Shutting down AI Agent...")
        if self.consumer:
            await self.consumer.stop()
        if self.vector_consumer:
            await self.vector_consumer.stop()
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
        logger.info("🆕 [KAFKA_RECEIVED] Incoming raw message from messages.in")
        try:
            payload = MessagePayload.from_dict(raw_payload)
        except (KeyError, ValueError) as exc:
            logger.error("❌ [KAFKA_PARSE_ERROR] Invalid payload — skipping", extra={"error": str(exc), "raw": str(raw_payload)[:200]})
            self.producer.send_to_dlq(raw_payload, f"Invalid payload: {exc}")
            return

        log_ctx = {
            "tenant_id": payload.tenant_id,
            "contact_id": payload.contact_id,
            "conversation_id": payload.conversation_id,
            "message_id": payload.message_id,
        }

        # ① Idempotency
        if await self.redis.is_already_processed(payload.message_id):
            logger.info("♻️ [AI_STEP_1] Duplicate message detected in Redis — skipping", extra=log_ctx)
            return

        logger.info(f"⚙️ [AI_START] Processing message: type={payload.media_type}, \"{payload.message_text[:50]}...\"", extra=log_ctx)

        # ②.1 Media Pre-processing (Phase 1 & 3)
        if payload.media_type == "audio" and payload.media_url:
            transcription = await self.media.transcribe_audio(payload.media_url, payload.tenant_id)
            if transcription:
                logger.info(f"🎙️ [AI_STT_OK] Transcription: \"{transcription[:50]}...\"", extra=log_ctx)
                payload.message_text = transcription
            else:
                logger.warning("⚠️ [AI_STT_FAIL] Transcription failed, using placeholder text", extra=log_ctx)
                payload.message_text = "[Mensaje de audio no procesado]"

        elif payload.media_type == "image" and payload.media_url:
            image_desc = await self.media.analyze_image(payload.media_url, payload.tenant_id)
            if image_desc:
                logger.info(f"🖼️ [AI_VISION_OK] Image analyzed", extra=log_ctx)
                # We append the description to the message text (which might be empty or "[Image Message]")
                payload.message_text = image_desc
            else:
                logger.warning("⚠️ [AI_VISION_FAIL] Image analysis failed", extra=log_ctx)
                payload.message_text = "[Imagen no procesada]"

        # ② Rate limiting
        if not await self.redis.check_and_increment_rate_limit(payload.tenant_id):
            logger.error("🚫 [AI_RATE_LIMIT] Daily quota exceeded for tenant", extra=log_ctx)
            raise RateLimitExceededError(f"Tenant {payload.tenant_id} rate limit exceeded")

        try:
            # ③ Ensure pipeline assigned (atomic, race-condition safe)
            logger.info("🔍 [AI_STEP_3] Ensuring pipeline assigned", extra=log_ctx)
            await self.db.ensure_pipeline_assigned(payload.tenant_id, payload.contact_id)

            # ④ Load history
            logger.info("📚 [AI_STEP_4] Loading conversation history from Redis", extra=log_ctx)
            history = await self.redis.get_memory(
                payload.tenant_id, payload.contact_id, payload.conversation_id
            )

            # ⑤ Fetch current pipeline state (for prompt injection)
            logger.info("📊 [AI_STEP_5] Fetching current pipeline state from DB", extra=log_ctx)
            pipeline_state = await self.db.get_contact_pipeline_state(
                payload.contact_id, payload.tenant_id
            )

            # ⑥ Generate AI response
            logger.info("🤖 [AI_STEP_6] calling LLM (OpenAI)...", extra=log_ctx)
            response_text, pipeline_update, handoff_request, token_usage = await self.ai.generate_response(
                payload.tenant_id,
                payload.company_id,
                payload.contact_id,
                payload.conversation_id,
                payload.message_text,
                history,
                pipeline_state,
                payload.message_id,
            )
            logger.info(f"✅ [AI_STEP_6_OK] LLM responded. Tokens: {token_usage}", extra=log_ctx)

            # ⑦ Execute pipeline stage update if LLM requested one
            if pipeline_update:
                logger.info(f"📈 [AI_STEP_7] Pipeline update requested: stage_id {pipeline_update['stage_id']}", extra=log_ctx)
                await self.db.update_stage(
                    contact_id=payload.contact_id,
                    stage_id=pipeline_update["stage_id"],
                    tenant_id=payload.tenant_id,
                )

            # ⑦.1 Handle human handoff if requested by LLM
            is_handoff = False
            if handoff_request:
                is_handoff = True
                logger.info("👤 [AI_HANDOFF] AI requested handoff to human", extra=log_ctx)
                await self.db.disable_chatbot(payload.contact_id, payload.tenant_id)
                await self.redis.invalidate_chatbot_cache(payload.tenant_id, payload.contact_id)

            # ⑧ Persist conversation turns
            logger.info("💾 [AI_STEP_8] Saving user and assistant messages to history/Redis", extra=log_ctx)
            await self.redis.save_message(
                payload.tenant_id, payload.contact_id, payload.conversation_id,
                "user", payload.message_text,
            )
            await self.redis.save_message(
                payload.tenant_id, payload.contact_id, payload.conversation_id,
                "assistant", response_text,
            )

            # ⑨ Publish reply (with Human-like fragmentation or Audio)
            logger.info("📡 [AI_SENDING] Sending response to Kafka", extra=log_ctx)
            
            # Phase 2: Audio response logic
            if payload.media_type == "audio" and response_text:
                audio_base64 = await self.media.generate_tts(response_text, payload.tenant_id)
                if audio_base64:
                    logger.info("🎙️ [AI_TTS_OK] Sending audio response", extra=log_ctx)
                    self.producer.send_response(
                        tenant_id=payload.tenant_id,
                        contact_id=payload.contact_id,
                        conversation_id=payload.conversation_id,
                        response_text=response_text,
                        is_bot_handoff=is_handoff,
                        media_type="audio",
                        media_url=f"data:audio/mp3;base64,{audio_base64}"
                    )
                    logger.info("🏁 [AI_FINISHED] Audio message complete", extra=log_ctx)
                    return # Exit after sending audio

            # Fallback to Text (Fragmented)
            fragments = self.ai.split_text_for_whatsapp(response_text)
            for i, fragment in enumerate(fragments):
                # 9.1 Send the fragment
                self.producer.send_response(
                    tenant_id=payload.tenant_id,
                    contact_id=payload.contact_id,
                    conversation_id=payload.conversation_id,
                    response_text=fragment,
                    is_bot_handoff=(is_handoff and i == len(fragments) - 1),
                    media_type="text",
                    media_url=None
                )
                
                # 9.2 If there are more fragments, wait (Simulate writing time)
                if i < len(fragments) - 1:
                    delay = 1.5 + (len(fragment) * 0.015)
                    logger.info(f"⏳ [AI_DELAY] Waiting {delay:.2f}s before next fragment", extra=log_ctx)
                    await asyncio.sleep(delay)

            logger.info("🏁 [AI_FINISHED] Message processing complete", extra=log_ctx)

        except RateLimitExceededError:
            raise  # propagate — don't DLQ rate limit errors
        except NonRetryableError as exc:
            logger.error("❌ [AI_ERROR_NONRETRY] Critical failure", extra={**log_ctx, "error": str(exc)})
            self.producer.send_to_dlq(raw_payload, str(exc))
        except RetryableError as exc:
            logger.warning("⚠️ [AI_ERROR_RETRY] Retriable failure — reraising...", extra={**log_ctx, "error": str(exc)})
            raise
        except Exception as exc:
            logger.error("💥 [AI_ERROR_UNEXPECTED] Crash in AI logic", extra={**log_ctx, "error": str(exc)})
            self.producer.send_to_dlq(raw_payload, f"Unexpected: {exc}")

    # ── Run ───────────────────────────────────────────────────────────────

    async def run(self) -> None:
        await self.startup()

        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._shutdown_event.set)

        consumer_task = asyncio.create_task(self.consumer.start())
        tasks = {consumer_task}
        
        if self.vector_consumer:
            vector_task = asyncio.create_task(self.vector_consumer.start())
            tasks.add(vector_task)
            
        shutdown_task = asyncio.create_task(self._shutdown_event.wait())
        tasks.add(shutdown_task)

        done, pending = await asyncio.wait(
            tasks,
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
