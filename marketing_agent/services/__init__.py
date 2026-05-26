import sys, os
# Add parent directory to sys.path to access root services
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
# Re-export modules from root services package
from services.evolution_service import EvolutionService
from services.meta_ads_service import MetaAdsService, MetaAdsException
from services.product_service import ProductService, ProductNotFoundException
from services.campaign_service import CampaignService
from services.prospector_service import ProspectorService
# expose names
__all__ = [
    'EvolutionService',
    'MetaAdsService',
    'MetaAdsException',
    'ProductService',
    'ProductNotFoundException',
    'CampaignService',
    'ProspectorService',
]
