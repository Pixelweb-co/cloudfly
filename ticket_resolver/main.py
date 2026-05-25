from fastapi import FastAPI
from api import router as api_router

app = FastAPI(title="Ticket Resolver Service")
app.include_router(api_router)
