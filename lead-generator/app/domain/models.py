from pydantic import BaseModel, Field
from typing import List, Optional

class SearchFilters(BaseModel):
    keyword: str
    location: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    source: str = "auto"
    enrich: bool = True

class LeadRequest(BaseModel):
    mode: str = "manual"
    filters: SearchFilters

class Lead(BaseModel):
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    score: str

class LeadResponse(BaseModel):
    status: str
    leads: List[Lead]
