"""
learning/catalog_updater.py

Catalog Updater - Automatically catalogs new tables and updates
the knowledge graph when schema changes are detected.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

from discovery.inspector import MySQLInspector
from discovery.knowledge_graph import KnowledgeGraphBuilder
from storage.domain_store import DomainStore

logger = logging.getLogger(__name__)


class CatalogUpdater:
    """
    Updates domain catalog when new tables are discovered.
    Rebuilds knowledge graph and regenerates output files.
    """

    def __init__(self, inspector: MySQLInspector, output_dir: str = "outputs"):
        self.inspector = inspector
        self.output_dir = output_dir
        self.graph_builder = KnowledgeGraphBuilder(inspector)
        self.domain_store = DomainStore()

    def catalog_new_table(self, table_name: str) -> Dict[str, Any]:
        """
        Catalog a new table by extracting its metadata.
        """
        logger.info(f"Cataloging new table: {table_name}")

        columns = self.inspector.get_table_columns(table_name)
        foreign_keys = self.inspector.get_foreign_keys(table_name)
        indexes = self.inspector.get_indexes(table_name)

        # Extract entity name
        entity_name = self._extract_entity_name(table_name)

        catalog_entry = {
            "table_name": table_name,
            "entity_name": entity_name,
            "columns": [
                {
                    "name": c['COLUMN_NAME'],
                    "type": c['DATA_TYPE'],
                    "nullable": c['IS_NULLABLE'] == 'YES',
                    "key": c['COLUMN_KEY']
                }
                for c in columns
            ],
            "primary_keys": [c['COLUMN_NAME'] for c in columns if c['COLUMN_KEY'] == 'PRI'],
            "foreign_keys": [
                {
                    "column": fk['COLUMN_NAME'],
                    "references": f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}"
                }
                for fk in foreign_keys
            ],
            "indexes": list(set(idx['INDEX_NAME'] for idx in indexes)),
            "cataloged_at": datetime.utcnow().isoformat() + "Z"
        }

        logger.info(f"Table {table_name} cataloged as entity {entity_name}")
        return catalog_entry

    def update_entity_relationships(self, new_table: str) -> List[Dict[str, Any]]:
        """
        Update relationships for a new table.
        """
        foreign_keys = self.inspector.get_foreign_keys(new_table)
        relationships = []

        for fk in foreign_keys:
            source_entity = self._extract_entity_name(new_table)
            target_entity = self._extract_entity_name(fk['REFERENCED_TABLE_NAME'])

            relationship = {
                "source": source_entity,
                "target": target_entity,
                "type": "foreign_key",
                "foreign_key_info": {
                    "column": fk['COLUMN_NAME'],
                    "references": f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}"
                }
            }
            relationships.append(relationship)

            # Save to domain store
            self.domain_store.save_relationships([relationship])

        logger.info(f"Updated {len(relationships)} relationships for {new_table}")
        return relationships

    def rebuild_knowledge_graph(self) -> Dict[str, Any]:
        """
        Rebuild the complete knowledge graph.
        """
        logger.info("Rebuilding knowledge graph...")

        results = self.graph_builder.save_outputs(self.output_dir)

        # Save to domain store
        entity_count = len(results['domain_map'])
        relationship_count = len(results['relationship_graph']['edges'])

        self.domain_store.save_domain_catalog(
            catalog_name="full_schema",
            catalog_data={
                "domain_map": results['domain_map'],
                "entity_count": entity_count,
                "relationship_count": relationship_count
            },
            entity_count=entity_count,
            relationship_count=relationship_count
        )

        logger.info(f"Knowledge graph rebuilt: {entity_count} entities, {relationship_count} relationships")
        return results

    def update_domain_map(self, new_tables: List[str]) -> Dict[str, Any]:
        """
        Update domain map with new tables.
        """
        logger.info(f"Updating domain map with {len(new_tables)} new tables")

        # Catalog each new table
        catalog_entries = []
        for table_name in new_tables:
            entry = self.catalog_new_table(table_name)
            catalog_entries.append(entry)

        # Update relationships
        for table_name in new_tables:
            self.update_entity_relationships(table_name)

        # Save entities to domain store
        entities_data = [
            {
                "name": entry["entity_name"],
                "tables": [entry["table_name"]],
                "description": f"Auto-cataloged table: {entry['table_name']}",
                "business_domain": "auto_discovered"
            }
            for entry in catalog_entries
        ]
        self.domain_store.save_entities(entities_data)

        return {
            "cataloged_tables": catalog_entries,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

    def regenerate_outputs(self) -> Dict[str, Any]:
        """
        Regenerate all JSON output files.
        """
        logger.info("Regenerating output files...")

        os.makedirs(self.output_dir, exist_ok=True)

        results = self.graph_builder.save_outputs(self.output_dir)

        logger.info(f"Output files regenerated in {self.output_dir}")
        return results

    def _extract_entity_name(self, table_name: str) -> str:
        """
        Extract entity name from table name.
        """
        name = table_name.lower()
        if name.endswith('ies'):
            name = name[:-3] + 'y'
        elif name.endswith('es'):
            name = name[:-2]
        elif name.endswith('s'):
            name = name[:-1]
        return name.capitalize()

    def close(self):
        """Close all resources."""
        self.domain_store.close()
        logger.info("CatalogUpdater closed")
