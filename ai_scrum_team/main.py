import os
from fastapi import FastAPI, Depends
from ai_scrum_team.handoff_endpoint import router as handoff_router

app = FastAPI(title="AI Scrum Team Service", version="1.0.0")

# Existing routers
# from ai_scrum_team.main import router as main_router
# app.include_router(main_router, prefix="/ia_scrum_team")

# Include new handoff router
app.include_router(handoff_router, prefix="/ia_scrum_team")

# Health endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}
