"""
Prospector service for marketing_team_ai — Kafka async lead search (no HTTP to scraper).
"""

import logging
import re
from typing import Dict, List, Optional

from services.lead_search_job_service import LeadSearchJobService

logger = logging.getLogger("marketing_team_ai.prospector")


class ProspectorService:
    def __init__(self):
        self.lead_search = LeadSearchJobService()

    def _remove_accents(self, s: str) -> str:
        accents = {
            "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
            "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U",
            "ñ": "n", "Ñ": "N", "ü": "u", "Ü": "U",
        }
        return "".join(accents.get(c, c) for c in s)

    def normalize_keyword(self, keyword: str) -> str:
        if not keyword:
            return keyword
        keyword = re.sub(r"\[.*?\]", "", keyword).lower()
        keyword = self._remove_accents(keyword)
        for n in (
            r"\bcerca de mi\b", r"\bcerca\b", r"\ben linea\b",
            r"\bcon servicio a domicilio\b", r"\blocales\b",
        ):
            keyword = re.sub(n, "", keyword)
        keyword = re.sub(r"[\,\.\;\:\"\(\)\[\]]", "", keyword)
        keyword = re.sub(r"\s+", " ", keyword).strip()
        words = keyword.split()
        if not words:
            return keyword
        first = words[0]
        if len(words) >= 3 and words[1] == "de":
            return f"{first} de {words[2]}"
        return first

    def clean_and_normalize_phone(self, phone_str: str, country: str = "Colombia") -> str:
        if not phone_str:
            return ""
        digits = "".join(filter(str.isdigit, phone_str))
        if not digits:
            return ""
        country_lower = (country or "colombia").lower()
        if "colombia" in country_lower:
            if len(digits) == 10 and digits.startswith("3"):
                return "57" + digits
            if len(digits) == 12 and digits.startswith("57"):
                return digits
        return digits

    def submit_lead_search_request(
        self,
        *,
        keyword: str,
        country: str = "Colombia",
        city: Optional[str] = None,
        cities: Optional[List[str]] = None,
        limit: int = 10,
        company_id: int,
        product_id: Optional[int],
        tenant_id: Optional[int],
        context: Optional[dict] = None,
    ) -> str:
        """Publish async job to Kafka. Returns request_id."""
        normalized = self.normalize_keyword(keyword)
        city_list = cities or ([city] if city else [])
        return self.lead_search.create_and_publish(
            category=normalized,
            country=country,
            company_id=company_id,
            product_id=product_id,
            tenant_id=tenant_id,
            cities=city_list,
            max_leads=limit,
            context=context,
            pages=1,
        )

    def fetch_leads_from_generator(
        self,
        keyword: str,
        country: str = "Colombia",
        state: str = None,
        city: str = None,
        limit: int = 50,
        company_id: int = None,
        product_id: int = None,
        tenant_id: int = None,
        context: dict = None,
    ) -> List[Dict]:
        """
        Async: publishes Kafka event and returns empty list immediately.
        Use submit_lead_search_request + consumer pipeline for real leads.
        Kept for CrewAI tool compatibility — logs warning if called without IDs.
        """
        if company_id is None:
            logger.warning(
                "fetch_leads_from_generator called without company_id; "
                "use submit_lead_search_request for Kafka pipeline."
            )
            return []

        request_id = self.submit_lead_search_request(
            keyword=keyword,
            country=country,
            city=city,
            limit=limit,
            company_id=company_id,
            product_id=product_id,
            tenant_id=tenant_id,
            context=context,
        )
        logger.info(
            "Async lead search queued request_id=%s keyword='%s' — pipeline continues on Kafka result",
            request_id,
            keyword,
        )
        return []

    def load_leads_by_job_id(self, job_id: int, country: str = "Colombia") -> List[Dict]:
        raw = self.lead_search.load_leads_for_job(job_id)
        leads = []
        for item in raw:
            clean = self.clean_and_normalize_phone(item.get("phone", ""), country)
            if clean:
                leads.append({**item, "phone": clean})
        return leads
