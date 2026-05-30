"""
learning/self_learning_engine.py

Self-Learning Engine - Orchestrates continuous learning process.
Detects schema changes, catalogs new entities, and updates knowledge.
"""

import json
import logging
import os
import threading
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

from discovery.inspector import MySQLInspector
from learning.change_detector import ChangeDetector
from learning.catalog_updater import CatalogUpdater
from learning.notifier import Notifier
from storage.domain_store import DomainStore
from config.settings import settings

logger = logging.getLogger(__name__)


class SelfLearningEngine:
    """
    Engine for continuous learning from database schema changes.
    Runs periodic checks and automatically incorporates new knowledge.
    """

    def __init__(self, output_dir: str = "outputs", check_interval: int = 300):
        self.output_dir = output_dir
        self.check_interval = check_interval
        self.notifier = Notifier(output_dir)
        self.domain_store = DomainStore()
        self._running = False
        self._thread = None
        logger.info(f"SelfLearningEngine initialized (check interval: {check_interval}s)")

    def run_learning_cycle(self) -> Dict[str, Any]:
        """
        Execute a complete learning cycle:
        1. Get current schema state
        2. Compare with previous state
        3. Detect changes
        4. Catalog new entities
        5. Update knowledge graph
        6. Notify changes
        """
        logger.info("=" * 60)
        logger.info("Starting Learning Cycle")
        logger.info("=" * 60)

        cycle_results = {
            "started_at": datetime.utcnow().isoformat() + "Z",
            "changes_detected": False,
            "new_tables": [],
            "dropped_tables": [],
            "modified_tables": [],
            "cataloged_entities": [],
            "errors": []
        }

        try:
            with MySQLInspector() as inspector:
                change_detector = ChangeDetector(inspector)
                catalog_updater = CatalogUpdater(inspector, self.output_dir)

                # Step 1: Get current schema hash
                current_hash = change_detector.get_current_schema_hash()
                logger.info(f"Current schema hash: {current_hash[:12]}...")

                # Step 2: Get previous state
                previous_version = self.domain_store.get_previous_state()
                previous_hash = previous_version['version_hash'] if previous_version else None

                # Step 3: Compare with previous
                if previous_hash:
                    comparison = change_detector.compare_with_previous(previous_hash)
                    cycle_results["has_changed"] = comparison["has_changed"]

                    if not comparison["has_changed"]:
                        logger.info("No schema changes detected")
                        cycle_results["message"] = "No changes detected"
                        return cycle_results

                # Step 4: Get detailed change summary
                current_state = change_detector._get_schema_snapshot()

                if previous_version:
                    previous_state = previous_version.get('schema_snapshot', {})
                    if isinstance(previous_state, str):
                        previous_state = json.loads(previous_state)

                    change_summary = change_detector.get_change_summary(previous_state, current_state)
                else:
                    change_summary = {
                        "has_changes": True,
                        "new_tables": list(current_state.get('tables', {}).keys()),
                        "dropped_tables": [],
                        "modified_tables": [],
                        "new_views": current_state.get('views', []),
                        "dropped_views": [],
                        "new_procedures": current_state.get('procedures', []),
                        "dropped_procedures": [],
                        "new_triggers": current_state.get('triggers', []),
                        "dropped_triggers": []
                    }

                cycle_results["changes_detected"] = change_summary["has_changes"]
                cycle_results["new_tables"] = change_summary.get("new_tables", [])
                cycle_results["dropped_tables"] = change_summary.get("dropped_tables", [])
                cycle_results["modified_tables"] = change_summary.get("modified_tables", [])

                # Step 5: Process changes
                if change_summary["has_changes"]:
                    logger.info(f"Changes detected: {len(change_summary.get('new_tables', []))} new, "
                              f"{len(change_summary.get('dropped_tables', []))} dropped, "
                              f"{len(change_summary.get('modified_tables', []))} modified")

                    # Catalog new tables
                    if change_summary.get("new_tables"):
                        update_result = catalog_updater.update_domain_map(change_summary["new_tables"])
                        cycle_results["cataloged_entities"] = update_result.get("cataloged_tables", [])

                        # Notify new entities
                        for entity in update_result.get("cataloged_tables", []):
                            self.notifier.notify_new_entity(entity)

                    # Rebuild knowledge graph
                    catalog_updater.rebuild_knowledge_graph()

                    # Notify schema changes
                    self.notifier.notify_schema_change({
                        "type": "SCHEMA_UPDATE",
                        "new_tables": change_summary.get("new_tables", []),
                        "dropped_tables": change_summary.get("dropped_tables", []),
                        "modified_tables": change_summary.get("modified_tables", [])
                    })

                # Step 6: Save current state
                self.domain_store.save_schema_version(
                    snapshot=current_state,
                    changes=change_summary if change_summary["has_changes"] else None
                )

                catalog_updater.close()

        except Exception as e:
            logger.error(f"Learning cycle error: {e}")
            cycle_results["errors"].append(str(e))

        cycle_results["completed_at"] = datetime.utcnow().isoformat() + "Z"

        logger.info("=" * 60)
        logger.info("Learning Cycle Completed")
        logger.info("=" * 60)

        return cycle_results

    def schedule_periodic_check(self, interval_seconds: int = None):
        """
        Schedule periodic learning checks in a background thread.
        """
        if self._running:
            logger.warning("Periodic check already running")
            return

        interval = interval_seconds or self.check_interval
        self._running = True

        def _run_periodic():
            while self._running:
                try:
                    self.run_learning_cycle()
                except Exception as e:
                    logger.error(f"Periodic check error: {e}")

                time.sleep(interval)

        self._thread = threading.Thread(target=_run_periodic, daemon=True)
        self._thread.start()
        logger.info(f"Periodic check scheduled every {interval}s")

    def stop_periodic_check(self):
        """
        Stop the periodic check thread.
        """
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
            self._thread = None
        logger.info("Periodic check stopped")

    def learn_from_new_data(self) -> Dict[str, Any]:
        """
        Learn from new data in existing tables.
        Analyzes data patterns and updates internal models.
        """
        logger.info("Learning from new data...")

        insights = {
            "learned_at": datetime.utcnow().isoformat() + "Z",
            "data_patterns": [],
            "recommendations": []
        }

        # TODO: Implement data pattern analysis
        # This would analyze actual data in tables to identify patterns
        # For now, we focus on schema-level learning

        return insights

    def update_internal_models(self):
        """
        Update internal models based on learned data.
        """
        logger.info("Updating internal models...")

        # TODO: Implement model updates
        # This could involve retraining ML models or updating rule-based systems

    def generate_learning_report(self) -> str:
        """
        Generate a report of learning activities.
        """
        report = []
        report.append("=" * 60)
        report.append("SELF-LEARNING REPORT")
        report.append("=" * 60)
        report.append(f"Generated: {datetime.utcnow().isoformat()}Z")
        report.append("")

        # Recent notifications
        notifications = self.notifier.get_notifications(limit=20)
        report.append(f"RECENT NOTIFICATIONS: {len(notifications)}")
        report.append("-" * 40)
        for notif in notifications[-10:]:
            report.append(f"  {self.notifier.format_notification(notif)}")

        # Schema versions
        previous_state = self.domain_store.get_previous_state()
        if previous_state:
            report.append("")
            report.append("LAST SCHEMA VERSION:")
            report.append("-" * 40)
            report.append(f"  Hash: {previous_state.get('version_hash', 'Unknown')[:12]}...")
            report.append(f"  Created: {previous_state.get('created_at', 'Unknown')}")

        report.append("")
        report.append("=" * 60)

        return "\n".join(report)

    def close(self):
        """Close all resources."""
        self.stop_periodic_check()
        self.domain_store.close()
        logger.info("SelfLearningEngine closed")


def main():
    """CLI entry point for running self-learning."""
    engine = SelfLearningEngine()
    try:
        results = engine.run_learning_cycle()
        print(json.dumps(results, indent=2, default=str))
        print(engine.generate_learning_report())
    finally:
        engine.close()


if __name__ == "__main__":
    main()
