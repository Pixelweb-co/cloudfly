from crewai import Agent
from langchain_openai import ChatOpenAI
import os

llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.7
)

copywriter_agent = Agent(
    role="WhatsApp Marketing Copywriter",
    goal="Crear mensajes persuasivos de WhatsApp que conviertan leads en reuniones",
    backstory="Copywriter experto en ventas conversacionales y campañas automatizadas.",
    verbose=True,
    allow_delegation=False,
    llm=llm
)
