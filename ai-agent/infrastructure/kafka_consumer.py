"""
infrastructure/kafka_consumer.py

Async Kafka consumer using confluent-kafka with ThreadPoolExecutor dispatch.
Decouples message polling (single thread) from processing (thread pool).
"""
import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Awaitable

from confluent_kafka import Consumer, KafkaException

from application.config import config

logger = logging.getLogger(__name__)


class AsyncKafkaConsumer:
    """
    Wraps confluent-kafka Consumer.
    Messages are polled in a background thread to keep the asyncio loop free,
    then dispatched as coroutines via loop.create_task().
    """

    def __init__(
        self,
        callback: Callable[[dict], Awaitable[None]],
        max_workers: int = 10,
    ) -> None:
        self._callback = callback
        self._max_workers = max_workers
        self._consumer: Consumer | None = None
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="kafka-poller")
        self._running = False

    def _build_consumer(self) -> Consumer:
        return Consumer(
            {
                "bootstrap.servers": config.kafka_bootstrap_servers,
                "group.id": config.consumer_group_id,
                "auto.offset.reset": "earliest",
                "enable.auto.commit": True,
            }
        )

    async def start(self) -> None:
        """Subscribe and begin consuming messages."""
        self._consumer = self._build_consumer()
        self._consumer.subscribe([config.topic_messages_in])
        self._running = True
        logger.info("Kafka consumer started", extra={"topic": config.topic_messages_in})

        loop = asyncio.get_running_loop()
        # Run the blocking poll loop in an executor so we don't block asyncio
        await loop.run_in_executor(self._executor, self._poll_loop, loop)

    def _poll_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """
        Blocking loop that runs in a background thread.
        For each valid message it schedules an async task on the event loop.
        """
        while self._running:
            msg = self._consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaException._PARTITION_EOF:
                    continue
                logger.error("Kafka error", extra={"error": str(msg.error())})
                continue

            try:
                raw = msg.value().decode("utf-8")
                payload: dict = json.loads(raw)
                # Schedule the async handler onto the event loop (thread-safe)
                asyncio.run_coroutine_threadsafe(self._dispatch(payload), loop)
            except json.JSONDecodeError as exc:
                logger.error("Invalid JSON from Kafka", extra={"error": str(exc)})

    async def _dispatch(self, payload: dict) -> None:
        """Async wrapper that catches and logs processing errors."""
        tenant_id = payload.get("tenantId")
        contact_id = payload.get("contactId")
        logger.info(
            "Message received",
            extra={"tenant_id": tenant_id, "contact_id": contact_id},
        )
        try:
            await self._callback(payload)
        except Exception as exc:
            logger.error(
                "Unhandled error in message callback",
                extra={
                    "tenant_id": tenant_id,
                    "contact_id": contact_id,
                    "error": str(exc),
                },
            )

    async def stop(self) -> None:
        """Graceful shutdown: stop polling, close consumer, clean up executor."""
        self._running = False
        self._executor.shutdown(wait=True)
        if self._consumer:
            self._consumer.close()
        logger.info("Kafka consumer stopped")
