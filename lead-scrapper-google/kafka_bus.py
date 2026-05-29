"""Kafka topics and client helpers for lead search pipeline."""

import json
import logging
import os
import socket
from typing import Any, Callable

from confluent_kafka import Consumer, KafkaError, KafkaException, Producer

logger = logging.getLogger("lead_scraper.kafka")

TOPIC_REQUESTS = "lead_search_requests"
TOPIC_RESULTS = "lead_search_results"
TOPIC_ERRORS = "lead_search_errors"

GROUP_SCRAPER = os.getenv("KAFKA_GROUP_SCRAPER", "lead-scrapper-google-workers")


def bootstrap_servers() -> str:
    host = os.getenv("KAFKA_BOOTSTRAP_SERVERS") or os.getenv("KAFKA_HOST", "kafka")
    if ":" not in host:
        return f"{host}:9092"
    return host


def worker_id() -> str:
    return os.getenv("WORKER_ID", socket.gethostname())


def create_producer() -> Producer:
    return Producer(
        {
            "bootstrap.servers": bootstrap_servers(),
            "client.id": f"lead-scrapper-{worker_id()}",
            "acks": "all",
            "retries": 3,
        }
    )


def create_consumer(group_id: str, topics: list[str]) -> Consumer:
    return Consumer(
        {
            "bootstrap.servers": bootstrap_servers(),
            "group.id": group_id,
            "auto.offset.reset": "earliest",
            "enable.auto.commit": False,
            "session.timeout.ms": 30000,
            "max.poll.interval.ms": 600000,
        }
    )


def publish(producer: Producer, topic: str, payload: dict, key: str | None = None) -> None:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    producer.produce(
        topic,
        key=(key or payload.get("request_id", "")).encode("utf-8"),
        value=data,
        callback=_delivery_report,
    )
    producer.poll(0)


def _delivery_report(err, msg) -> None:
    if err:
        logger.error("Kafka delivery failed topic=%s: %s", msg.topic() if msg else "?", err)


def flush_producer(producer: Producer, timeout: float = 10.0) -> None:
    producer.flush(timeout)


def consume_loop(
    consumer: Consumer,
    topics: list[str],
    handler: Callable[[dict], None],
    poll_timeout: float = 1.0,
) -> None:
    consumer.subscribe(topics)
    logger.info("Consumer subscribed topics=%s group=%s", topics, consumer)

    while True:
        msg = consumer.poll(poll_timeout)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise KafkaException(msg.error())

        try:
            payload = json.loads(msg.value().decode("utf-8"))
            handler(payload)
            consumer.commit(asynchronous=False)
        except Exception:
            logger.exception("Handler failed topic=%s", msg.topic())
            # no commit → retry
