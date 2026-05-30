"""
agents/schema_discovery_agent.py

Schema Discovery Agent - Orchestrates database schema discovery.
Coordinates inspector and knowledge graph builder to generate
domain knowledge outputs.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

from discovery.inspector import MySQLInspector
from discovery.knowledge_graph import KnowledgeGraphBuilder
from config.settings import settings

logger = logging.getLogger(__name__)


class SchemaDiscoveryAgent:
    """
    Agent responsible for discovering database schema and building
    knowledge graph outputs.
    """

    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = output_dir
        self.inspector = None
        self.graph_builder = None
        self.discovery_results = None

    def run_discovery(self) -> Dict[str, Any]:
        """
        Execute full schema discovery process.
        Returns dict with all generated data.
        """
        logger.info("=" * 60)
        logger.info("Starting Schema Discovery Process")
        logger.info("=" * 60)

        try:
            # Initialize inspector
            self.inspector = MySQLInspector()
            self.graph_builder = KnowledgeGraphBuilder(self.inspector)

            # Run discovery
            self.discovery_results = self.graph_builder.save_outputs(self.output_dir)

            logger.info("=" * 60)
            logger.info("Schema Discovery Completed Successfully")
            logger.info(f"Entities discovered: {len(self.discovery_results['domain_map'])}")
            logger.info(f"Total tables: {len(self.discovery_results['relationship_graph']['nodes'])}")
            logger.info(f"Total relationships: {len(self.discovery_results['relationship_graph']['edges'])}")
            logger.info("=" * 60)

            return self.discovery_results

        except Exception as e:
            logger.error(f"Schema discovery failed: {str(e)}")
            raise
        finally:
            if self.inspector:
                self.inspector.close()

    def detect_schema_changes(self, previous_state: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Detect schema changes by comparing current state with previous state.
        """
        logger.info("Detecting schema changes...")

        if not self.inspector:
            self.inspector = MySQLInspector()

        current_tables = [t['TABLE_NAME'] for t in self.inspector.get_all_tables()]

        if not previous_state:
            return {
                "has_changes": True,
                "new_tables": current_tables,
                "dropped_tables": [],
                "modified_tables": [],
                "message": "No previous state - first discovery"
            }

        previous_tables = previous_state.get('tables', [])
        previous_set = set(previous_tables)
        current_set = set(current_tables)

        new_tables = list(current_set - previous_set)
        dropped_tables = list(previous_set - current_set)

        changes = {
            "has_changes": len(new_tables) > 0 or len(dropped_tables) > 0,
            "new_tables": new_tables,
            "dropped_tables": dropped_tables,
            "modified_tables": [],  # TODO: Implement column-level comparison
            "checked_at": datetime.utcnow().isoformat() + "Z"
        }

        if changes["has_changes"]:
            logger.info(f"Schema changes detected: {len(new_tables)} new, {len(dropped_tables)} dropped")
        else:
            logger.info("No schema changes detected")

        return changes

    def generate_report(self) -> str:
        """
        Generate human-readable report of discovered schema.
        """
        if not self.discovery_results:
            return "No discovery results available. Run discovery first."

        report = []
        report.append("=" * 60)
        report.append("SCHEMA DISCOVERY REPORT")
        report.append("=" * 60)
        report.append(f"Generated: {datetime.utcnow().isoformat()}Z")
        report.append(f"Database: {settings.DB_NAME}")
        report.append("")

        # Domain Map Summary
        domain_map = self.discovery_results['domain_map']
        report.append(f"ENTITIES DISCOVERED: {len(domain_map)}")
        report.append("-" * 40)
        for entity_name, entity_data in sorted(domain_map.items()):
            report.append(f"\n{entity_name}:")
            report.append(f"  Tables: {', '.join(entity_data['tables'])}")
            report.append(f"  Primary Keys: {', '.join(entity_data['primary_keys']) or 'None'}")
            report.append(f"  Relationships: {', '.join(entity_data['relationships']) or 'None'}")
            report.append(f"  Row Count: {entity_data['row_count']}")

        # Relationship Graph Summary
        graph = self.discovery_results['relationship_graph']
        report.append("\n")
        report.append("=" * 60)
        report.append(f"RELATIONSHIPS: {len(graph['edges'])}")
        report.append("-" * 40)
        for edge in graph['edges']:
            report.append(f"  {edge['source']}.{edge['column']} -> {edge['target']}.{edge['referenced_column']}")

        report.append("\n")
        report.append("=" * 60)
        report.append("OUTPUT FILES:")
        report.append(f"  - {self.output_dir}/domain_map.json")
        report.append(f"  - {self.output_dir}/entity_catalog.json")
        report.append(f"  - {self.output_dir}/relationship_graph.json")
        report.append("=" * 60)

        return "\n".join(report)


def main():
    """CLI entry point for running schema discovery."""
    agent = SchemaDiscoveryAgent()
    agent.run_discovery()
    print(agent.generate_report())


if __name__ == "__main__":
    main()
