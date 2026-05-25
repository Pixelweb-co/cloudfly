from dataclasses import dataclass
from typing import Optional

@dataclass
class CampaignMessage:
    text: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None
