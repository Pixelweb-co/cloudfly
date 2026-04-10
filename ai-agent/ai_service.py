import logging
from openai import OpenAI
import mysql.connector
from . import config

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)

    def get_company_context(self, tenant_id):
        """
        Fetches company info from MySQL to build a personalized prompt.
        """
        try:
            conn = mysql.connector.connect(
                host=config.DB_HOST,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME
            )
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT name, nit, address, phone FROM companies WHERE tenant_id = %s", (tenant_id,))
            company = cursor.fetchone()
            conn.close()
            
            if company:
                return f"Compañía: {company['name']}\nNIT: {company['nit']}\nDirección: {company['address']}\nTeléfono: {company['phone']}"
            return "Compañía: CloudFly SaaS"
        except Exception as e:
            logger.error(f"Error fetching company context: {e}")
            return "Compañía: CloudFly SaaS"

    def detect_intent(self, message):
        """
        Basic intent detection for specialized responses.
        """
        msg = message.lower()
        if any(greet in msg for greet in ["hola", "buen", "saludos", "hi", "hello"]):
            return "GREETING"
        if any(prod in msg for prod in ["precio", "comprar", "costo", "producto", "servicios"]):
            return "PRODUCT_INQUIRY"
        return "GENERAL"

    def generate_response(self, tenant_id, contact_id, conversation_id, message, history):
        """
        Calls OpenAI GPT-4o with context and memory.
        """
        company_info = self.get_company_context(tenant_id)
        intent = self.detect_intent(message)

        system_prompt = f"""Ere un asistente de ventas profesional y servicial de la plataforma CloudFly.
Tu objetivo es ayudar al cliente con sus dudas.

INFORMACIÓN DE LA EMPRESA ACTUAL:
{company_info}

REGLAS:
- Saluda de forma amigable.
- Si el cliente pregunta por precios o productos, sé entusiasta.
- Mantén la respuesta concisa para WhatsApp (máximo 2-3 párrafos).
- No inventes información que no tienes.
"""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (Redis)
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})
        
        # Add new message
        messages.append({"role": "user", "content": message})

        try:
            response = self.client.chat.completions.create(
                model=config.OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                timeout=30
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling OpenAI: {e}")
            return "Lo siento, estoy experimentando dificultades técnicas. ¿Podrías repetir tu consulta en un momento?"
