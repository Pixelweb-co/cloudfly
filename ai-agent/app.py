import logging
import sys
import json
import time
from typing import Dict, Any, List

import mysql.connector
from mysql.connector import pooling
import redis
import openai

# ==============================
# CONFIG
# ==============================
OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "crm"
}

REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "db": 0
}

# ==============================
# LOGGING
# ==============================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)
logger = logging.getLogger("ai-agent")

# ==============================
# DB POOL
# ==============================
db_pool = pooling.MySQLConnectionPool(
    pool_name="ai_pool",
    pool_size=10,
    **DB_CONFIG
)

# ==============================
# REDIS CLIENT
# ==============================
class RedisMemoryClient:

    def __init__(self):
        self.client = redis.Redis(**REDIS_CONFIG)

    def _key(self, tenant, contact, conv):
        return f"mem:{tenant}:{contact}:{conv}"

    def save_message(self, tenant, contact, conv, role, content):
        key = self._key(tenant, contact, conv)
        message = json.dumps({"role": role, "content": content})
        self.client.rpush(key, message)
        self.client.expire(key, 86400)

    def get_memory(self, tenant, contact, conv):
        key = self._key(tenant, contact, conv)
        data = self.client.lrange(key, 0, -1)
        return [json.loads(x) for x in data]

    def is_processed(self, tenant, contact, conv, ts):
        key = f"processed:{tenant}:{contact}:{conv}:{ts}"
        if self.client.exists(key):
            return True
        self.client.setex(key, 3600, "1")
        return False

# ==============================
# PIPELINE SERVICE
# ==============================
class PipelineService:

    def ensure_pipeline(self, tenant_id, contact_id):

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            conn.start_transaction()

            # Intento atómico
            cursor.execute("""
                UPDATE contacts
                SET pipeline_id = (
                    SELECT id FROM pipelines
                    WHERE tenant_id = %s ORDER BY id ASC LIMIT 1
                ),
                stage_id = (
                    SELECT id FROM pipeline_stages
                    WHERE pipeline_id = (
                        SELECT id FROM pipelines
                        WHERE tenant_id = %s ORDER BY id ASC LIMIT 1
                    )
                    ORDER BY position ASC LIMIT 1
                )
                WHERE id = %s AND tenant_id = %s
                AND pipeline_id IS NULL
                AND stage_id IS NULL
            """, (tenant_id, tenant_id, contact_id, tenant_id))

            conn.commit()

            # Obtener estado actual
            cursor.execute("""
                SELECT pipeline_id, stage_id
                FROM contacts
                WHERE id = %s AND tenant_id = %s
            """, (contact_id, tenant_id))

            return cursor.fetchone()

        except Exception as e:
            conn.rollback()
            logger.error(f"[PIPELINE] Error: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def move_stage(self, tenant_id, contact_id, stage_name):

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        try:
            conn.start_transaction()

            cursor.execute("""
                UPDATE contacts
                SET stage_id = (
                    SELECT id FROM pipeline_stages
                    WHERE name = %s LIMIT 1
                )
                WHERE id = %s AND tenant_id = %s
            """, (stage_name, contact_id, tenant_id))

            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"[PIPELINE MOVE] Error: {e}")
        finally:
            cursor.close()
            conn.close()

# ==============================
# CRM SERVICE (dummy)
# ==============================
class CRMService:

    def create_task(self, tenant_id, contact_id, title):
        logger.info(f"[TASK] Created: {title} for contact {contact_id}")

    def add_tag(self, tenant_id, contact_id, tag):
        logger.info(f"[TAG] Added: {tag} to contact {contact_id}")

# ==============================
# ACTION ENGINE
# ==============================
class ActionEngine:

    def __init__(self):
        self.pipeline = PipelineService()
        self.crm = CRMService()

    def execute(self, action, tenant_id, contact_id):
        try:
            t = action.get("type")

            if t == "MOVE_PIPELINE":
                self.pipeline.move_stage(
                    tenant_id,
                    contact_id,
                    action.get("stage")
                )

            elif t == "CREATE_TASK":
                self.crm.create_task(
                    tenant_id,
                    contact_id,
                    action.get("title")
                )

            elif t == "TAG_CONTACT":
                self.crm.add_tag(
                    tenant_id,
                    contact_id,
                    action.get("tag")
                )

        except Exception as e:
            logger.error(f"[ACTION ERROR] {e}")

# ==============================
# AI SERVICE
# ==============================
class AIService:

    def __init__(self):
        openai.api_key = OPENAI_API_KEY

    def generate_with_actions(self, message, context):

        prompt = f"""
Eres un asistente de ventas inteligente.

CONTEXTO:
{json.dumps(context)}

MENSAJE:
{message}

Responde SOLO en JSON:

{{
  "response": "mensaje",
  "actions": []
}}
"""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                timeout=10
            )

            text = response["choices"][0]["message"]["content"]

            return json.loads(text)

        except Exception as e:
            logger.error(f"[AI ERROR] {e}")
            return {
                "response": "Lo siento, ocurrió un error.",
                "actions": []
            }

# ==============================
# KAFKA (SIMULADO)
# ==============================
class MessageProducer:
    def send_response(self, tenant, contact, conv, text):
        logger.info(f"[KAFKA OUT] → {text}")


class MessageConsumer:

    def __init__(self, callback):
        self.callback = callback

    def start(self):
        logger.info("Listening messages...")

        # Simulación
        while True:
            payload = {
                "tenantId": 1,
                "contactId": 101,
                "conversationId": 5001,
                "mensaje": input("Cliente: "),
                "timestamp": int(time.time())
            }
            self.callback(payload)

# ==============================
# ORCHESTRATOR
# ==============================
class MessageOrchestrator:

    def __init__(self):
        self.memory = RedisMemoryClient()
        self.ai = AIService()
        self.pipeline = PipelineService()
        self.actions = ActionEngine()
        self.producer = MessageProducer()

    def build_context(self, tenant, contact, conv, pipeline_state):

        history = self.memory.get_memory(tenant, contact, conv)

        return {
            "pipeline_stage": pipeline_state,
            "history": history[-10:]
        }

    def handle(self, payload):

        tenant = payload["tenantId"]
        contact = payload["contactId"]
        conv = payload["conversationId"]
        msg = payload["mensaje"]
        ts = payload["timestamp"]

        if self.memory.is_processed(tenant, contact, conv, ts):
            return

        # Guardar primero
        self.memory.save_message(tenant, contact, conv, "user", msg)

        # Pipeline
        pipeline_state = self.pipeline.ensure_pipeline(tenant, contact)

        # Contexto
        context = self.build_context(tenant, contact, conv, pipeline_state)

        # IA
        ai_result = self.ai.generate_with_actions(msg, context)

        response = ai_result.get("response", "Error")
        actions = ai_result.get("actions", [])

        # Acciones
        for action in actions:
            self.actions.execute(action, tenant, contact)

        # Guardar respuesta
        self.memory.save_message(tenant, contact, conv, "assistant", response)

        # Enviar
        self.producer.send_response(tenant, contact, conv, response)

# ==============================
# APP
# ==============================
class AIAgentApp:

    def __init__(self):
        self.orchestrator = MessageOrchestrator()
        self.consumer = MessageConsumer(self.orchestrator.handle)

    def run(self):
        logger.info("🚀 AI Agent started")
        self.consumer.start()


if __name__ == "__main__":
    app = AIAgentApp()
    app.run()