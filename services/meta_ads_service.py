import os
import requests
from config import Config

class MetaAdsException(RuntimeError):
    """Custom exception for Meta Ads service errors."""

    def __init__(self, message: str = ""):
        super().__init__(message)

class MetaAdsService:
    """Service to interact with Meta Ads API.
    Only the methods required by the test suite are implemented.
    """

    def __init__(self):
        self.access_token = Config.META_ACCESS_TOKEN
        self.ad_account_id = Config.META_AD_ACCOUNT_ID
        self.page_id = Config.META_PAGE_ID
        if not self.access_token:
            raise MetaAdsException("META_ACCESS_TOKEN is required")
        if not self.ad_account_id:
            raise MetaAdsException("META_AD_ACCOUNT_ID is required")
        if not self.page_id:
            raise MetaAdsException("META_PAGE_ID is required")
        # Ensure ad_account_id starts with act_
        if not self.ad_account_id.startswith("act_"):
            self.ad_account_id = f"act_{self.ad_account_id}"
        self.base_url = "https://graph.facebook.com/v18.0"
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Image upload
    # ------------------------------------------------------------------
    def upload_image(self, image_url: str) -> str:
        """Download image and upload to Meta.
        Returns the image hash.
        """
        try:
            img_resp = requests.get(image_url, timeout=30)
            img_resp.raise_for_status()
            image_bytes = img_resp.content
        except Exception as exc:
            raise MetaAdsException(f"Failed to download image: {exc}")

        upload_url = f"{self.base_url}/{self.ad_account_id}/adimages"
        files = {"file": ("image.jpg", image_bytes)}
        try:
            resp = requests.post(upload_url, headers=self.headers, files=files, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            images = data.get("images", {})
            if not images:
                raise MetaAdsException("No image hash returned")
            # take first hash
            hash_value = next(iter(images.values()))["hash"]
            return hash_value
        except Exception as exc:
            raise MetaAdsException(f"Image upload failed: {exc}")

    # ------------------------------------------------------------------
    # Ad creative
    # ------------------------------------------------------------------
    def create_ad_creative(
        self,
        name: str,
        image_hash: str,
        headline: str,
        primary_text: str,
        description: str,
        cta: str,
    ) -> str:
        url = f"{self.base_url}/{self.ad_account_id}/adcreatives"
        payload = {
            "name": name,
            "object_story_spec": {
                "page_id": self.page_id,
                "link_data": {
                    "image_hash": image_hash,
                    "link": "https://example.com",
                    "message": primary_text,
                    "caption": headline,
                    "description": description,
                    "call_to_action": {"type": cta},
                },
            },
        }
        try:
            resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            creative_id = data.get("id")
            if not creative_id:
                raise MetaAdsException("Failed to create ad creative")
            return creative_id
        except Exception as exc:
            raise MetaAdsException(f"Ad creative creation failed: {exc}")

    # ------------------------------------------------------------------
    # Campaign
    # ------------------------------------------------------------------
    def create_campaign(self, name: str) -> str:
        url = f"{self.base_url}/{self.ad_account_id}/campaigns"
        payload = {"name": name, "status": "PAUSED", "objective": "LINK_CLICKS"}
        try:
            resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            campaign_id = data.get("id")
            if not campaign_id:
                raise MetaAdsException("Failed to create campaign")
            return campaign_id
        except Exception as exc:
            raise MetaAdsException(f"Campaign creation failed: {exc}")

    # ------------------------------------------------------------------
    # Ad set
    # ------------------------------------------------------------------
    def create_ad_set(self, name: str, campaign_id: str, daily_budget: int = None) -> str:
        url = f"{self.base_url}/{self.ad_account_id}/adsets"
        payload = {
            "name": name,
            "campaign_id": campaign_id,
            "daily_budget": daily_budget,
            "billing_event": "IMPRESSIONS",
            "optimization_goal": "REACH",
            "bid_amount": 1000,
            "targeting": {"geo_locations": {"countries": ["CO"]}},
            "promoted_object": {"page_id": self.page_id},
            "status": "PAUSED",
        }
        try:
            resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            adset_id = data.get("id")
            if not adset_id:
                raise MetaAdsException("Failed to create ad set")
            return adset_id
        except Exception as exc:
            raise MetaAdsException(f"Ad set creation failed: {exc}")

    # ------------------------------------------------------------------
    # Ad
    # ------------------------------------------------------------------
    def create_ad(self, name: str, ad_set_id: str, creative_id: str) -> str:
        url = f"{self.base_url}/{self.ad_account_id}/ads"
        payload = {
            "name": name,
            "adset_id": ad_set_id,
            "creative": {"creative_id": creative_id},
            "status": "PAUSED",
        }
        try:
            resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            ad_id = data.get("id")
            if not ad_id:
                raise MetaAdsException("Failed to create ad")
            return ad_id
        except Exception as exc:
            raise MetaAdsException(f"Ad creation failed: {exc}")

    # ------------------------------------------------------------------
    # Complete flow helper
    # ------------------------------------------------------------------
    def create_complete_ad(
        self,
        product: dict,
        ad_content: dict,
        daily_budget_cop: int = None,
    ) -> dict:
        if "image_url" not in product:
            raise MetaAdsException("Product missing image_url")
        image_hash = self.upload_image(product["image_url"])
        creative_id = self.create_ad_creative(
            name=ad_content["headline"],
            image_hash=image_hash,
            headline=ad_content["headline"],
            primary_text=ad_content["primary_text"],
            description=ad_content["description"],
            cta=ad_content["cta"],
        )
        campaign_id = self.create_campaign(name=ad_content["headline"])
        adset_id = self.create_ad_set(name=ad_content["headline"], campaign_id=campaign_id, daily_budget=daily_budget_cop)
        ad_id = self.create_ad(name=ad_content["headline"], ad_set_id=adset_id, creative_id=creative_id)
        return {
            "image_hash": image_hash,
            "creative_id": creative_id,
            "campaign_id": campaign_id,
            "ad_set_id": adset_id,
            "ad_id": ad_id,
            "product_name": product.get("productName"),
            "daily_budget_cop": daily_budget_cop,
        }

    # ------------------------------------------------------------------
    # Ad status
    # ------------------------------------------------------------------
    def get_ad_status(self, ad_id: str) -> dict:
        url = f"{self.base_url}/{ad_id}"
        try:
            resp = requests.get(url, headers=self.headers, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            raise MetaAdsException(f"Failed to get ad status: {exc}")

    # ------------------------------------------------------------------
    # Activate / pause
    # ------------------------------------------------------------------
    def activate_ad(self, ad_id: str) -> bool:
        url = f"{self.base_url}/{ad_id}"
        payload = {"status": "ACTIVE"}
        try:
            resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
            resp.raise_for_status()
            return True
        except Exception:
            return False

    def pause_ad(self, ad_id: str) -> bool:
        url = f"{self.base_url}/{ad_id}"
        payload = {"status": "PAUSED"}
        try:
            resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
            resp.raise_for_status()
            return True
        except Exception:
            return False
