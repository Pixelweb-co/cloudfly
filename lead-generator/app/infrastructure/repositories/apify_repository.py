import os
import httpx
import logging
from typing import List
from ...domain.models import SearchFilters, Lead
from ...domain.repository import LeadRepository

logger = logging.getLogger("apify-repository")

class ApifyLeadRepository(LeadRepository):
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.base_url = os.getenv("APIFY_BASE_URL", "https://api.apify.com/v2")
        self.actor_id = "apify~google-maps-scraper"

    async def generate(self, filters: SearchFilters) -> List[Lead]:
        if not self.token:
            logger.error("APIFY_TOKEN not found in environment variables")
            return []

        search_query = f"{filters.keyword} {filters.location}" if filters.location else filters.keyword
        
        # 1. Prepare actor input
        # Google Maps Scraper input schema usually requires searchQueries
        actor_input = {
            "searchQueries": [search_query],
            "maxItems": filters.limit,
            "exportPlaceUrls": False,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 2. Start Actor Run
                logger.info(f"🚀 [APIFY] Starting run for query: {search_query}")
                run_url = f"{self.base_url}/acts/{self.actor_id}/runs"
                params = {"token": self.token, "waitForFinish": 30} # Wait up to 30s
                
                run_response = await client.post(run_url, json=actor_input, params=params)
                run_response.raise_for_status()
                run_data = run_response.json()["data"]
                
                status = run_data.get("status")
                dataset_id = run_data.get("defaultDatasetId")
                
                if not dataset_id:
                    logger.warning(f"⚠️ [APIFY] No dataset ID returned. Status: {status}")
                    return []

                # 3. Fetch Results from Dataset
                logger.info(f"📥 [APIFY] Fetching results from dataset: {dataset_id}")
                items_url = f"{self.base_url}/datasets/{dataset_id}/items"
                items_params = {"token": self.token}
                
                items_response = await client.get(items_url, params=items_params)
                items_response.raise_for_status()
                items = items_response.json()
                
                # 4. Transform and Score
                return self._transform_results(items)

            except Exception as e:
                logger.error(f"❌ [APIFY] Error during execution: {str(e)}")
                return []

    def _transform_results(self, items: List[dict]) -> List[Lead]:
        leads = []
        for item in items:
            name = item.get("title") or item.get("name", "Unknown")
            phone = item.get("phone") or item.get("phoneNumber")
            city = item.get("city") or item.get("address", "").split(",")[-1].strip()
            category = item.get("categoryName") or "Business"
            
            # Simple Scoring Logic
            score = "COLD"
            if phone:
                score = "HOT"
            elif item.get("website") or item.get("email"):
                score = "WARM"

            leads.append(Lead(
                name=name,
                company=category,
                phone=phone,
                city=city,
                score=score
            ))
        return leads
