from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from jira_client import JIRAClient

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/tickets", response_model=List[dict])
async def get_tickets(
    project: Optional[str] = Query(None),
    assignee: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    client: JIRAClient = Depends(JIRAClient)
):
    try:
        tickets = await client.fetch_pending_tickets(project, assignee, limit)
        return tickets
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
