from crewai import Agent

from agents.llm_config import llm

qualification_agent = Agent(
    role="Lead Qualification Expert",
    goal="Calificar leads con potencial real de compra",
    backstory="Especialista en scoring de leads y ventas B2B.",
    verbose=True,
    allow_delegation=False,
    llm=llm
)