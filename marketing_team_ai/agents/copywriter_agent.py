from crewai import Agent
import logging

from agents.llm_config import llm

logger = logging.getLogger("cloudfly_ai")

copywriter_agent = Agent(
    role="WhatsApp Marketing Copywriter",
    goal="Crear mensajes persuasivos de WhatsApp que conviertan leads en reuniones",
    backstory="Copywriter experto en ventas conversacionales y campañas automatizadas.",
    verbose=True,
    allow_delegation=False,
    llm=llm
)