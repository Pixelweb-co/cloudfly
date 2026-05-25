from dataclasses import dataclass
from typing import Optional

@dataclass
class CampaignMessage:
    """
    Data class representing a marketing campaign message.
    
    Attributes:
        text: The message text content (WhatsApp Markdown formatted)
        media_url: URL of the media file (image/video) if applicable
        media_type: Type of media ('image', 'video', 'audio', 'document')
        caption: Caption for media messages
    """
    text: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None
    
    def has_media(self) -> bool:
        """Check if message includes media attachment."""
        return self.media_url is not None and len(self.media_url) > 0
