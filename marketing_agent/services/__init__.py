"""
Marketing Agent Services.

This package contains all services used by the marketing agent:
- AIAdService: AI-powered ad copy generation
- ProductService: Product data fetching
- CampaignService: Campaign message building
- EvolutionService: WhatsApp message sending
- MetaAdsService: Meta Ads creation and management
"""

from .ai_ad_service import AIAdService, AIAdGenerationException
from .product_service import ProductService, ProductNotFoundException
from .campaign_service import CampaignService
from .evolution_service import EvolutionService
from .meta_ads_service import MetaAdsService, MetaAdsException

__all__ = [
    "AIAdService",
    "AIAdGenerationException",
    "ProductService",
    "ProductNotFoundException",
    "CampaignService",
    "EvolutionService",
    "MetaAdsService",
    "MetaAdsException",
]
