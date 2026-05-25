"""
Data models for the Marketing Agent microservice.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CampaignMessage:
    """
    Represents a structured marketing campaign message ready to be sent
    through the Evolution API (WhatsApp).

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
        """Return True if this message includes a media attachment."""
        return self.media_url is not None and len(self.media_url) > 0


@dataclass
class CampaignResult:
    """
    Tracks the outcome of sending a campaign to a single contact.
    """
    contact_id: int
    phone: str
    success: bool
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class CampaignSummary:
    """
    Aggregated statistics for a complete campaign execution run.
    """
    product_name: str
    total_contacts: int = 0
    sent: int = 0
    failed: int = 0
    results: list = field(default_factory=list)

    def add_result(self, result: CampaignResult) -> None:
        self.results.append(result)
        if result.success:
            self.sent += 1
        else:
            self.failed += 1

    def __str__(self) -> str:
        return (
            f"CampaignSummary(product={self.product_name}, "
            f"total={self.total_contacts}, sent={self.sent}, failed={self.failed})"
        )
