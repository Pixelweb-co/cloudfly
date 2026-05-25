import requests
from ..config import FacebookConfig, fb_config

class FacebookAPI:
    """Thin wrapper around the Facebook Graph API.

    The wrapper is intentionally minimal – it only implements the
    operations required by the current test suite and the marketing
    agent.  Additional endpoints can be added later without changing
    the public interface.
    """

    BASE_URL = "https://graph.facebook.com"

    def __init__(self, config=None):
        # Create a fresh config instance if none provided to ensure
        # we pick up any environment variables set at runtime.
        self.config = config if config is not None else FacebookConfig()
        if not self.config.is_valid():
            raise ValueError("Facebook credentials are not fully configured")

    def _endpoint(self, path: str) -> str:
        return f"{self.BASE_URL}/{self.config.api_version}/{path}"

    def get_me(self) -> dict:
        """Return the authenticated user profile.

        Raises ``requests.HTTPError`` on non‑200 responses.
        """
        url = self._endpoint("me")
        params = {"access_token": self.config.access_token}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def create_campaign(self, name: str, objective: str, status: str = "PAUSED") -> dict:
        """Create a new campaign.

        The ``ad_account_id`` is expected to be configured elsewhere –
        for now we use a placeholder that should be replaced by the
        production configuration.
        """
        ad_account_id = "<AD_ACCOUNT_ID>"  # TODO: replace with real value
        url = self._endpoint(f"act_{ad_account_id}/campaigns")
        payload = {
            "name": name,
            "objective": objective,
            "status": status,
            "access_token": self.config.access_token,
        }
        resp = requests.post(url, data=payload, timeout=10)
        resp.raise_for_status()
        return resp.json()


class MetaAdsService:
    """High‑level service that uses :class:`FacebookAPI`.

    The service is intentionally lightweight – it only exposes the
    methods required by the current tests.  Future features (campaign
    creation, ad set management, etc.) can be added here.
    """

    def __init__(self, config=None):
        self.fb_api = FacebookAPI(config)

    def verify_token(self) -> bool:
        """Return ``True`` if the stored access token is valid.

        The method performs a simple ``/me`` call and returns ``True``
        on success.  Any exception results in ``False``.
        """
        try:
            self.fb_api.get_me()
            return True
        except Exception:
            return False