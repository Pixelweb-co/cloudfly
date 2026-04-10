import json
import logging
from datetime import datetime
from confluent_kafka import Producer
from . import config

logger = logging.getLogger(__name__)

class MessageProducer:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS
        }
        self.producer = Producer(self.conf)

    def send_response(self, tenant_id, contact_id, conversation_id, response_text):
        """
        Publishes the AI response to messages.out.
        """
        payload = {
            "tenantId": tenant_id,
            "contactId": contact_id,
            "conversationId": conversation_id,
            "respuesta": response_text,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "ai-agent"
        }
        
        try:
            self.producer.produce(
                config.TOPIC_MESSAGES_OUT,
                key=f"{tenant_id}:{contact_id}:{conversation_id}",
                value=json.dumps(payload).encode('utf-8'),
                callback=self._delivery_report
            )
            self.producer.flush()
        except Exception as e:
            logger.error(f"Error publishing to Kafka: {e}")

    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.info(f"Message delivered to {msg.topic()} [{msg.partition()}]")
