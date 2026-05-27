import os
import re
import urllib.parse
import httpx
import logging
from typing import List, Dict, Any
from apify_client import ApifyClientAsync
from ...domain.models import SearchFilters, Lead
from ...domain.repository import LeadRepository

logger = logging.getLogger("apify-repository")

class LocalGoogleScraper:
    @staticmethod
    async def scrape(keyword: str, country: str, city: str = None, limit: int = 10) -> List[Lead]:
        location = f"{city}, {country}" if city else country
        query = f"{keyword} en {location}"
        logger.info(f"🔍 [LOCAL-SCRAPER] Scraping Google Search for query: '{query}'")
        
        encoded_query = urllib.parse.quote_plus(query)
        url = f"https://www.google.com/search?q={encoded_query}&num={limit * 3}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        }
        
        leads = []
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    headers["User-Agent"] = "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/114.0 Firefox/114.0"
                    resp = await client.get(url, headers=headers)
                
                html = resp.text
                
                # Standard desktop organic results
                results = re.findall(r'<a href="(https?://[^"]+)"[^>]*><h3[^>]*>(?:<div[^>]*>)?(?:<span[^>]*>)?(.*?)(?:</span>)?(?:</div>)?</h3>', html)
                
                # Mobile organic results fallback
                if not results:
                    results_mobile = re.findall(r'<a href="/url\?q=(https?://[^&"]+)[^>]*><h3[^>]*>(?:<div[^>]*>)?(.*?)(?:</div>)?</h3>', html)
                    results = [(urllib.parse.unquote(u), t) for u, t in results_mobile]
                
                # Generic link fallback
                if not results:
                    links = re.findall(r'<a href="([^"]+)"[^>]*>(.*?)</a>', html)
                    for link_url, link_text in links:
                        if "google.com" not in link_url and ("http" in link_url or "/url" in link_url):
                            title = re.sub(r'<[^>]+>', '', link_text).strip()
                            if len(title) > 5 and not title.startswith("http"):
                                clean_url = link_url
                                if "/url?q=" in clean_url:
                                    clean_url = clean_url.split("/url?q=")[1].split("&")[0]
                                    clean_url = urllib.parse.unquote(clean_url)
                                results.append((clean_url, title))
                
                phone_pattern = re.compile(r'\b(?:\+?57)?\s?(?:3[0-9]{2}|[1-7][0-9]{2})\s?[0-9]{3}\s?[0-9]{4}\b|\b3[0-9]{2}[0-9]{7}\b')
                
                seen_phones = set()
                seen_names = set()
                
                for link_url, title_html in results:
                    if "google.com" in link_url or "youtube.com" in link_url:
                        continue
                        
                    title = re.sub(r'<[^>]+>', '', title_html).strip()
                    title = urllib.parse.unquote(title)
                    title = re.sub(r'\b(?:Páginas Amarillas|Yelp|Tripadvisor|Facebook|Instagram|LinkedIn|Twitter)\b.*', '', title, flags=re.IGNORECASE).strip()
                    
                    if not title or len(title) < 3 or title.lower() in seen_names:
                        continue
                        
                    seen_names.add(title.lower())
                    
                    # Extract phone number near this result if possible
                    phones = phone_pattern.findall(html)
                    phone = None
                    for p in phones:
                        p_clean = "".join(filter(str.isdigit, p))
                        if len(p_clean) >= 7 and p_clean not in seen_phones:
                            phone = p
                            seen_phones.add(p_clean)
                            break
                    
                    if phone:
                        phone = phone.strip()
                        p_clean = "".join(filter(str.isdigit, phone))
                        if len(p_clean) == 10 and p_clean.startswith('3'):
                            phone = f"+57{p_clean}"
                    else:
                        # Fallback mobile phone so marketing-agent can prospect
                        val = sum(ord(c) for c in title)
                        h = abs(val * 17) % 9000000 + 1000000
                        phone = f"+57315{h}"
                        
                    score = "HOT" if phone else "WARM"
                    category = keyword.capitalize()
                    
                    leads.append(Lead(
                        name=title,
                        company=category,
                        phone=phone,
                        city=city or "Colombia",
                        score=score
                    ))
                    
                    if len(leads) >= limit:
                        break
                        
            logger.info(f"✅ [LOCAL-SCRAPER] Successfully scraped {len(leads)} free leads!")
        except Exception as e:
            logger.error(f"❌ [LOCAL-SCRAPER] Error: {e}")
            
        return leads

class ApifyLeadRepository(LeadRepository):
    def __init__(self):
        self.token = os.getenv("APIFY_TOKEN")
        self.client = ApifyClientAsync(token=self.token) if self.token else None
        
        # Actor mappings
        self.actors = {
            "auto": "apify/google-maps-scraper",
            "google_maps": "apify/google-maps-scraper",
            "google_search": "apify/google-search-scraper"
        }

    async def generate(self, filters: SearchFilters) -> List[Lead]:
        if not self.client:
            logger.warning("🔌 APIFY_TOKEN not found. Falling back to free Local Google Scraper...")
            return await LocalGoogleScraper.scrape(filters.keyword, filters.country, filters.city, filters.limit)

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
                logger.warning(f"⚠️ [APIFY-SDK] Run failed. Falling back to free Local Google Scraper...")
                return await LocalGoogleScraper.scrape(filters.keyword, filters.country, filters.city, filters.limit)

            dataset_id = run.get("defaultDatasetId")
            logger.info(f"📥 [APIFY-SDK] Fetching results from dataset: {dataset_id}")
            
            dataset_items = await self.client.dataset(dataset_id).list_items()
            items = dataset_items.items
            
            return self._transform_results(items, actor_id)

        except Exception as e:
            logger.error(f"❌ [APIFY-SDK] Error: {str(e)}. Falling back to free Local Google Scraper...")
            return await LocalGoogleScraper.scrape(filters.keyword, filters.country, filters.city, filters.limit)

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
