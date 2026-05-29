import json
import logging
import os

from confluent_kafka import Consumer, KafkaError, KafkaException, Producer

from kafka.topics import GROUP_MARKETING, TOPIC_ERRORS, TOPIC_REQUESTS, TOPIC_RESULTS

logger = logging.getLogger("marketing_team_ai.kafka")


def bootstrap_servers() -> str:
    host = os.getenv("KAFKA_BOOTSTRAP_SERVERS") or os.getenv("KAFKA_HOST", "kafka")
    if ":" not in host:
        return f"{host}:9092"
    return host


def create_producer() -> Producer:
    return Producer(
        {
            "bootstrap.servers": bootstrap_servers(),
            "client.id": "marketing-team-ai",
            "acks": "all",
            "retries": 3,
        }
    )


def create_results_consumer() -> Consumer:
    return Consumer(
        {
            "bootstrap.servers": bootstrap_servers(),
            "group.id": GROUP_MARKETING,
            "auto.offset.reset": "earliest",
            "enable.auto.commit": False,
            "session.timeout.ms": 30000,
            "max.poll.interval.ms": 900000,
        }
    )


def publish(producer: Producer, topic: str, payload: dict) -> None:
    key = (payload.get("request_id") or "").encode("utf-8")
    value = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    producer.produce(topic, key=key, value=value)
    producer.poll(0)


def flush(producer: Producer) -> None:
    producer.flush(10)


def consume_forever(consumer: Consumer, topics: list[str], handler) -> None:
    consumer.subscribe(topics)
    logger.info("Marketing Kafka consumer started topics=%s", topics)
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise KafkaException(msg.error())
        try:
            payload = json.loads(msg.value().decode("utf-8"))
            handler(payload, msg.topic())
            consumer.commit(asynchronous=False)
        except Exception:
            logger.exception("Failed processing topic=%s", msg.topic())
