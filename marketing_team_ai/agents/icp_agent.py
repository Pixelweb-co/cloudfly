from crewai import Agent
from langchain_openai import ChatOpenAI
import os

llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.2
)

icp_agent = Agent(
    role="ICP Marketing Strategist",
    goal="Analizar compañías y detectar nichos B2B ideales",
    backstory="Experto en neuromarketing, ventas B2B y prospección empresarial.",
    verbose=True,
    allow_delegation=False,
    llm=llm
)
