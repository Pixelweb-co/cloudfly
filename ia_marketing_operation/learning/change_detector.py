"""
learning/change_detector.py

Change Detector - Detects schema changes by comparing current state
with previous known state. Uses SHA256 hashing for efficient comparison.
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from discovery.inspector import MySQLInspector

logger = logging.getLogger(__name__)


class ChangeDetector:
    """
    Detects database schema changes over time.
    Compares current schema state with previous snapshots.
    """

    def __init__(self, inspector: MySQLInspector):
        self.inspector = inspector

    def get_current_schema_hash(self) -> str:
        """
        Generate SHA256 hash of current schema state.
        Includes table names and their column definitions.
        """
        schema_data = self._get_schema_snapshot()
        schema_json = json.dumps(schema_data, sort_keys=True, default=str)
        return hashlib.sha256(schema_json.encode()).hexdigest()

    def _get_schema_snapshot(self) -> Dict[str, Any]:
        """
        Get complete schema snapshot for comparison.
        """
        tables = self.inspector.get_all_tables()
        snapshot = {
            "tables": {},
            "views": [],
            "procedures": [],
            "triggers": []
        }

        for table in tables:
            table_name = table['TABLE_NAME']
            columns = self.inspector.get_table_columns(table_name)
            foreign_keys = self.inspector.get_foreign_keys(table_name)
            indexes = self.inspector.get_indexes(table_name)

            snapshot["tables"][table_name] = {
                "columns": {c['COLUMN_NAME']: c['DATA_TYPE'] for c in columns},
                "foreign_keys": [
                    {
                        "column": fk['COLUMN_NAME'],
                        "references": f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}"
                    }
                    for fk in foreign_keys
                ],
                "indexes": [idx['INDEX_NAME'] for idx in indexes]
            }

        # Views
        views = self.inspector.get_views()
        snapshot["views"] = [v['TABLE_NAME'] for v in views]

        # Procedures
        procedures = self.inspector.get_stored_procedures()
        snapshot["procedures"] = [p['ROUTINE_NAME'] for p in procedures]

        # Triggers
        triggers = self.inspector.get_triggers()
        snapshot["triggers"] = [t['TRIGGER_NAME'] for t in triggers]

        return snapshot

    def compare_with_previous(self, previous_hash: str) -> Dict[str, Any]:
        """
        Compare current schema hash with previous hash.
        """
        current_hash = self.get_current_schema_hash()

        return {
            "has_changed": current_hash != previous_hash,
            "previous_hash": previous_hash,
            "current_hash": current_hash,
            "checked_at": datetime.utcnow().isoformat() + "Z"
        }

    def identify_new_tables(self, previous_tables: List[str],
                           current_tables: List[str]) -> List[str]:
        """
        Identify newly added tables.
        """
        previous_set = set(previous_tables)
        current_set = set(current_tables)
        new_tables = list(current_set - previous_set)

        if new_tables:
            logger.info(f"New tables detected: {new_tables}")
        return new_tables

    def identify_dropped_tables(self, previous_tables: List[str],
                               current_tables: List[str]) -> List[str]:
        """
        Identify removed tables.
        """
        previous_set = set(previous_tables)
        current_set = set(current_tables)
        dropped_tables = list(previous_set - current_set)

        if dropped_tables:
            logger.info(f"Dropped tables detected: {dropped_tables}")
        return dropped_tables

    def identify_modified_tables(self, previous_schema: Dict[str, Any],
                                current_schema: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Identify tables with structural changes (columns, indexes, etc.).
        """
        modified = []

        for table_name in current_schema.get('tables', {}):
            if table_name in previous_schema.get('tables', {}):
                prev_table = previous_schema['tables'][table_name]
                curr_table = current_schema['tables'][table_name]

                changes = {}

                # Check column changes
                prev_columns = set(prev_table.get('columns', {}).keys())
                curr_columns = set(curr_table.get('columns', {}).keys())

                added_columns = curr_columns - prev_columns
                removed_columns = prev_columns - curr_columns

                if added_columns:
                    changes['added_columns'] = list(added_columns)
                if removed_columns:
                    changes['removed_columns'] = list(removed_columns)

                # Check type changes
                type_changes = {}
                for col in curr_columns & prev_columns:
                    if prev_table['columns'][col] != curr_table['columns'][col]:
                        type_changes[col] = {
                            "from": prev_table['columns'][col],
                            "to": curr_table['columns'][col]
                        }
                if type_changes:
                    changes['type_changes'] = type_changes

                # Check FK changes
                prev_fks = set(f"{fk['column']}:{fk['references']}" for fk in prev_table.get('foreign_keys', []))
                curr_fks = set(f"{fk['column']}:{fk['references']}" for fk in curr_table.get('foreign_keys', []))

                added_fks = curr_fks - prev_fks
                removed_fks = prev_fks - curr_fks

                if added_fks:
                    changes['added_foreign_keys'] = list(added_fks)
                if removed_fks:
                    changes['removed_foreign_keys'] = list(removed_fks)

                if changes:
                    modified.append({
                        "table": table_name,
                        "changes": changes
                    })

        if modified:
            logger.info(f"Modified tables detected: {[m['table'] for m in modified]}")
        return modified

    def get_change_summary(self, previous_state: Dict[str, Any],
                          current_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive change summary.
        """
        previous_tables = list(previous_state.get('tables', {}).keys())
        current_tables = list(current_state.get('tables', {}).keys())

        new_tables = self.identify_new_tables(previous_tables, current_tables)
        dropped_tables = self.identify_dropped_tables(previous_tables, current_tables)
        modified_tables = self.identify_modified_tables(previous_state, current_state)

        # View changes
        previous_views = set(previous_state.get('views', []))
        current_views = set(current_state.get('views', []))
        new_views = list(current_views - previous_views)
        dropped_views = list(previous_views - current_views)

        # Procedure changes
        previous_procedures = set(previous_state.get('procedures', []))
        current_procedures = set(current_state.get('procedures', []))
        new_procedures = list(current_procedures - previous_procedures)
        dropped_procedures = list(previous_procedures - current_procedures)

        # Trigger changes
        previous_triggers = set(previous_state.get('triggers', []))
        current_triggers = set(current_state.get('triggers', []))
        new_triggers = list(current_triggers - previous_triggers)
        dropped_triggers = list(previous_triggers - current_triggers)

        has_changes = any([
            new_tables, dropped_tables, modified_tables,
            new_views, dropped_views,
            new_procedures, dropped_procedures,
            new_triggers, dropped_triggers
        ])

        summary = {
            "has_changes": has_changes,
            "new_tables": new_tables,
            "dropped_tables": dropped_tables,
            "modified_tables": modified_tables,
            "new_views": new_views,
            "dropped_views": dropped_views,
            "new_procedures": new_procedures,
            "dropped_procedures": dropped_procedures,
            "new_triggers": new_triggers,
            "dropped_triggers": dropped_triggers,
            "detected_at": datetime.utcnow().isoformat() + "Z"
        }

        if has_changes:
            logger.info(f"Schema changes detected: {len(new_tables)} new, {len(dropped_tables)} dropped, {len(modified_tables)} modified")
        else:
            logger.info("No schema changes detected")

        return summary
