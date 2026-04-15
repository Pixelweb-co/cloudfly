import logging
import sys
import json
import mysql.connector
from config import OPENAI_API_KEY, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
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


def ensure_contact_pipeline(tenant_id, contact_id):
    """
    Si el contacto no tiene pipeline/stage asignado, le asigna
    el pipeline por defecto del tenant y su primera etapa.
    Retorna True si se asignó, False si ya tenía o si falló.
    """
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER,
            password=DB_PASSWORD, database=DB_NAME, connect_timeout=5
        )
        cursor = conn.cursor(dictionary=True)

        # 1. Verificar si el contacto ya tiene pipeline/stage
        cursor.execute(
            "SELECT pipeline_id, stage_id FROM contacts WHERE id = %s AND tenant_id = %s",
            (contact_id, tenant_id)
        )
        contact = cursor.fetchone()

        if not contact:
            conn.close()
            logger.warning(f"[PIPELINE-FALLBACK] Contact {contact_id} not found for tenant {tenant_id}")
            return False

        if contact.get('pipeline_id') and contact.get('stage_id'):
            conn.close()
            return False  # Ya tiene pipeline, no hacer nada

        # 2. Buscar el primer pipeline del tenant
        cursor.execute(
            "SELECT id FROM pipelines WHERE tenant_id = %s ORDER BY id ASC LIMIT 1",
            (tenant_id,)
        )
        pipeline = cursor.fetchone()
        if not pipeline:
            conn.close()
            logger.warning(f"[PIPELINE-FALLBACK] No pipeline found for tenant {tenant_id}")
            return False

        pipeline_id = pipeline['id']

        # 3. Buscar la primera etapa del pipeline (position=0)
        cursor.execute(
            "SELECT id FROM pipeline_stages WHERE pipeline_id = %s ORDER BY position ASC LIMIT 1",
            (pipeline_id,)
        )
        stage = cursor.fetchone()
        if not stage:
            conn.close()
            logger.warning(f"[PIPELINE-FALLBACK] No stages found for pipeline {pipeline_id}")
            return False

        stage_id = stage['id']

        # 4. Actualizar el contacto
        cursor.execute(
            "UPDATE contacts SET pipeline_id = %s, stage_id = %s, updated_at = NOW() WHERE id = %s AND tenant_id = %s",
            (pipeline_id, stage_id, contact_id, tenant_id)
        )

        # 5. Insertar/actualizar conversation_pipeline_state
        cursor.execute(
            "SELECT id FROM conversation_pipeline_state WHERE contact_id = %s AND tenant_id = %s",
            (contact_id, tenant_id)
        )
        existing_state = cursor.fetchone()

        if existing_state:
            cursor.execute(
                "UPDATE conversation_pipeline_state SET pipeline_id=%s, current_stage_id=%s, entered_stage_at=NOW(), updated_at=NOW() WHERE contact_id=%s AND tenant_id=%s",
                (pipeline_id, stage_id, contact_id, tenant_id)
            )
        else:
            cursor.execute(
                """INSERT INTO conversation_pipeline_state
                   (tenant_id, contact_id, pipeline_id, current_stage_id,
                    entered_stage_at, is_active, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, NOW(), 1, NOW(), NOW())""",
                (tenant_id, contact_id, pipeline_id, stage_id)
            )

        conn.commit()
        conn.close()
        logger.info(f"🏷️ [PIPELINE-FALLBACK] Contact {contact_id} assigned to pipeline={pipeline_id}, stage={stage_id}")
        return True

    except Exception as e:
        logger.error(f"[PIPELINE-FALLBACK] Error: {e}")
        return False


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

        logger.info(f"🧠 [AI-FLOW] START: Processing message for tenant {tenant_id}, contact {contact_id}")

        # 2. Fallback: asignar pipeline por defecto si el contacto no tiene uno
        assigned = ensure_contact_pipeline(tenant_id, contact_id)
        if assigned:
            logger.info(f"🏷️ [AI-FLOW] Pipeline assigned automatically to contact {contact_id}")

        # 3. Load Memory
        history = self.redis_client.get_memory(tenant_id, contact_id, conversation_id)

        # 4. Generate AI Response
        response_text = self.ai_service.generate_response(
            tenant_id, contact_id, conversation_id, message_text, history
        )

        logger.info(f"🤖 [AI-FLOW] GENERATED: Response for contact {contact_id} ready.")

        # 5. Save to Memory (User + Assistant)
        self.redis_client.save_message(tenant_id, contact_id, conversation_id, "user", message_text)
        self.redis_client.save_message(tenant_id, contact_id, conversation_id, "assistant", response_text)

        # 6. Produce Response to Kafka
        self.producer.send_response(tenant_id, contact_id, conversation_id, response_text)
        logger.info(f"📤 [AI-FLOW] END: AI response sent to Kafka for contact {contact_id}")

    def run(self):
        logger.info("🚀 AI Agent Service is starting...")
        self.consumer.start()


if __name__ == "__main__":
    app = AIAgentApp()
    app.run()
