from fastapi import APIRouter, Depends, HTTPException
from ...domain.models import LeadRequest, LeadResponse
from ...application.lead_service import LeadService
from ..repositories.apify_repository import ApifyLeadRepository

router = APIRouter()

# Simple DI for the service
def get_lead_service():
    repository = ApifyLeadRepository()
    return LeadService(repository)

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/leads/generate", response_model=LeadResponse)
async def generate(request: LeadRequest, service: LeadService = Depends(get_lead_service)):
    try:
        return await service.generate_leads(request.filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
