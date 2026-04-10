import json
import logging
from concurrent.futures import ThreadPoolExecutor
from confluent_kafka import Consumer, KafkaException
import config

logger = logging.getLogger(__name__)

class MessageConsumer:
    def __init__(self, callback):
        self.conf = {
            'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': config.CONSUMER_GROUP_ID,
            'auto.offset.reset': 'earliest'
        }
        self.consumer = Consumer(self.conf)
        self.callback = callback
        # Define a ThreadPoolExecutor for parallel processing
        self.executor = ThreadPoolExecutor(max_workers=10)

    def start(self):
        try:
            self.consumer.subscribe([config.TOPIC_MESSAGES_IN])
            logger.info(f"Subscribed to topic: {config.TOPIC_MESSAGES_IN}")

            while True:
                msg = self.consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaException._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka error: {msg.error()}")
                        break

                try:
                    payload = json.loads(msg.value().decode('utf-8'))
                    # Dispatch to thread pool instead of blocking
                    self.executor.submit(self._safe_callback, payload)
                except Exception as e:
                    logger.error(f"Error parsing message: {e}")

        except KeyboardInterrupt:
            pass
        finally:
            logger.info("Stopping consumer and executor...")
            self.executor.shutdown(wait=True)
            self.consumer.close()

    def _safe_callback(self, payload):
        """
        Wrapper to catch exceptions in the thread pool.
        """
        try:
            self.callback(payload)
        except Exception as e:
            logger.error(f"Error in parallel callback: {e}")
