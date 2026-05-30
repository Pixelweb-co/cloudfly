"""
analysis/analysis_models.py

Data models for company analysis.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Optional


@dataclass
class AnalysisMetadata:
    """Metadata for an analysis."""
    analysis_id: str
    company_id: int
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    version: int = 1
    status: str = "INITIAL"  # INITIAL, IN_PROGRESS, COMPLETED, EVOLVED


@dataclass
class Opportunity:
    """Represents a business opportunity."""
    opportunity_id: str
    title: str
    description: str
    category: str  # PRODUCT, SERVICE, CAMPAIGN, SOCIAL, CRM
    priority: str  # HIGH, MEDIUM, LOW
    estimated_impact: str
    recommended_actions: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


@dataclass
class BacklogItem:
    """Represents an item in the action backlog."""
    item_id: str
    title: str
    description: str
    category: str
    priority: str  # HIGH, MEDIUM, LOW
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED
    due_date: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


@dataclass
class Strategy:
    """Represents a marketing strategy."""
    strategy_id: str
    name: str
    description: str
    objectives: List[str] = field(default_factory=list)
    tactics: List[str] = field(default_factory=list)
    kpis: List[str] = field(default_factory=list)
    status: str = "DRAFT"  # DRAFT, ACTIVE, PAUSED, COMPLETED
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


@dataclass
class CompanyAnalysis:
    """Complete analysis for a company."""
    metadata: AnalysisMetadata
    company_id: int
    company_data: Dict[str, Any] = field(default_factory=dict)
    tenant_profile: Dict[str, Any] = field(default_factory=dict)
    previous_analysis: Optional[Dict[str, Any]] = None
    opportunities: List[Opportunity] = field(default_factory=list)
    backlog: List[BacklogItem] = field(default_factory=list)
    strategies: List[Strategy] = field(default_factory=list)
    insights: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "metadata": {
                "analysis_id": self.metadata.analysis_id,
                "company_id": self.metadata.company_id,
                "created_at": self.metadata.created_at,
                "updated_at": self.metadata.updated_at,
                "version": self.metadata.version,
                "status": self.metadata.status
            },
            "company_id": self.company_id,
            "company_data": self.company_data,
            "tenant_profile_summary": self.tenant_profile.get("summary", {}),
            "previous_analysis_id": self.previous_analysis.get("metadata", {}).get("analysis_id") if self.previous_analysis else None,
            "opportunities": [
                {
                    "opportunity_id": o.opportunity_id,
                    "title": o.title,
                    "description": o.description,
                    "category": o.category,
                    "priority": o.priority,
                    "estimated_impact": o.estimated_impact,
                    "recommended_actions": o.recommended_actions
                }
                for o in self.opportunities
            ],
            "backlog": [
                {
                    "item_id": b.item_id,
                    "title": b.title,
                    "description": b.description,
                    "category": b.category,
                    "priority": b.priority,
                    "status": b.status
                }
                for b in self.backlog
            ],
            "strategies": [
                {
                    "strategy_id": s.strategy_id,
                    "name": s.name,
                    "description": s.description,
                    "objectives": s.objectives,
                    "tactics": s.tactics,
                    "kpis": s.kpis,
                    "status": s.status
                }
                for s in self.strategies
            ],
            "insights": self.insights,
            "recommendations": self.recommendations
        }
