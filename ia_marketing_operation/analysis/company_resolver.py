"""
analysis/company_resolver.py

Company Resolver - Resolves company data for analysis.
Coordinates with tenant resolver and data aggregator.
"""

import logging
from typing import Dict, List, Any, Optional

import pymysql
from pymysql.cursors import DictCursor

from config.settings import settings

logger = logging.getLogger(__name__)


class CompanyResolver:
    """
    Resolves complete company data for analysis.
    Combines data from multiple sources.
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
        logger.info(f"CompanyResolver connected to {settings.DB_NAME}")

    def get_active_customers(self) -> List[Dict[str, Any]]:
        """
        Get customers with active subscription.
        """
        with self.connection.cursor() as cursor:
            # Discover subscription field dynamically
            cursor.execute("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = 'customers'
                    AND (
                        COLUMN_NAME LIKE '%%subscription%%'
                        OR COLUMN_NAME LIKE '%%status%%'
                        OR COLUMN_NAME LIKE '%%active%%'
                    )
                LIMIT 1
            """, (settings.DB_NAME,))
            field_result = cursor.fetchone()

        if not field_result:
            logger.warning("No subscription field found")
            return []

        subscription_field = field_result['COLUMN_NAME']

        with self.connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT *
                FROM customers
                WHERE `{subscription_field}` IN ('ACTIVE', 'active', 'Active', 1, '1')
                LIMIT 1000
            """)
            return cursor.fetchall()

    def resolve_company(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """
        Resolve company associated with a customer.
        """
        with self.connection.cursor() as cursor:
            # Try customers.company_id -> companies.id
            try:
                cursor.execute("""
                    SELECT c.*
                    FROM companies c
                    INNER JOIN customers cu ON cu.company_id = c.id
                    WHERE cu.id = %s
                    LIMIT 1
                """, (customer_id,))
                result = cursor.fetchone()
                if result:
                    return result
            except Exception:
                pass

            # Try companies.customer_id -> customers.id
            try:
                cursor.execute("""
                    SELECT c.*
                    FROM companies c
                    WHERE c.customer_id = %s
                    LIMIT 1
                """, (customer_id,))
                result = cursor.fetchone()
                if result:
                    return result
            except Exception:
                pass

        return None

    def get_company_products(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Get products for a company.
        """
        with self.connection.cursor() as cursor:
            # Find products table
            cursor.execute("""
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME IN ('products', 'productos', 'company_products')
                LIMIT 1
            """, (settings.DB_NAME,))
            table_result = cursor.fetchone()

        if not table_result:
            return []

        table_name = table_result['TABLE_NAME']

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{table_name}`
                    WHERE company_id = %s
                    LIMIT 1000
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching products: {e}")
                return []

    def get_digital_assets(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Get digital assets for a company.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME IN ('digital_assets', 'assets', 'media', 'company_assets')
                LIMIT 1
            """, (settings.DB_NAME,))
            table_result = cursor.fetchone()

        if not table_result:
            return []

        table_name = table_result['TABLE_NAME']

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{table_name}`
                    WHERE company_id = %s
                    LIMIT 100
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching digital assets: {e}")
                return []

    def get_historical_campaigns(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Get historical campaigns for a company.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME IN ('campaigns', 'campanas', 'marketing_campaigns')
                LIMIT 1
            """, (settings.DB_NAME,))
            table_result = cursor.fetchone()

        if not table_result:
            return []

        table_name = table_result['TABLE_NAME']

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{table_name}`
                    WHERE company_id = %s
                    ORDER BY created_at DESC
                    LIMIT 100
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching campaigns: {e}")
                return []

    def get_historical_metrics(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Get historical metrics for a company.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME IN ('analytics', 'metrics', 'company_analytics', 'marketing_metrics')
                LIMIT 1
            """, (settings.DB_NAME,))
            table_result = cursor.fetchone()

        if not table_result:
            return []

        table_name = table_result['TABLE_NAME']

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{table_name}`
                    WHERE company_id = %s
                    ORDER BY created_at DESC
                    LIMIT 100
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching metrics: {e}")
                return []

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            logger.info("CompanyResolver connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
