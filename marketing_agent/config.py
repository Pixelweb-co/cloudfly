import os
from dataclasses import dataclass, field

@dataclass
class FacebookConfig:
    """Configuration holder for Facebook Marketing API credentials.

    The values are read from environment variables.  The class provides a
    simple ``is_valid`` method that can be used by the application to
    ensure that all required credentials are present before attempting
    to call the Graph API.
    """

    app_id: str = field(default_factory=lambda: os.getenv("FB_APP_ID", ""))
    app_secret: str = field(default_factory=lambda: os.getenv("FB_APP_SECRET", ""))
    access_token: str = field(default_factory=lambda: os.getenv("FB_ACCESS_TOKEN", ""))
    api_version: str = field(default_factory=lambda: os.getenv("FB_API_VERSION", "v18.0"))

    def is_valid(self) -> bool:
        """Return ``True`` if all required credentials are present."""
        return all([self.app_id, self.app_secret, self.access_token])

# Singleton instance used by the rest of the package
fb_config = FacebookConfig()
