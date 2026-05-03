from ..domain.repository import LeadRepository
from ..domain.models import SearchFilters, LeadResponse

class LeadService:
    def __init__(self, repository: LeadRepository):
        self.repository = repository

    async def generate_leads(self, filters: SearchFilters) -> LeadResponse:
        leads = await self.repository.generate(filters)
        return LeadResponse(status="success", leads=leads)
