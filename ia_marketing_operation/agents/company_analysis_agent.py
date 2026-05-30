"""
agents/company_analysis_agent.py

Company Analysis Agent - Orchestrates company analysis flow.
Coordinates data retrieval, strategy generation, and analysis persistence.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

from analysis.company_resolver import CompanyResolver
from analysis.strategy_engine import StrategyEngine
from analysis.analysis_models import CompanyAnalysis
from tenant.data_aggregator import DataAggregator
from tenant.tenant_resolver import TenantResolver
from storage.domain_store import DomainStore
from config.settings import settings

logger = logging.getLogger(__name__)


class CompanyAnalysisAgent:
    """
    Agent responsible for performing strategic analysis on companies.
    Coordinates data aggregation, strategy generation, and persistence.
    """

    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = output_dir
        self.strategy_engine = StrategyEngine()
        self.domain_store = DomainStore()
        logger.info("CompanyAnalysisAgent initialized")

    def run_analysis(self, company_id: Optional[int] = None) -> List[CompanyAnalysis]:
        """
        Run analysis for one or all companies.
        If company_id is None, analyzes all active tenants.
        """
        logger.info("=" * 60)
        logger.info("Starting Company Analysis Process")
        logger.info("=" * 60)

        analyses = []

        if company_id:
            # Analyze specific company
            analysis = self._analyze_company(company_id)
            if analysis:
                analyses.append(analysis)
        else:
            # Analyze all active tenants
            analyses = self._analyze_all_tenants()

        logger.info("=" * 60)
        logger.info(f"Company Analysis Completed: {len(analyses)} analyses generated")
        logger.info("=" * 60)

        return analyses

    def _analyze_all_tenants(self) -> List[CompanyAnalysis]:
        """
        Analyze all active tenants.
        """
        analyses = []

        with TenantResolver() as resolver:
            active_tenants = resolver.get_all_active_tenants()

        logger.info(f"Found {len(active_tenants)} active tenants")

        for tenant in active_tenants:
            company = tenant.get('company', {})
            company_id = company.get('id')

            if company_id:
                try:
                    analysis = self._analyze_company(company_id, tenant_data=tenant)
                    if analysis:
                        analyses.append(analysis)
                except Exception as e:
                    logger.error(f"Error analyzing company {company_id}: {e}")

        return analyses

    def _analyze_company(self, company_id: int,
                        tenant_data: Optional[Dict] = None) -> Optional[CompanyAnalysis]:
        """
        Analyze a specific company.
        """
        logger.info(f"Analyzing company {company_id}")

        # Get tenant profile
        with DataAggregator() as aggregator:
            tenant_profile = aggregator.get_full_tenant_profile(company_id)

        # Get company data
        company_data = {}
        with CompanyResolver() as resolver:
            if tenant_data:
                company_data = tenant_data.get('company', {})
            else:
                # Try to resolve from customer
                active_customers = resolver.get_active_customers()
                for customer in active_customers:
                    company = resolver.resolve_company(customer['id'])
                    if company and company.get('id') == company_id:
                        company_data = company
                        break

        if not company_data:
            logger.warning(f"No company data found for {company_id}")
            return None

        # Check for previous analysis
        previous_analysis = self.get_previous_analysis(company_id)

        if previous_analysis:
            # Evolve existing analysis
            analysis = self.strategy_engine.evolve_analysis(
                previous_analysis,
                {
                    'company_data': company_data,
                    'tenant_profile': tenant_profile
                }
            )
        else:
            # Create initial analysis
            analysis = self.strategy_engine.create_initial_analysis(
                company_data,
                tenant_profile
            )

        # Save analysis
        self.save_analysis(analysis)

        return analysis

    def get_previous_analysis(self, company_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve previous analysis for a company.
        """
        try:
            catalog = self.domain_store.get_latest_catalog()
            if catalog and catalog.get('catalog_data'):
                analyses = catalog['catalog_data'].get('analyses', [])
                for analysis in analyses:
                    if analysis.get('company_id') == company_id:
                        return analysis
        except Exception as e:
            logger.error(f"Error retrieving previous analysis: {e}")

        return None

    def save_analysis(self, analysis: CompanyAnalysis):
        """
        Save analysis to domain store and output file.
        """
        analysis_dict = analysis.to_dict()

        # Save to domain store
        try:
            self.domain_store.save_domain_catalog(
                catalog_name=f"company_analysis_{analysis.metadata.company_id}",
                catalog_data=analysis_dict,
                entity_count=len(analysis.opportunities),
                relationship_count=len(analysis.backlog)
            )
        except Exception as e:
            logger.error(f"Error saving to domain store: {e}")

        # Save to output file
        os.makedirs(self.output_dir, exist_ok=True)
        output_file = os.path.join(self.output_dir, f"analysis_{analysis.metadata.company_id}.json")

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis_dict, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Analysis saved: {output_file}")

    def generate_report(self, analysis: CompanyAnalysis) -> str:
        """
        Generate human-readable report for an analysis.
        """
        report = []
        report.append("=" * 60)
        report.append("COMPANY ANALYSIS REPORT")
        report.append("=" * 60)
        report.append(f"Analysis ID: {analysis.metadata.analysis_id}")
        report.append(f"Company ID: {analysis.metadata.company_id}")
        report.append(f"Version: {analysis.metadata.version}")
        report.append(f"Status: {analysis.metadata.status}")
        report.append(f"Created: {analysis.metadata.created_at}")
        report.append("")

        # Summary
        summary = analysis.tenant_profile.get('summary', {})
        report.append("TENANT PROFILE SUMMARY:")
        report.append("-" * 40)
        for key, value in summary.items():
            report.append(f"  {key}: {value}")

        # Opportunities
        report.append("")
        report.append("OPPORTUNITIES:")
        report.append("-" * 40)
        for opp in analysis.opportunities:
            report.append(f"\n  [{opp.priority}] {opp.title}")
            report.append(f"  Category: {opp.category}")
            report.append(f"  Impact: {opp.estimated_impact}")
            report.append(f"  Actions: {', '.join(opp.recommended_actions[:2])}")

        # Strategies
        report.append("")
        report.append("STRATEGIES:")
        report.append("-" * 40)
        for strategy in analysis.strategies:
            report.append(f"\n  {strategy.name}")
            report.append(f"  Objectives: {', '.join(strategy.objectives[:2])}")
            report.append(f"  KPIs: {', '.join(strategy.kpis[:3])}")

        # Backlog
        report.append("")
        report.append("ACTION BACKLOG:")
        report.append("-" * 40)
        for item in analysis.backlog[:10]:
            report.append(f"  [{item.priority}] {item.title}")

        # Insights
        if analysis.insights:
            report.append("")
            report.append("INSIGHTS:")
            report.append("-" * 40)
            for insight in analysis.insights:
                report.append(f"  - {insight}")

        # Recommendations
        if analysis.recommendations:
            report.append("")
            report.append("RECOMMENDATIONS:")
            report.append("-" * 40)
            for rec in analysis.recommendations:
                report.append(f"  - {rec}")

        report.append("")
        report.append("=" * 60)

        return "\n".join(report)

    def close(self):
        """Close all resources."""
        self.domain_store.close()
        logger.info("CompanyAnalysisAgent closed")


def main():
    """CLI entry point for running company analysis."""
    agent = CompanyAnalysisAgent()
    try:
        analyses = agent.run_analysis()
        for analysis in analyses:
            print(agent.generate_report(analysis))
    finally:
        agent.close()


if __name__ == "__main__":
    main()
