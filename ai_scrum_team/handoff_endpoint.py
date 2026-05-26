# handoff_endpoint.py
"""FastAPI endpoint for AI handoff logic.
Implements POST /handoff as required by CLOUD-147.
The endpoint receives a JSON payload describing a ticket and returns routing info.
No extra fields are added beyond the specification.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter()

class HandoffRequest(BaseModel):
    ticket_id: str = Field(..., description="Unique identifier of the ticket")
    priority: Literal["low", "medium", "high"] = Field(..., description="Ticket priority")
    language: str = Field(..., description="Language code, e.g., 'en', 'es'")
    product: str = Field(..., description="Product name related to the ticket")

class HandoffResponse(BaseModel):
    agent: str = Field(..., description="Name of the AI agent to handle the ticket")
    reason: str = Field(..., description="Reason for routing decision")

def _select_agent(req: HandoffRequest) -> HandoffResponse:
    """Simple deterministic routing logic.
    * High priority → "senior_agent"
    * Language Spanish → "spanish_agent"
    * Product "billing" → "billing_agent"
    * Default → "general_agent"
    """
    if req.priority == "high":
        return HandoffResponse(agent="senior_agent", reason="high priority ticket")
    if req.language.lower() == "es":
        return HandoffResponse(agent="spanish_agent", reason="Spanish language ticket")
    if req.product.lower() == "billing":
        return HandoffResponse(agent="billing_agent", reason="billing related ticket")
    return HandoffResponse(agent="general_agent", reason="default routing")

@router.post("/handoff", response_model=HandoffResponse)
def handoff(request: HandoffRequest):
    """Endpoint to decide which AI agent should handle a ticket.
    Returns a deterministic agent name and the reason.
    """
    try:
        return _select_agent(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
