from crewai.tools import BaseTool
from services.prospector_service import ProspectorService

class ProspectingTool(BaseTool):
    name: str = "Lead Prospecting Tool"
    description: str = "Busca leads empresariales según un nicho específico"

    def _run(self, keyword: str, country: str = "Colombia"):
        service = ProspectorService()

        return service.fetch_leads_from_generator(
            keyword=keyword,
            country=country,
            state=None,
            city=None,
            limit=5
        )
