"""
infrastructure/kafka_producer.py

Confluent Kafka producer with:
  - Main response topic (messages.out)
  - Dead Letter Queue (DLQ) for permanently failed messages
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from confluent_kafka import Producer, KafkaException

from application.config import config

logger = logging.getLogger(__name__)


class AsyncKafkaProducer:
    """
    Thin wrapper around confluent_kafka.Producer.
    confluent-kafka is C-backed and very fast; we keep it synchronous
    since produce() is non-blocking and flush() is only called on shutdown.
    """

    def __init__(self) -> None:
        self._producer = Producer(
            {"bootstrap.servers": config.kafka_bootstrap_servers}
        )

    def _delivery_report(self, err, msg) -> None:
        if err:
            logger.error(
                "Kafka delivery failed",
                extra={"topic": msg.topic(), "error": str(err)},
            )
        else:
            logger.debug(
                "Kafka delivery ok",
                extra={"topic": msg.topic(), "partition": msg.partition()},
            )

    def _produce(self, topic: str, key: str, payload: Dict[str, Any]) -> None:
        try:
            self._producer.produce(
                topic,
                key=key.encode("utf-8"),
                value=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                callback=self._delivery_report,
            )
            # poll() lets the delivery callback fire without a full flush
            self._producer.poll(0)
        except KafkaException as exc:
            logger.error(
                "Kafka produce error",
                extra={"topic": topic, "error": str(exc)},
            )
            raise

    def send_response(
        self,
        tenant_id: int,
        contact_id: int,
        conversation_id: str,
        response_text: str,
        is_bot_handoff: bool = False,
        media_type: str = "text",
        media_url: Optional[str] = None,
    ) -> None:
        """Publish the AI-generated reply to messages.out."""
        payload = {
            "tenantId": tenant_id,
            "contactId": contact_id,
            "conversationId": conversation_id,
            "respuesta": response_text,
            "isBotHandoff": is_bot_handoff,
            "mediaType": media_type,
            "mediaUrl": media_url,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "ai-agent",
        }
        key = f"{tenant_id}:{contact_id}:{conversation_id}"
        self._produce(config.topic_messages_out, key, payload)

    def send_to_dlq(
        self,
        original_payload: Dict[str, Any],
        error_reason: str,
    ) -> None:
        """
        Send a failed message to the Dead Letter Queue for manual inspection
        or replay. Includes the original payload and the failure reason.
        """
        dlq_payload = {
            "original": original_payload,
            "error": error_reason,
            "failed_at": datetime.now(timezone.utc).isoformat(),
        }
        tenant_id = original_payload.get("tenantId", "unknown")
        contact_id = original_payload.get("contactId", "unknown")
        key = f"dlq:{tenant_id}:{contact_id}"
        self._produce(config.topic_dlq, key, dlq_payload)
        logger.warning(
            "Message sent to DLQ",
            extra={
                "tenant_id": tenant_id,
                "contact_id": contact_id,
                "error": error_reason,
            },
        )

    def flush(self) -> None:
        """Block until all queued messages are delivered. Call on shutdown."""
        self._producer.flush()
