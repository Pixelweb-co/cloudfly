from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import os
import uuid
from .ai_ad_service import generate_image_ad
from .campaign_service import get_campaign, attach_image_to_campaign
from .redis_client import redis_client

app = FastAPI(title="Marketing Agent API")
router = APIRouter()

class ImageAdRequest(BaseModel):
    campaign_id: int = Field(..., description="ID of the campaign")
    product: dict = Field(..., description="Product data (name, description, visual_attrs)")

@router.post("/ads/image", summary="Generate image ad for a campaign")
async def create_image_ad(req: ImageAdRequest):
    campaign = await get_campaign(req.campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    try:
        image_bytes = await generate_image_ad(req.product)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    image_id = str(uuid.uuid4())
    redis_key = f"ad_image:{image_id}"
    await redis_client.set(redis_key, image_bytes, ex=300)
    domain = os.getenv('MARKETING_WORKER_DOMAIN', 'localhost')
    image_url = f"https://{domain}/static/ads/{image_id}.png"
    await attach_image_to_campaign(req.campaign_id, image_url)
    return {"image_url": image_url, "campaign_id": req.campaign_id}

app.include_router(router)
