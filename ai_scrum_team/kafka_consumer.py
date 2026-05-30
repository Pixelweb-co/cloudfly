"""
Kafka Consumer for AI Scrum Team.

Listens to a Kafka topic for incoming task requests.
If Kafka is not available or not configured, returns None silently.

Expected message format (JSON):
{
    "type": "feature" | "bug",        # optional — if missing, PO decides
    "title": "Short description",      # required
    "description": "Full details...",  # optional
    "priority": "low" | "medium" | "high"  # optional, default: medium
}
"""

import os
import json
import time

# Try importing kafka, but don't fail if not installed
try:
    from kafka import KafkaConsumer as _KafkaConsumer
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False


def _get_config() -> dict:
    """Read Kafka configuration from environment variables."""
    return {
        "bootstrap_servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS", ""),
        "topic": os.getenv("KAFKA_TOPIC", "scrum-tasks"),
        "group_id": os.getenv("KAFKA_CONSUMER_GROUP", "ai-scrum-team"),
        "auto_commit": os.getenv("KAFKA_AUTO_COMMIT", "true").lower() == "true",
    }


def is_kafka_configured() -> bool:
    """Check if Kafka is installed and configured."""
    if not KAFKA_AVAILABLE:
        return False
    cfg = _get_config()
    return bool(cfg["bootstrap_servers"])


def poll_kafka_queue(timeout_ms: int = 3000) -> dict | None:
    """
    Poll the Kafka topic for a new message.
    Returns a dict with the message payload, or None if:
    - Kafka is not configured
    - No messages available
    - Connection error
    """
    if not is_kafka_configured():
        return None

    cfg = _get_config()
    consumer = None
    try:
        consumer = _KafkaConsumer(
            cfg["topic"],
            bootstrap_servers=cfg["bootstrap_servers"].split(","),
            group_id=cfg["group_id"],
            auto_offset_reset="latest",
            enable_auto_commit=cfg["auto_commit"],
            consumer_timeout_ms=timeout_ms,
            value_deserializer=lambda m: m.decode("utf-8") if m else "{}",
        )

        # Poll for messages (non-blocking with timeout)
        raw_msgs = consumer.poll(timeout_ms=timeout_ms, max_records=1)

        for topic_partition, messages in raw_msgs.items():
            for message in messages:
                payload_raw = message.value
                if isinstance(payload_raw, str):
                    try:
                        payload = json.loads(payload_raw)
                    except json.JSONDecodeError:
                        # Treat raw string as a simple feature title
                        payload = {"type": "feature", "title": payload_raw}
                elif isinstance(payload_raw, dict):
                    payload = payload_raw
                else:
                    continue

                print(f"[Kafka] 📨 Mensaje recibido: {payload.get('title', 'Sin título')}")
                return payload

        return None

    except Exception as e:
        print(f"[Kafka] ⚠️ Error consumiendo de Kafka: {e}")
        return None
    finally:
        if consumer:
            try:
                consumer.close()
            except Exception:
                pass


def format_kafka_message_for_sprint(kafka_msg: dict) -> str:
    """
    Formats a Kafka message into a sprint goal string for the Crew.
    Includes type hint for the PO to decide issue type.
    """
    msg_type = kafka_msg.get("type", "").lower()
    title = kafka_msg.get("title", "Tarea desde Kafka")
    description = kafka_msg.get("description", "")
    priority = kafka_msg.get("priority", "medium")

    type_hint = ""
    if msg_type == "bug":
        type_hint = "[TIPO: BUG FIX] "
    elif msg_type == "feature":
        type_hint = "[TIPO: NUEVO DESARROLLO] "

    sprint_goal = f"{type_hint}{title}"
    if description:
        sprint_goal += f"\n\nDescripción: {description}"
    sprint_goal += f"\n\nPrioridad: {priority}"

    return sprint_goal
