import logging
import sys
from config import OPENAI_API_KEY
from kafka_consumer import MessageConsumer
from kafka_producer import MessageProducer
from ai_service import AIService
from redis_client import RedisMemoryClient

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("ai-agent")

class AIAgentApp:
    def __init__(self):
        if not OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY is not set. Exiting...")
            sys.exit(1)

        self.ai_service = AIService()
        self.redis_client = RedisMemoryClient()
        self.producer = MessageProducer()
        self.consumer = MessageConsumer(self.process_message)

    def process_message(self, payload):
        """
        Main logic flow for each consumed message.
        """
        tenant_id = payload.get("tenantId")
        contact_id = payload.get("contactId")
        conversation_id = payload.get("conversationId")
        message_text = payload.get("mensaje")
        timestamp = payload.get("timestamp")

        if not all([tenant_id, contact_id, conversation_id, message_text]):
            logger.warning(f"Invalid payload received: {payload}")
            return

        # 1. Idempotency Check
        if self.redis_client.is_processed(tenant_id, contact_id, conversation_id, timestamp):
            logger.info(f"Message already processed. Skipping: {timestamp}")
            return

        logger.info(f"Processing message from tenant {tenant_id}, contact {contact_id}")

        # 2. Load Memory
        history = self.redis_client.get_memory(tenant_id, contact_id, conversation_id)

        # 3. Generate AI Response
        response_text = self.ai_service.generate_response(
            tenant_id, contact_id, conversation_id, message_text, history
        )

        # 4. Save to Memory (User + Assistant)
        self.redis_client.save_message(tenant_id, contact_id, conversation_id, "user", message_text)
        self.redis_client.save_message(tenant_id, contact_id, conversation_id, "assistant", response_text)

        # 5. Produce Response to Kafka
        self.producer.send_response(tenant_id, contact_id, conversation_id, response_text)
        logger.info(f"AI response sent to Kafka for contact {contact_id}")

    def run(self):
        logger.info("🚀 AI Agent Service is starting...")
        self.consumer.start()

if __name__ == "__main__":
    app = AIAgentApp()
    app.run()
