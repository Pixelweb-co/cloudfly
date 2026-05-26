import os
import requests
from .config import ConfigurationError

class FacebookAPIError(RuntimeError):
    pass

class FacebookAPIClient:
    BASE_URL = "https://graph.facebook.com/v18.0"

    def __init__(self):
        self.app_id = os.getenv("FB_APP_ID")
        self.app_secret = os.getenv("FB_APP_SECRET")
        self.access_token = os.getenv("FB_ACCESS_TOKEN")
        self.page_id = os.getenv("FB_PAGE_ID")
        self._validate()

    def _validate(self):
        missing = [k for k, v in {
            "FB_APP_ID": self.app_id,
            "FB_APP_SECRET": self.app_secret,
            "FB_ACCESS_TOKEN": self.access_token,
            "FB_PAGE_ID": self.page_id,
        }.items() if not v]
        if missing:
            raise FacebookAPIError(f"Missing Facebook env vars: {', '.join(missing)}")

    def _request(self, method: str, endpoint: str, **kwargs):
        url = f"{self.BASE_URL}/{endpoint}"
        params = kwargs.pop("params", {})
        params["access_token"] = self.access_token
        response = requests.request(method, url, params=params, **kwargs)
        if response.status_code == 401:
            # try to refresh token and retry once
            self.refresh_token()
            params["access_token"] = self.access_token
            response = requests.request(method, url, params=params, **kwargs)
        if not response.ok:
            raise FacebookAPIError(
                f"Facebook API error {response.status_code}: {response.text}"
            )
        return response.json()

    def get_page_info(self):
        """Return basic information about the configured Facebook Page."""
        return self._request("GET", f"{self.page_id}")

    def publish_ad(self, ad_data: dict):
        """Publish an ad on the page. `ad_data` follows Meta Marketing API spec (simplified)."""
        endpoint = f"{self.page_id}/ads"
        return self._request("POST", endpoint, json=ad_data)

    def refresh_token(self):
        """Exchange the current short‑lived token for a long‑lived token."""
        token_url = f"{self.BASE_URL}/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": self.app_id,
            "client_secret": self.app_secret,
            "fb_exchange_token": self.access_token,
        }
        resp = requests.get(token_url, params=params)
        if not resp.ok:
            raise FacebookAPIError("Failed to refresh Facebook token")
        data = resp.json()
        self.access_token = data.get("access_token")
        if not self.access_token:
            raise FacebookAPIError("Refresh response missing access_token")
        return self.access_token
