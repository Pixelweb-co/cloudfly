"""
domain/campaign_context.py

Helpers to detect outbound campaign echoes (skip AI) vs genuine contact replies.
"""
import re
from typing import Optional


def normalize_message_text(text: str) -> str:
    """Collapse whitespace and lowercase for fuzzy comparison."""
    if not text:
        return ""
    collapsed = re.sub(r"\s+", " ", text.strip().lower())
    return collapsed


def is_likely_campaign_outbound_echo(
    inbound_text: str,
    campaign_message: Optional[str],
) -> bool:
    """
    Returns True when the Kafka payload looks like the system's own campaign
    outbound text rather than a real reply from the contact.
    """
    if not campaign_message:
        return False

    inbound = normalize_message_text(inbound_text)
    outbound = normalize_message_text(campaign_message)
    if not inbound or not outbound:
        return False

    if inbound == outbound:
        return True

    # Campaign templates are often long; a near-duplicate inbound is likely an echo.
    shorter, longer = (inbound, outbound) if len(inbound) <= len(outbound) else (outbound, inbound)
    if len(longer) >= 40 and shorter in longer and len(shorter) / len(longer) >= 0.85:
        return True

    return False
