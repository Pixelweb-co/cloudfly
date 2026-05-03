from fastapi import FastAPI
from app.infrastructure.api.routes import router

app = FastAPI(title="CloudFly Lead Generator - Hexagonal")

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
