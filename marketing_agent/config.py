import os

class ConfigurationError(Exception):
    pass

class FacebookConfig:
    """Configuration holder for Meta/Facebook credentials.

    The original implementation raised an exception at import time if any
    environment variable was missing.  This broke unit tests that purposefully
    unset the variables to verify validation logic.  The new implementation
    lazily validates the presence of required variables via :meth:`is_valid`
    and provides sensible defaults where appropriate.
    """

    def __init__(self):
        # Environment variable names follow the legacy ``FB_`` prefix used
        # throughout the codebase.
        self.app_id = os.getenv("FB_APP_ID")
        self.app_secret = os.getenv("FB_APP_SECRET")
        self.access_token = os.getenv("FB_ACCESS_TOKEN")
        self.page_id = os.getenv("FB_PAGE_ID")
        # Default API version – can be overridden by ``META_API_VERSION``
        self.api_version = os.getenv("META_API_VERSION", "v18.0")

    def is_valid(self) -> bool:
        """Return ``True`` if all required credentials are present.

        The method does **not** raise; it simply checks that each required
        attribute is a non‑empty string.
        """
        required = [self.app_id, self.app_secret, self.access_token, self.page_id]
        return all(bool(v) for v in required)

    def missing_vars(self):
        """Return a list of missing environment variable names.
        Useful for debugging or error messages.
        """
        mapping = {
            "FB_APP_ID": self.app_id,
            "FB_APP_SECRET": self.app_secret,
            "FB_ACCESS_TOKEN": self.access_token,
            "FB_PAGE_ID": self.page_id,
        }
        return [name for name, value in mapping.items() if not value]

# Backward‑compatible alias used by existing code.
fb_config = FacebookConfig()
