"""
learning/notifier.py

Notifier - Handles notifications for schema changes and detected opportunities.
Supports multiple notification channels (log, file, Kafka).
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class Notifier:
    """
    Notification system for schema changes and opportunities.
    """

    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def notify_new_entity(self, entity: Dict[str, Any]):
        """
        Notify about a newly discovered entity.
        """
        notification = {
            "type": "NEW_ENTITY",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entity_name": entity.get('entity_name', entity.get('name', 'Unknown')),
            "table_name": entity.get('table_name', entity.get('tables', ['Unknown'])),
            "message": f"New entity discovered: {entity.get('entity_name', entity.get('name', 'Unknown'))}"
        }

        self._log_notification(notification)
        self._save_notification(notification)

    def notify_schema_change(self, change: Dict[str, Any]):
        """
        Notify about a schema change.
        """
        notification = {
            "type": "SCHEMA_CHANGE",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "change_type": change.get('type', 'UNKNOWN'),
            "details": change,
            "message": self._format_change_message(change)
        }

        self._log_notification(notification)
        self._save_notification(notification)

    def notify_opportunity(self, opportunity: Dict[str, Any]):
        """
        Notify about a detected opportunity.
        """
        notification = {
            "type": "OPPORTUNITY",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "opportunity_id": opportunity.get('opportunity_id', ''),
            "title": opportunity.get('title', ''),
            "priority": opportunity.get('priority', 'MEDIUM'),
            "category": opportunity.get('category', ''),
            "message": f"New opportunity: {opportunity.get('title', '')} [{opportunity.get('priority', 'MEDIUM')}]"
        }

        self._log_notification(notification)
        self._save_notification(notification)

    def format_notification(self, event: Dict[str, Any]) -> str:
        """
        Format a notification event as a human-readable string.
        """
        event_type = event.get('type', 'UNKNOWN')
        timestamp = event.get('timestamp', datetime.utcnow().isoformat())

        if event_type == 'NEW_ENTITY':
            return f"[{timestamp}] NEW ENTITY: {event.get('entity_name')} (table: {event.get('table_name')})"

        elif event_type == 'SCHEMA_CHANGE':
            return f"[{timestamp}] SCHEMA CHANGE: {event.get('message')}"

        elif event_type == 'OPPORTUNITY':
            return f"[{timestamp}] OPPORTUNITY: {event.get('title')} [{event.get('priority')}]"

        return f"[{timestamp}] {event_type}: {event.get('message', 'No details')}"

    def _format_change_message(self, change: Dict[str, Any]) -> str:
        """
        Format a change dict as a readable message.
        """
        change_type = change.get('type', 'UNKNOWN')

        if change_type == 'NEW_TABLE':
            return f"New table added: {change.get('table_name', 'Unknown')}"

        elif change_type == 'DROPPED_TABLE':
            return f"Table removed: {change.get('table_name', 'Unknown')}"

        elif change_type == 'MODIFIED_TABLE':
            table = change.get('table_name', 'Unknown')
            changes = change.get('changes', {})
            change_details = []
            if 'added_columns' in changes:
                change_details.append(f"added columns: {changes['added_columns']}")
            if 'removed_columns' in changes:
                change_details.append(f"removed columns: {changes['removed_columns']}")
            return f"Table {table} modified: {', '.join(change_details)}"

        return f"Change detected: {json.dumps(change, default=str)[:200]}"

    def _log_notification(self, notification: Dict[str, Any]):
        """
        Log notification to standard logger.
        """
        message = self.format_notification(notification)
        logger.info(message)

    def _save_notification(self, notification: Dict[str, Any]):
        """
        Save notification to file.
        """
        notifications_file = os.path.join(self.output_dir, "notifications.json")

        # Load existing notifications
        existing = []
        if os.path.exists(notifications_file):
            try:
                with open(notifications_file, 'r') as f:
                    existing = json.load(f)
            except (json.JSONDecodeError, IOError):
                existing = []

        # Append new notification
        existing.append(notification)

        # Save
        with open(notifications_file, 'w') as f:
            json.dump(existing, f, indent=2, default=str)

    def get_notifications(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve recent notifications.
        """
        notifications_file = os.path.join(self.output_dir, "notifications.json")

        if os.path.exists(notifications_file):
            try:
                with open(notifications_file, 'r') as f:
                    notifications = json.load(f)
                return notifications[-limit:]
            except (json.JSONDecodeError, IOError):
                return []

        return []
