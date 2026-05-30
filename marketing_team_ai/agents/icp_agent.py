from crewai import Agent

from agents.llm_config import llm


def create_icp_agent(product_name: str = None, product_description: str = None) -> Agent:
    """Factory to create a product-specific ICP agent with a priming backstory."""
    prod_name = product_name or "<producto>"
    prod_desc = product_description or ""

    backstory = """Eres un estratega de marketing B2B con experiencia en identificar nichos locales. """
    backstory += f" Analiza exclusivamente el producto: {prod_name}. Descripción: {prod_desc}."
    backstory += (
        " Genera un JSON con is_b2b, una lista de hasta 8 categorías de búsqueda (Google Maps/otros) "
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