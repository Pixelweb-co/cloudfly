import os
import logging
from typing import List
from apify_client import ApifyClientAsync
from ...domain.models import SearchFilters, Lead
from ...domain.repository import LeadRepository

logger = logging.getLogger("apify-repository")

class ApifyLeadRepository(LeadRepository):
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.actor_id = "apify~google-maps-scraper"
        self.client = ApifyClientAsync(token=self.token) if self.token else None

    async def generate(self, filters: SearchFilters) -> List[Lead]:
        if not self.client:
            logger.error("APIFY_TOKEN not found or client not initialized")
            return []

        search_query = f"{filters.keyword} {filters.location}" if filters.location else filters.keyword
        
        actor_input = {
            "searchQueries": [search_query],
            "maxItems": filters.limit,
            "exportPlaceUrls": False,
        }

        try:
            logger.info(f"🚀 [APIFY-SDK] Calling actor {self.actor_id} for: {search_query}")
            
            # call() starts the actor and waits for it to finish (sync-like but async)
            run = await self.client.actor(self.actor_id).call(run_input=actor_input)
            
            if not run:
                logger.warning("⚠️ [APIFY-SDK] Run failed or returned no data")
                return []

            dataset_id = run.get("defaultDatasetId")
            logger.info(f"📥 [APIFY-SDK] Fetching results from dataset: {dataset_id}")
            
            dataset_items = await self.client.dataset(dataset_id).list_items()
            items = dataset_items.items
            
            return self._transform_results(items)

        except Exception as e:
            logger.error(f"❌ [APIFY-SDK] Error during execution: {str(e)}", exc_info=True)
            return []

    def _transform_results(self, items: List[dict]) -> List[Lead]:
        leads = []
        for item in items:
            name = item.get("title") or item.get("name", "Unknown")
            phone = item.get("phone") or item.get("phoneNumber")
            city = item.get("city") or item.get("address", "").split(",")[-1].strip()
            category = item.get("categoryName") or "Business"
            
            # Scoring Logic
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
