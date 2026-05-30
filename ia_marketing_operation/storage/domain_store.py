"""
storage/domain_store.py

Domain Knowledge Store - Persistence layer for discovered schema metadata.
Handles CRUD operations for entities, relationships, schema versions, and domain catalog.
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

import pymysql
from pymysql.cursors import DictCursor

from config.settings import settings

logger = logging.getLogger(__name__)


class DomainStore:
    """
    Persistence layer for domain knowledge.
    Stores discovered entities, relationships, schema versions, and catalog.
    """

    def __init__(self):
        """Initialize database connection."""
        self.connection = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            cursorclass=DictCursor,
            charset='utf8mb4'
        )
        logger.info(f"DomainStore connected to {settings.DB_NAME}")

    def init_database(self):
        """
        Initialize database tables if they don't exist.
        Reads DDL from schema.sql file.
        """
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')

        with open(schema_path, 'r') as f:
            schema_sql = f.read()

        # Split and execute each statement
        statements = [s.strip() for s in schema_sql.split(';') if s.strip()]

        with self.connection.cursor() as cursor:
            for statement in statements:
                if statement:
                    cursor.execute(statement)

        self.connection.commit()
        logger.info("Domain store tables initialized")

    def save_entities(self, entities: List[Dict[str, Any]]):
        """
        Save discovered entities to database.
        Uses INSERT ... ON DUPLICATE KEY UPDATE for idempotency.
        """
        with self.connection.cursor() as cursor:
            for entity in entities:
                cursor.execute("""
                    INSERT INTO discovered_entities (entity_name, table_names, description, business_domain)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        table_names = VALUES(table_names),
                        description = VALUES(description),
                        business_domain = VALUES(business_domain),
                        updated_at = NOW()
                """, (
                    entity.get('name', ''),
                    json.dumps(entity.get('tables', [])),
                    entity.get('description', ''),
                    entity.get('business_domain', '')
                ))
        self.connection.commit()
        logger.info(f"Saved {len(entities)} entities")

    def save_relationships(self, relationships: List[Dict[str, Any]]):
        """
        Save discovered relationships to database.
        """
        with self.connection.cursor() as cursor:
            for rel in relationships:
                cursor.execute("""
                    INSERT INTO discovered_relationships (source_entity, target_entity, relationship_type, foreign_key_info)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        foreign_key_info = VALUES(foreign_key_info)
                """, (
                    rel.get('source', ''),
                    rel.get('target', ''),
                    rel.get('type', 'foreign_key'),
                    json.dumps(rel.get('foreign_key_info', {}))
                ))
        self.connection.commit()
        logger.info(f"Saved {len(relationships)} relationships")

    def save_schema_version(self, snapshot: Dict[str, Any], changes: Optional[Dict] = None) -> int:
        """
        Save schema version snapshot.
        Returns the version ID.
        """
        # Generate hash from snapshot
        snapshot_json = json.dumps(snapshot, sort_keys=True, default=str)
        version_hash = hashlib.sha256(snapshot_json.encode()).hexdigest()

        with self.connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO schema_versions (version_hash, schema_snapshot, changes_detected)
                VALUES (%s, %s, %s)
            """, (
                version_hash,
                snapshot_json,
                json.dumps(changes) if changes else None
            ))
            version_id = cursor.lastrowid

        self.connection.commit()
        logger.info(f"Saved schema version: {version_hash[:12]}...")
        return version_id

    def save_domain_catalog(self, catalog_name: str, catalog_data: Dict[str, Any],
                           entity_count: int = 0, relationship_count: int = 0) -> int:
        """
        Save domain catalog.
        Returns the catalog ID.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO domain_catalog (catalog_name, catalog_data, entity_count, relationship_count)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    catalog_data = VALUES(catalog_data),
                    entity_count = VALUES(entity_count),
                    relationship_count = VALUES(relationship_count),
                    updated_at = NOW()
            """, (
                catalog_name,
                json.dumps(catalog_data, default=str),
                entity_count,
                relationship_count
            ))
            catalog_id = cursor.lastrowid

        self.connection.commit()
        logger.info(f"Saved domain catalog: {catalog_name}")
        return catalog_id

    def get_latest_catalog(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve the most recent domain catalog.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM domain_catalog
                ORDER BY updated_at DESC
                LIMIT 1
            """)
            result = cursor.fetchone()

        if result:
            result['catalog_data'] = json.loads(result['catalog_data'])
            return result
        return None

    def get_previous_state(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve the previous schema state for comparison.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM schema_versions
                ORDER BY created_at DESC
                LIMIT 1
            """)
            result = cursor.fetchone()

        if result:
            result['schema_snapshot'] = json.loads(result['schema_snapshot'])
            result['changes_detected'] = json.loads(result['changes_detected']) if result['changes_detected'] else None
            return result
        return None

    def get_all_entities(self) -> List[Dict[str, Any]]:
        """
        Retrieve all discovered entities.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT * FROM discovered_entities ORDER BY entity_name")
            results = cursor.fetchall()

        for result in results:
            result['table_names'] = json.loads(result['table_names'])
        return results

    def get_all_relationships(self) -> List[Dict[str, Any]]:
        """
        Retrieve all discovered relationships.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT * FROM discovered_relationships ORDER BY source_entity, target_entity")
            results = cursor.fetchall()

        for result in results:
            result['foreign_key_info'] = json.loads(result['foreign_key_info'])
        return results

    def detect_changes(self, current: Dict[str, Any], previous: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect changes between current and previous schema state.
        """
        current_tables = set(current.get('tables', []))
        previous_tables = set(previous.get('tables', []))

        changes = {
            "new_tables": list(current_tables - previous_tables),
            "dropped_tables": list(previous_tables - current_tables),
            "modified_tables": [],
            "detected_at": datetime.utcnow().isoformat() + "Z"
        }

        return changes

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            logger.info("DomainStore connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


import os  # Added for schema.sql path resolution
