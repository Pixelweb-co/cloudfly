import os
import logging
from typing import List, Dict, Any
from apify_client import ApifyClientAsync
from ...domain.models import SearchFilters, Lead
from ...domain.repository import LeadRepository

logger = logging.getLogger("apify-repository")

class ApifyLeadRepository(LeadRepository):
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.client = ApifyClientAsync(token=self.token) if self.token else None
        
        # Actor mappings
        self.actors = {
            "auto": "compass/crawler-google-places",
            "google_maps": "compass/crawler-google-places",
            "google_search": "apify/google-search-scraper"
        }

    async def generate(self, filters: SearchFilters) -> List[Lead]:
        if not self.client:
            logger.error("APIFY_TOKEN not found or client not initialized")
            return []

        actor_id = self.actors.get(filters.source, self.actors["auto"])
        
        # Construct precise query
        location_parts = [p for p in [filters.city, filters.state, filters.country] if p]
        location_str = ", ".join(location_parts)
        search_query = f"{filters.keyword} in {location_str}" if location_str else filters.keyword
        
        logger.info(f"🚀 [APIFY-SDK] Using actor {actor_id} for: {search_query}")

        # Prepare input based on actor type
        actor_input = self._prepare_input(actor_id, search_query, filters.limit)

        try:
            # call() starts the actor and waits for it to finish
            run = await self.client.actor(actor_id).call(run_input=actor_input)
            
            if not run:
                logger.warning(f"⚠️ [APIFY-SDK] Run for {actor_id} failed")
                return []

            dataset_id = run.get("defaultDatasetId")
            logger.info(f"📥 [APIFY-SDK] Fetching results from dataset: {dataset_id}")
            
            dataset_items = await self.client.dataset(dataset_id).list_items()
            items = dataset_items.items
            
            return self._transform_results(items, actor_id)

        except Exception as e:
            logger.error(f"❌ [APIFY-SDK] Error during execution of {actor_id}: {str(e)}", exc_info=True)
            return []

    def _prepare_input(self, actor_id: str, query: str, limit: int) -> Dict[str, Any]:
        if "google-search-scraper" in actor_id:
            return {
                "queries": query, # Sometimes it's a string with newlines or list
                "maxPagesPerQuery": 1,
                "resultsPerPage": limit,
                "mobileResults": False
            }
        else: # Default for google-places
            return {
                "searchStringsArray": [query],
                "maxItems": limit,
            }

    def _transform_results(self, items: List[dict], actor_id: str) -> List[Lead]:
        leads = []
        for item in items:
            if "google-search-scraper" in actor_id:
                # Search scraper results have a different structure (organic results)
                # This is more for general search, might not be ideal for leads directly
                # but we'll try to map it.
                organic_results = item.get("organicResults", [])
                for res in organic_results:
                    leads.append(Lead(
                        name=res.get("title", "Unknown"),
                        company="Search Result",
                        phone=None, # Search scraper usually doesn't have phones directly
                        city=None,
                        score="COLD"
                    ))
            else:
                # Google Places structure
                name = item.get("title") or item.get("name", "Unknown")
                phone = item.get("phone") or item.get("phoneNumber")
                
                # Safe extraction of city
                address = item.get("address") or ""
                city = item.get("city") or (address.split(",")[-1].strip() if "," in address else "Unknown")
                
                category = item.get("categoryName") or "Business"
                
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
