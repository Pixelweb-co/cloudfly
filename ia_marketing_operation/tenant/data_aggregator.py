"""
tenant/data_aggregator.py

Data Aggregator - Aggregates tenant data from multiple sources.
Collects products, services, campaigns, social accounts, analytics, and CRM data.
"""

import logging
from typing import Dict, List, Any, Optional

import pymysql
from pymysql.cursors import DictCursor

from config.settings import settings

logger = logging.getLogger(__name__)


class DataAggregator:
    """
    Aggregates data for a specific tenant from various tables.
    Uses dynamic discovery to find relevant tables and columns.
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
        logger.info(f"DataAggregator connected to {settings.DB_NAME}")

    def _find_table_with_column(self, column_pattern: str) -> Optional[str]:
        """
        Find a table that contains a column matching the pattern.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT TABLE_NAME, COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                    AND COLUMN_NAME LIKE %s
                LIMIT 1
            """, (settings.DB_NAME, column_pattern))
            result = cursor.fetchone()

        return result['TABLE_NAME'] if result else None

    def _get_company_id_column(self, table_name: str) -> Optional[str]:
        """
        Find the column in a table that references company_id.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = %s
                    AND COLUMN_NAME LIKE '%%company%%'
                LIMIT 1
            """, (settings.DB_NAME, table_name))
            result = cursor.fetchone()

        return result['COLUMN_NAME'] if result else None

    def aggregate_products(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Aggregate products for a company.
        """
        # Find products table
        product_table = self._find_table_with_column('product_name')
        if not product_table:
            product_table = self._find_table_with_column('product_id')
        if not product_table:
            # Try common names
            for name in ['products', 'productos', 'company_products']:
                with self.connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                    """, (settings.DB_NAME, name))
                    if cursor.fetchone():
                        product_table = name
                        break

        if not product_table:
            logger.warning("No products table found")
            return []

        id_column = self._get_company_id_column(product_table) or 'company_id'

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{product_table}`
                    WHERE `{id_column}` = %s
                    LIMIT 1000
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching products: {e}")
                return []

    def aggregate_services(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Aggregate services for a company.
        """
        service_table = None
        for name in ['services', 'servicios', 'company_services']:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """, (settings.DB_NAME, name))
                if cursor.fetchone():
                    service_table = name
                    break

        if not service_table:
            logger.warning("No services table found")
            return []

        id_column = self._get_company_id_column(service_table) or 'company_id'

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{service_table}`
                    WHERE `{id_column}` = %s
                    LIMIT 1000
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching services: {e}")
                return []

    def aggregate_campaigns(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Aggregate campaigns for a company.
        """
        campaign_table = None
        for name in ['campaigns', 'campanas', 'marketing_campaigns']:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """, (settings.DB_NAME, name))
                if cursor.fetchone():
                    campaign_table = name
                    break

        if not campaign_table:
            logger.warning("No campaigns table found")
            return []

        id_column = self._get_company_id_column(campaign_table) or 'company_id'

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{campaign_table}`
                    WHERE `{id_column}` = %s
                    ORDER BY created_at DESC
                    LIMIT 100
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching campaigns: {e}")
                return []

    def aggregate_social_accounts(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Aggregate social media accounts for a company.
        """
        social_table = None
        for name in ['social_accounts', 'social_media', 'company_social_accounts']:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """, (settings.DB_NAME, name))
                if cursor.fetchone():
                    social_table = name
                    break

        if not social_table:
            logger.warning("No social accounts table found")
            return []

        id_column = self._get_company_id_column(social_table) or 'company_id'

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{social_table}`
                    WHERE `{id_column}` = %s
                    LIMIT 100
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching social accounts: {e}")
                return []

    def aggregate_analytics(self, company_id: int) -> List[Dict[str, Any]]:
        """
        Aggregate analytics data for a company.
        """
        analytics_table = None
        for name in ['analytics', 'metrics', 'company_analytics', 'marketing_metrics']:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """, (settings.DB_NAME, name))
                if cursor.fetchone():
                    analytics_table = name
                    break

        if not analytics_table:
            logger.warning("No analytics table found")
            return []

        id_column = self._get_company_id_column(analytics_table) or 'company_id'

        with self.connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    SELECT *
                    FROM `{analytics_table}`
                    WHERE `{id_column}` = %s
                    ORDER BY created_at DESC
                    LIMIT 100
                """, (company_id,))
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Error fetching analytics: {e}")
                return []

    def aggregate_crm_data(self, company_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """
        Aggregate CRM-related data for a company.
        """
        crm_data = {}

        # Contacts
        contact_table = None
        for name in ['contacts', 'contactos', 'company_contacts']:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """, (settings.DB_NAME, name))
                if cursor.fetchone():
                    contact_table = name
                    break

        if contact_table:
            id_column = self._get_company_id_column(contact_table) or 'company_id'
            with self.connection.cursor() as cursor:
                try:
                    cursor.execute(f"""
                        SELECT *
                        FROM `{contact_table}`
                        WHERE `{id_column}` = %s
                        LIMIT 1000
                    """, (company_id,))
                    crm_data['contacts'] = cursor.fetchall()
                except Exception as e:
                    logger.error(f"Error fetching contacts: {e}")
                    crm_data['contacts'] = []

        # Leads
        lead_table = None
        for name in ['leads', 'prospects', 'potential_customers']:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                """, (settings.DB_NAME, name))
                if cursor.fetchone():
                    lead_table = name
                    break

        if lead_table:
            id_column = self._get_company_id_column(lead_table) or 'company_id'
            with self.connection.cursor() as cursor:
                try:
                    cursor.execute(f"""
                        SELECT *
                        FROM `{lead_table}`
                        WHERE `{id_column}` = %s
                        LIMIT 1000
                    """, (company_id,))
                    crm_data['leads'] = cursor.fetchall()
                except Exception as e:
                    logger.error(f"Error fetching leads: {e}")
                    crm_data['leads'] = []

        return crm_data

    def get_full_tenant_profile(self, company_id: int) -> Dict[str, Any]:
        """
        Get complete tenant profile with all aggregated data.
        """
        logger.info(f"Building full tenant profile for company {company_id}")

        profile = {
            "company_id": company_id,
            "products": self.aggregate_products(company_id),
            "services": self.aggregate_services(company_id),
            "campaigns": self.aggregate_campaigns(company_id),
            "social_accounts": self.aggregate_social_accounts(company_id),
            "analytics": self.aggregate_analytics(company_id),
            "crm_data": self.aggregate_crm_data(company_id),
            "aggregated_at": __import__('datetime').datetime.utcnow().isoformat() + "Z"
        }

        # Summary statistics
        profile["summary"] = {
            "total_products": len(profile["products"]),
            "total_services": len(profile["services"]),
            "total_campaigns": len(profile["campaigns"]),
            "total_social_accounts": len(profile["social_accounts"]),
            "total_analytics_records": len(profile["analytics"]),
            "total_contacts": len(profile["crm_data"].get("contacts", [])),
            "total_leads": len(profile["crm_data"].get("leads", []))
        }

        logger.info(f"Tenant profile built: {profile['summary']}")
        return profile

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            logger.info("DataAggregator connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
