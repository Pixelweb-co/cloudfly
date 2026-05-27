from crewai import Agent
from langchain_openai import ChatOpenAI
import os

# Shared LLM instance for agents
llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.2"))
)

# Default generic ICP agent (keeps backstory generic to avoid hard-coded categories)
icp_agent = Agent(
    role="ICP Marketing Strategist Expert for Local Businesses",
    goal="Identificar nichos comerciales B2B y categorías específicas de negocios locales que puedan beneficiarse de un producto dado.",
    backstory="""Eres un estratega de marketing B2B experto en identificar oportunidades en el sector retail, salud, belleza y comercio local. 
    Cuando se te proporciona un producto, generas los ICP y categorías específicas en función de la descripción del producto y su caso de uso. No introduzcas listas genéricas por defecto: adapta la salida al producto proporcionado.""",
    verbose=True,
    allow_delegation=False,
    llm=llm
)


def create_icp_agent(product_name: str = None, product_description: str = None) -> Agent:
    """Factory to create a product-specific ICP agent with a priming backstory.

    This ensures the agent focuses on the provided product instead of returning a static
    set of categories from a hard-coded backstory.
    """
    prod_name = product_name or "<producto>"
    prod_desc = product_description or ""

    backstory = f"""Eres un estratega de marketing B2B con experiencia en identificar nichos locales. """
    backstory += f" Analiza exclusivamente el producto: {prod_name}. Descripción: {prod_desc}."
    backstory += (
        " Genera un JSON con `is_b2b`, una lista de hasta 8 categorías de búsqueda (Google Maps/otros) "
        "muy específicas y relevantes para encontrar clientes potenciales para este producto, y además una lista de hasta 5 "
        "oportunidades de negocio (necesidades detectadas, segmentos con demanda o casos de uso) que justifiquen la prospección. "
        "No uses listas genéricas salvo que el producto lo justifique. Responde únicamente con JSON válido."
    )

    return Agent(
        role="ICP Marketing Strategist Expert (product-specific)",
        goal=f"Generar ICP y categorías específicas para el producto: {prod_name}",
        backstory=backstory,
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
