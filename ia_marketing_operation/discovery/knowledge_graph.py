"""
discovery/knowledge_graph.py

Knowledge Graph Builder - Constructs domain knowledge from schema inspection.
Generates domain_map.json, entity_catalog.json, and relationship_graph.json.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

from discovery.inspector import MySQLInspector

logger = logging.getLogger(__name__)


class KnowledgeGraphBuilder:
    """
    Builds knowledge graph from MySQL schema inspection.
    Generates hierarchical domain maps, entity catalogs, and relationship graphs.
    """

    def __init__(self, inspector: MySQLInspector):
        self.inspector = inspector

    def build_domain_map(self) -> Dict[str, Any]:
        """
        Build hierarchical domain map from discovered tables.
        Groups tables by entity name and identifies relationships.
        """
        tables = self.inspector.get_all_tables()
        domain_map = {}

        for table in tables:
            table_name = table['TABLE_NAME']
            columns = self.inspector.get_table_columns(table_name)
            foreign_keys = self.inspector.get_foreign_keys(table_name)

            # Extract entity name from table name
            entity_name = self._extract_entity_name(table_name)

            if entity_name not in domain_map:
                domain_map[entity_name] = {
                    "tables": [],
                    "columns": {},
                    "relationships": [],
                    "primary_keys": [],
                    "foreign_keys": [],
                    "indexes": [],
                    "row_count": 0,
                    "discovered_at": datetime.utcnow().isoformat() + "Z"
                }

            domain_map[entity_name]["tables"].append(table_name)
            domain_map[entity_name]["columns"][table_name] = [
                {"name": c['COLUMN_NAME'], "type": c['DATA_TYPE']}
                for c in columns
            ]
            domain_map[entity_name]["row_count"] += table.get('TABLE_ROWS', 0)

            # Extract primary keys
            for col in columns:
                if col['COLUMN_KEY'] == 'PRI':
                    domain_map[entity_name]["primary_keys"].append(col['COLUMN_NAME'])

            # Extract foreign keys and relationships
            for fk in foreign_keys:
                target_entity = self._extract_entity_name(fk['REFERENCED_TABLE_NAME'])
                if target_entity not in domain_map[entity_name]["relationships"]:
                    domain_map[entity_name]["relationships"].append(target_entity)
                domain_map[entity_name]["foreign_keys"].append({
                    "column": fk['COLUMN_NAME'],
                    "references": f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}",
                    "update_rule": fk['UPDATE_RULE'],
                    "delete_rule": fk['DELETE_RULE']
                })

            # Extract indexes
            indexes = self.inspector.get_indexes(table_name)
            domain_map[entity_name]["indexes"].extend([
                {"name": idx['INDEX_NAME'], "column": idx['COLUMN_NAME']}
                for idx in indexes
            ])

        logger.info(f"Domain map built with {len(domain_map)} entities")
        return domain_map

    def build_entity_catalog(self) -> Dict[str, Any]:
        """
        Build comprehensive entity catalog with metadata.
        """
        tables = self.inspector.get_all_tables()
        entity_catalog = {
            "entities": [],
            "metadata": {
                "database": self.inspector.connection.db.decode() if isinstance(self.inspector.connection.db, bytes) else self.inspector.connection.db,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "total_tables": len(tables)
            }
        }

        for table in tables:
            table_name = table['TABLE_NAME']
            columns = self.inspector.get_table_columns(table_name)
            indexes = self.inspector.get_indexes(table_name)
            foreign_keys = self.inspector.get_foreign_keys(table_name)

            entity = {
                "name": self._extract_entity_name(table_name),
                "table": table_name,
                "engine": table.get('ENGINE', 'Unknown'),
                "table_type": table.get('TABLE_TYPE', 'BASE TABLE'),
                "columns": [
                    {
                        "name": c['COLUMN_NAME'],
                        "type": c['DATA_TYPE'],
                        "nullable": c['IS_NULLABLE'] == 'YES',
                        "default": c['COLUMN_DEFAULT'],
                        "key": c['COLUMN_KEY'],
                        "extra": c['EXTRA'],
                        "comment": c['COLUMN_COMMENT']
                    }
                    for c in columns
                ],
                "primary_keys": [c['COLUMN_NAME'] for c in columns if c['COLUMN_KEY'] == 'PRI'],
                "foreign_keys": [
                    {
                        "column": fk['COLUMN_NAME'],
                        "references": f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}",
                        "update_rule": fk['UPDATE_RULE'],
                        "delete_rule": fk['DELETE_RULE']
                    }
                    for fk in foreign_keys
                ],
                "indexes": list(set(idx['INDEX_NAME'] for idx in indexes)),
                "row_count": table.get('TABLE_ROWS', 0),
                "comment": table.get('TABLE_COMMENT', '')
            }
            entity_catalog["entities"].append(entity)

        logger.info(f"Entity catalog built with {len(entity_catalog['entities'])} entities")
        return entity_catalog

    def build_relationship_graph(self) -> Dict[str, Any]:
        """
        Build graph with nodes (tables) and edges (foreign keys).
        """
        tables = self.inspector.get_all_tables()
        nodes = []
        edges = []

        for table in tables:
            table_name = table['TABLE_NAME']
            nodes.append({
                "id": table_name,
                "type": "table",
                "entity": self._extract_entity_name(table_name),
                "row_count": table.get('TABLE_ROWS', 0)
            })

            foreign_keys = self.inspector.get_foreign_keys(table_name)
            for fk in foreign_keys:
                edges.append({
                    "source": table_name,
                    "target": fk['REFERENCED_TABLE_NAME'],
                    "type": "foreign_key",
                    "column": fk['COLUMN_NAME'],
                    "referenced_column": fk['REFERENCED_COLUMN_NAME']
                })

        graph = {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
        }

        logger.info(f"Relationship graph built with {len(nodes)} nodes and {len(edges)} edges")
        return graph

    def _extract_entity_name(self, table_name: str) -> str:
        """
        Extract entity name from table name.
        Examples: 'customers' -> 'Customer', 'companies' -> 'Company'
        """
        name = table_name.lower()
        # Remove common suffixes
        if name.endswith('ies'):
            name = name[:-3] + 'y'
        elif name.endswith('es'):
            name = name[:-2]
        elif name.endswith('s'):
            name = name[:-1]
        return name.capitalize()

    def save_outputs(self, output_dir: str = "outputs") -> Dict[str, Any]:
        """
        Save all JSON outputs to the specified directory.
        Returns dict with all generated data.
        """
        os.makedirs(output_dir, exist_ok=True)

        # Build all outputs
        domain_map = self.build_domain_map()
        entity_catalog = self.build_entity_catalog()
        relationship_graph = self.build_relationship_graph()

        # Save domain_map.json
        with open(os.path.join(output_dir, "domain_map.json"), "w", encoding='utf-8') as f:
            json.dump(domain_map, f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"Saved domain_map.json to {output_dir}")

        # Save entity_catalog.json
        with open(os.path.join(output_dir, "entity_catalog.json"), "w", encoding='utf-8') as f:
            json.dump(entity_catalog, f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"Saved entity_catalog.json to {output_dir}")

        # Save relationship_graph.json
        with open(os.path.join(output_dir, "relationship_graph.json"), "w", encoding='utf-8') as f:
            json.dump(relationship_graph, f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"Saved relationship_graph.json to {output_dir}")

        return {
            "domain_map": domain_map,
            "entity_catalog": entity_catalog,
            "relationship_graph": relationship_graph
        }
