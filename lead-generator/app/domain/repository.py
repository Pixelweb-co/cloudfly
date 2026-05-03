from abc import ABC, abstractmethod
from typing import List
from .models import SearchFilters, Lead

class LeadRepository(ABC):
    @abstractmethod
    async def generate(self, filters: SearchFilters) -> List[Lead]:
        pass
