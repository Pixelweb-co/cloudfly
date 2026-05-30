"""
analysis/strategy_engine.py

Strategy Engine - Generates marketing strategies, identifies opportunities,
and creates action backlog based on company data analysis.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

from analysis.analysis_models import (
    AnalysisMetadata,
    CompanyAnalysis,
    Opportunity,
    BacklogItem,
    Strategy
)

logger = logging.getLogger(__name__)


class StrategyEngine:
    """
    Engine for generating marketing strategies and recommendations.
    Analyzes company data to identify opportunities and create actionable backlog.
    """

    def create_initial_analysis(self, company_data: Dict[str, Any],
                               tenant_profile: Dict[str, Any]) -> CompanyAnalysis:
        """
        Create initial analysis for a company with no previous analysis.
        """
        logger.info(f"Creating initial analysis for company {company_data.get('id')}")

        metadata = AnalysisMetadata(
            analysis_id=str(uuid.uuid4()),
            company_id=company_data.get('id', 0),
            status="INITIAL"
        )

        analysis = CompanyAnalysis(
            metadata=metadata,
            company_data=company_data,
            tenant_profile=tenant_profile
        )

        # Analyze data and generate insights
        analysis.opportunities = self.identify_opportunities(tenant_profile)
        analysis.backlog = self.generate_backlog(analysis.opportunities)
        analysis.strategies = self.generate_strategy(tenant_profile, analysis.opportunities)
        analysis.insights = self._generate_insights(tenant_profile)
        analysis.recommendations = self._generate_recommendations(tenant_profile, analysis.opportunities)

        metadata.status = "COMPLETED"
        metadata.updated_at = datetime.utcnow().isoformat() + "Z"

        logger.info(f"Initial analysis created: {metadata.analysis_id}")
        return analysis

    def evolve_analysis(self, previous_analysis: Dict[str, Any],
                       new_data: Dict[str, Any]) -> CompanyAnalysis:
        """
        Evolve an existing analysis with new data.
        """
        logger.info(f"Evolving analysis {previous_analysis.get('metadata', {}).get('analysis_id')}")

        prev_metadata = previous_analysis.get('metadata', {})

        metadata = AnalysisMetadata(
            analysis_id=str(uuid.uuid4()),
            company_id=prev_metadata.get('company_id', 0),
            version=prev_metadata.get('version', 1) + 1,
            status="EVOLVED"
        )

        analysis = CompanyAnalysis(
            metadata=metadata,
            company_data=new_data.get('company_data', {}),
            tenant_profile=new_data.get('tenant_profile', {}),
            previous_analysis=previous_analysis
        )

        # Compare with previous analysis
        analysis.opportunities = self.identify_opportunities(new_data.get('tenant_profile', {}))
        analysis.backlog = self.generate_backlog(analysis.opportunities)
        analysis.strategies = self.generate_strategy(new_data.get('tenant_profile', {}), analysis.opportunities)
        analysis.insights = self._generate_insights(new_data.get('tenant_profile', {}))
        analysis.recommendations = self._generate_recommendations(new_data.get('tenant_profile', {}), analysis.opportunities)

        metadata.status = "COMPLETED"
        metadata.updated_at = datetime.utcnow().isoformat() + "Z"

        logger.info(f"Analysis evolved: {metadata.analysis_id} (v{metadata.version})")
        return analysis

    def identify_opportunities(self, tenant_profile: Dict[str, Any]) -> List[Opportunity]:
        """
        Identify business opportunities based on tenant profile.
        """
        opportunities = []
        summary = tenant_profile.get('summary', {})

        # Product opportunities
        if summary.get('total_products', 0) == 0:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="No Products Defined",
                description="Company has no products in the system. Adding products can increase revenue streams.",
                category="PRODUCT",
                priority="HIGH",
                estimated_impact="High revenue potential",
                recommended_actions=[
                    "Define core products",
                    "Set up product catalog",
                    "Create product marketing materials"
                ]
            ))
        elif summary.get('total_products', 0) < 5:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="Expand Product Catalog",
                description=f"Company has only {summary.get('total_products')} products. Consider expanding the catalog.",
                category="PRODUCT",
                priority="MEDIUM",
                estimated_impact="Medium revenue increase",
                recommended_actions=[
                    "Research complementary products",
                    "Analyze competitor offerings",
                    "Survey customer needs"
                ]
            ))

        # Service opportunities
        if summary.get('total_services', 0) == 0:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="No Services Defined",
                description="Company has no services in the system. Services can provide recurring revenue.",
                category="SERVICE",
                priority="HIGH",
                estimated_impact="Recurring revenue potential",
                recommended_actions=[
                    "Define service offerings",
                    "Create service packages",
                    "Set up service delivery process"
                ]
            ))

        # Campaign opportunities
        if summary.get('total_campaigns', 0) == 0:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="No Marketing Campaigns",
                description="Company has no marketing campaigns. Campaigns are essential for customer acquisition.",
                category="CAMPAIGN",
                priority="HIGH",
                estimated_impact="Customer acquisition",
                recommended_actions=[
                    "Define marketing objectives",
                    "Create first campaign",
                    "Set up campaign tracking"
                ]))
        elif summary.get('total_campaigns', 0) < 3:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="Increase Campaign Activity",
                description=f"Company has only {summary.get('total_campaigns')} campaigns. More campaigns can drive growth.",
                category="CAMPAIGN",
                priority="MEDIUM",
                estimated_impact="Increased brand awareness",
                recommended_actions=[
                    "Plan quarterly campaigns",
                    "A/B test messaging",
                    "Expand to new channels"
                ]
            ))

        # Social media opportunities
        if summary.get('total_social_accounts', 0) == 0:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="No Social Media Presence",
                description="Company has no social media accounts. Social media is crucial for modern marketing.",
                category="SOCIAL",
                priority="HIGH",
                estimated_impact="Brand visibility and engagement",
                recommended_actions=[
                    "Create business profiles on key platforms",
                    "Develop social media strategy",
                    "Plan content calendar"
                ]
            ))

        # CRM opportunities
        if summary.get('total_contacts', 0) == 0:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="No Contact Database",
                description="Company has no contacts in CRM. Building a contact database is essential for marketing.",
                category="CRM",
                priority="HIGH",
                estimated_impact="Lead generation and nurturing",
                recommended_actions=[
                    "Import existing contacts",
                    "Set up lead capture forms",
                    "Create contact segmentation"
                ]
            ))

        if summary.get('total_leads', 0) == 0:
            opportunities.append(Opportunity(
                opportunity_id=str(uuid.uuid4()),
                title="No Leads in Pipeline",
                description="Company has no leads. Lead generation is critical for sales growth.",
                category="CRM",
                priority="HIGH",
                estimated_impact="Sales pipeline growth",
                recommended_actions=[
                    "Set up lead generation campaigns",
                    "Create lead magnets",
                    "Implement lead scoring"
                ]
            ))

        logger.info(f"Identified {len(opportunities)} opportunities")
        return opportunities

    def generate_backlog(self, opportunities: List[Opportunity]) -> List[BacklogItem]:
        """
        Generate action backlog from identified opportunities.
        """
        backlog = []

        for opp in opportunities:
            for i, action in enumerate(opp.recommended_actions):
                backlog.append(BacklogItem(
                    item_id=str(uuid.uuid4()),
                    title=action,
                    description=f"Part of opportunity: {opp.title}",
                    category=opp.category,
                    priority=opp.priority,
                    status="PENDING"
                ))

        # Sort by priority
        priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        backlog.sort(key=lambda x: priority_order.get(x.priority, 3))

        logger.info(f"Generated backlog with {len(backlog)} items")
        return backlog

    def generate_strategy(self, tenant_profile: Dict[str, Any],
                         opportunities: List[Opportunity]) -> List[Strategy]:
        """
        Generate marketing strategy based on tenant profile and opportunities.
        """
        strategies = []

        # Product Strategy
        product_opps = [o for o in opportunities if o.category == "PRODUCT"]
        if product_opps:
            strategies.append(Strategy(
                strategy_id=str(uuid.uuid4()),
                name="Product Marketing Strategy",
                description="Strategy to optimize product offerings and marketing",
                objectives=[
                    "Define clear product value propositions",
                    "Increase product awareness",
                    "Drive product sales"
                ],
                tactics=[
                    "Create product marketing materials",
                    "Develop product comparison content",
                    "Launch product-focused campaigns"
                ],
                kpis=[
                    "Product page views",
                    "Product inquiries",
                    "Product sales conversion rate"
                ],
                status="DRAFT"
            ))

        # Digital Marketing Strategy
        social_opps = [o for o in opportunities if o.category == "SOCIAL"]
        campaign_opps = [o for o in opportunities if o.category == "CAMPAIGN"]
        if social_opps or campaign_opps:
            strategies.append(Strategy(
                strategy_id=str(uuid.uuid4()),
                name="Digital Marketing Strategy",
                description="Comprehensive digital marketing approach",
                objectives=[
                    "Increase online presence",
                    "Generate qualified leads",
                    "Build brand authority"
                ],
                tactics=[
                    "Social media marketing",
                    "Content marketing",
                    "Email marketing",
                    "Paid advertising"
                ],
                kpis=[
                    "Website traffic",
                    "Social media engagement",
                    "Lead generation rate",
                    "Customer acquisition cost"
                ],
                status="DRAFT"
            ))

        # CRM Strategy
        crm_opps = [o for o in opportunities if o.category == "CRM"]
        if crm_opps:
            strategies.append(Strategy(
                strategy_id=str(uuid.uuid4()),
                name="CRM & Lead Management Strategy",
                description="Strategy for managing contacts and leads effectively",
                objectives=[
                    "Build comprehensive contact database",
                    "Implement lead nurturing",
                    "Improve sales conversion"
                ],
                tactics=[
                    "Contact segmentation",
                    "Lead scoring",
                    "Automated nurturing sequences",
                    "Sales follow-up processes"
                ],
                kpis=[
                    "Contact database size",
                    "Lead conversion rate",
                    "Sales cycle length",
                    "Customer lifetime value"
                ],
                status="DRAFT"
            ))

        logger.info(f"Generated {len(strategies)} strategies")
        return strategies

    def _generate_insights(self, tenant_profile: Dict[str, Any]) -> List[str]:
        """
        Generate insights from tenant profile data.
        """
        insights = []
        summary = tenant_profile.get('summary', {})

        total_products = summary.get('total_products', 0)
        total_services = summary.get('total_services', 0)
        total_campaigns = summary.get('total_campaigns', 0)
        total_contacts = summary.get('total_contacts', 0)
        total_leads = summary.get('total_leads', 0)

        if total_products == 0 and total_services == 0:
            insights.append("Company has no defined products or services. This is a critical gap that needs immediate attention.")

        if total_campaigns == 0:
            insights.append("No marketing campaigns detected. The company is not actively marketing its offerings.")

        if total_contacts > 0 and total_leads == 0:
            insights.append(f"Company has {total_contacts} contacts but no leads. There may be an opportunity to convert existing contacts into leads.")

        if total_products > 0 and total_campaigns == 0:
            insights.append(f"Company has {total_products} products but no campaigns. Products are not being actively marketed.")

        if total_leads > 0 and total_campaigns == 0:
            insights.append("Leads exist but no campaigns are running. Lead nurturing may be insufficient.")

        return insights

    def _generate_recommendations(self, tenant_profile: Dict[str, Any],
                                  opportunities: List[Opportunity]) -> List[str]:
        """
        Generate actionable recommendations.
        """
        recommendations = []

        high_priority = [o for o in opportunities if o.priority == "HIGH"]
        medium_priority = [o for o in opportunities if o.priority == "MEDIUM"]

        if high_priority:
            recommendations.append(f"Address {len(high_priority)} high-priority opportunities first.")

        for opp in high_priority[:3]:
            recommendations.append(f"[{opp.category}] {opp.title}: {opp.recommended_actions[0] if opp.recommended_actions else 'Investigate further'}")

        if medium_priority:
            recommendations.append(f"Plan {len(medium_priority)} medium-priority improvements for next quarter.")

        return recommendations
