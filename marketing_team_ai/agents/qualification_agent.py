from crewai import Agent
from langchain_openai import ChatOpenAI
import os

llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.2
)

qualification_agent = Agent(
    role="Lead Qualification Expert",
    goal="Calificar leads con potencial real de compra",
    backstory="Especialista en scoring de leads y ventas B2B.",
    verbose=True,
    allow_delegation=False,
    llm=llm
)
