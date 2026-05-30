"""
discovery/inspector.py

MySQL Schema Inspector - Discovers database schema dynamically.
Uses INFORMATION_SCHEMA to inspect tables, columns, foreign keys,
indexes, views, and stored procedures without hardcoding table names.
"""

import logging
from typing import List, Dict, Any, Optional

import pymysql
from pymysql.cursors import DictCursor

from config.settings import settings

logger = logging.getLogger(__name__)


class MySQLInspector:
    """
    Inspects MySQL database schema dynamically.
    All methods query INFORMATION_SCHEMA to avoid hardcoding table names.
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
        logger.info(f"Connected to MySQL: {settings.DB_NAME}@{settings.DB_HOST}")

    def get_all_tables(self) -> List[Dict[str, Any]]:
        """
        Discover all tables in the configured database.
        Returns list of dicts with TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_ROWS, TABLE_COMMENT.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_ROWS, TABLE_COMMENT
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                ORDER BY TABLE_NAME
            """, (settings.DB_NAME,))
            return cursor.fetchall()

    def get_table_columns(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Get columns with types for a specific table.
        Returns COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA, COLUMN_COMMENT.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
                       COLUMN_KEY, EXTRA, COLUMN_COMMENT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                ORDER BY ORDINAL_POSITION
            """, (settings.DB_NAME, table_name))
            return cursor.fetchall()

    def get_foreign_keys(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Get foreign keys for a specific table.
        Returns COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME, UPDATE_RULE, DELETE_RULE.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    kcu.COLUMN_NAME,
                    kcu.REFERENCED_TABLE_NAME,
                    kcu.REFERENCED_COLUMN_NAME,
                    rc.UPDATE_RULE,
                    rc.DELETE_RULE
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                    ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
                    AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
                WHERE kcu.TABLE_SCHEMA = %s
                    AND kcu.TABLE_NAME = %s
                    AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
            """, (settings.DB_NAME, table_name))
            return cursor.fetchall()

    def get_indexes(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Get indexes for a specific table.
        Returns INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                ORDER BY INDEX_NAME, SEQ_IN_INDEX
            """, (settings.DB_NAME, table_name))
            return cursor.fetchall()

    def get_views(self) -> List[Dict[str, Any]]:
        """
        Get all views in the database.
        Returns TABLE_NAME, VIEW_DEFINITION.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME, VIEW_DEFINITION
                FROM INFORMATION_SCHEMA.VIEWS
                WHERE TABLE_SCHEMA = %s
            """, (settings.DB_NAME,))
            return cursor.fetchall()

    def get_stored_procedures(self) -> List[Dict[str, Any]]:
        """
        Get all stored procedures in the database.
        Returns ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED
                FROM INFORMATION_SCHEMA.ROUTINES
                WHERE ROUTINE_SCHEMA = %s
            """, (settings.DB_NAME,))
            return cursor.fetchall()

    def get_table_row_counts(self) -> List[Dict[str, Any]]:
        """
        Get approximate row counts for all tables.
        Returns TABLE_NAME, TABLE_ROWS.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME, TABLE_ROWS
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                ORDER BY TABLE_ROWS DESC
            """, (settings.DB_NAME,))
            return cursor.fetchall()

    def get_triggers(self) -> List[Dict[str, Any]]:
        """
        Get all triggers in the database.
        Returns TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT
                FROM INFORMATION_SCHEMA.TRIGGERS
                WHERE TRIGGER_SCHEMA = %s
            """, (settings.DB_NAME,))
            return cursor.fetchall()

    def get_table_create_statement(self, table_name: str) -> Optional[str]:
        """
        Get the CREATE TABLE statement for a specific table.
        """
        with self.connection.cursor() as cursor:
            cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
            result = cursor.fetchone()
            return result.get('Create Table') if result else None

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            logger.info("MySQL connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
