import random
from typing import List
from ...domain.models import SearchFilters, Lead
from ...domain.repository import LeadRepository

class MockLeadRepository(LeadRepository):
    async def generate(self, filters: SearchFilters) -> List[Lead]:
        limit = filters.limit
        leads = []
        scores = ["HOT", "WARM", "COLD"]
        cities = [filters.location] if filters.location else ["Medellín", "Bogotá", "Cali", "Barranquilla"]
        
        for i in range(1, limit + 1):
            leads.append(Lead(
                name=f"Negocio Dummy {i}",
                company=f"{filters.keyword.capitalize()} S.A.S {i}",
                phone=f"300{random.randint(1000000, 9999999)}",
                city=random.choice(cities),
                score=random.choice(scores)
            ))
        return leads
