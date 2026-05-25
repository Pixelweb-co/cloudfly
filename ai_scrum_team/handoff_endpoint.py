import os
import logging
import requests
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Any, Dict

router = APIRouter()

logger = logging.getLogger("handoff")

class HandoffRequest(BaseModel):
    ticket_id: str = Field(..., description="Unique identifier of the ticket")
    user_id: str = Field(..., description="User initiating the handoff")
    context: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary context data")
    priority: int = Field(0, ge=0, le=5, description="Priority level 0-5")

def forward_to_agent(payload: dict) -> requests.Response:
    ai_agent_url = os.getenv("AI_AGENT_URL", "http://ai-agent:6180/handoff")
    token = os.getenv("AI_AGENT_TOKEN")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.post(ai_agent_url, json=payload, headers=headers, timeout=10)
    return response

@router.post("/handoff", status_code=status.HTTP_202_ACCEPTED)
async def handoff(request: Request, payload: HandoffRequest):
    # Simple auth check – expect header X-Auth-Token matching env variable
    auth_token = os.getenv("HANDOFF_AUTH_TOKEN")
    incoming = request.headers.get("X-Auth-Token")
    if auth_token and incoming != auth_token:
        raise HTTPException(status_code=401, detail="Unauthorized handoff request")
    try:
        logger.info("Received handoff request", extra={"ticket_id": payload.ticket_id})
        resp = forward_to_agent(payload.model_dump())
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.error("Failed to forward handoff", exc_info=exc)
        raise HTTPException(status_code=502, detail="Failed to forward to AI agent")
    return JSONResponse(content={"status": "queued", "ticket_id": payload.ticket_id})
