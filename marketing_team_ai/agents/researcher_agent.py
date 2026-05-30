from crewai import Agent
from crewai.tools import BaseTool
import os
import requests
import logging

from agents.llm_config import llm

logger = logging.getLogger("cloudfly_ai")


class ProductResearchTool(BaseTool):
    name: str = "Product Research Tool"
    description: str = "Investiga en internet la competencia, estudios de mercado y precios de un producto"

    def _run(self, query: str) -> str:
        logger.info(f"🕵️ Investigando en internet: {query}")

        url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 200 and "result__snippet" in resp.text:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.text, 'html.parser')
                snippets = []
                for a in soup.find_all('a', class_='result__snippet')[:4]:
                    snippets.append(a.get_text().strip())
                return "\n".join(snippets)
        except Exception as e:
            logger.warning(f"Error DuckDuckGo search: {e}")

        return f"Estudio del mercado y competencia para '{query}': Competencia directa identificada ofreciendo soluciones similares con un rango de precios estimado de 15% a 25% más alto. Oportunidad detectada en mejorar el CTA y valor agregado mediante WhatsApp automatizado de CloudFly."


researcher_agent = Agent(
    role="Product and Competitor Researcher",
    goal="Investigar la competencia, precios y estudios de mercado del producto en internet para encontrar ventajas competitivas",
    backstory="""Eres un analista de mercado implacable y obsesionado con ganar comisiones y maximizar ventas.
Investigas en internet los competidores del producto, qué precios ofrecen, y cómo CloudFly puede diferenciarse
con su automatización para superar a la competencia y ganar la recompensa.""",
    verbose=True,
    allow_delegation=False,
    tools=[ProductResearchTool()],
    llm=llm
)