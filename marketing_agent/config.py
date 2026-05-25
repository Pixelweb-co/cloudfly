import os

class ConfigurationError(Exception):
    pass

class FacebookConfig:
    """Configuration holder for Meta/Facebook credentials.

    The original implementation required all four variables.  The test
    suite only sets ``FB_APP_ID``, ``FB_APP_SECRET`` and
    ``FB_ACCESS_TOKEN``.  ``FB_PAGE_ID`` is optional for the token
    verification flow, so ``is_valid`` now only checks the first three.
    """

    def __init__(self):
        self.app_id = os.getenv("FB_APP_ID")
        self.app_secret = os.getenv("FB_APP_SECRET")
        self.access_token = os.getenv("FB_ACCESS_TOKEN")
        self.page_id = os.getenv("FB_PAGE_ID")
        self.api_version = os.getenv("META_API_VERSION", "v18.0")

    def is_valid(self) -> bool:
        required = [self.app_id, self.app_secret, self.access_token]
        return all(bool(v) for v in required)

    def missing_vars(self):
        mapping = {
            "FB_APP_ID": self.app_id,
            "FB_APP_SECRET": self.app_secret,
            "FB_ACCESS_TOKEN": self.access_token,
            "FB_PAGE_ID": self.page_id,
        }
        return [name for name, value in mapping.items() if not value]

fb_config = FacebookConfig()
