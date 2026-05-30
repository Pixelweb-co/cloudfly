"""
tenant/tenant_resolver.py

Tenant Resolution - Resolves logical tenants (Companies) from active customers.
Dynamically discovers subscription status field and resolves company associations.
"""

import logging
from typing import Dict, List, Any, Optional

import pymysql
from pymysql.cursors import DictCursor

from config.settings import settings

logger = logging.getLogger(__name__)


class TenantResolver:
    """
    Resolves tenants by finding active customers and their associated companies.
    All field discovery is dynamic - no hardcoded column names.
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
        logger.info(f"TenantResolver connected to {settings.DB_NAME}")

    def discover_subscription_field(self) -> Optional[str]:
        """
        Dynamically discover the subscription status field in customers table.
        Searches for columns containing 'subscription', 'status', or 'active'.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = 'customers'
                    AND (
                        COLUMN_NAME LIKE '%%subscription%%'
                        OR COLUMN_NAME LIKE '%%status%%'
                        OR COLUMN_NAME LIKE '%%active%%'
                        OR COLUMN_NAME LIKE '%%state%%'
                    )
                ORDER BY ORDINAL_POSITION
            """, (settings.DB_NAME,))
            results = cursor.fetchall()

        if results:
            field_name = results[0]['COLUMN_NAME']
            logger.info(f"Discovered subscription field: {field_name}")
            return field_name

        logger.warning("No subscription field found in customers table")
        return None

    def get_active_customers(self) -> List[Dict[str, Any]]:
        """
        Get customers with active subscription.
        Dynamically builds query based on discovered subscription field.
        """
        subscription_field = self.discover_subscription_field()

        if not subscription_field:
            logger.warning("Cannot filter active customers - no subscription field found")
            return []

        # Get the data type to build appropriate query
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = 'customers'
                    AND COLUMN_NAME = %s
            """, (settings.DB_NAME, subscription_field))
            type_result = cursor.fetchone()

        data_type = type_result['DATA_TYPE'] if type_result else 'varchar'

        # Build query based on data type
        if data_type in ('tinyint', 'int', 'smallint', 'mediumint'):
            active_condition = f"`{subscription_field}` = 1"
        else:
            active_condition = f"`{subscription_field}` IN ('ACTIVE', 'active', 'Active', '1', 'true', 'TRUE')"

        with self.connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT *
                FROM customers
                WHERE {active_condition}
                LIMIT 1000
            """)
            return cursor.fetchall()

    def resolve_company_for_customer(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """
        Resolve company associated with a customer.
        Tries multiple common patterns for company-customer relationship.
        """
        with self.connection.cursor() as cursor:
            # Pattern 1: customers.company_id -> companies.id
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
            except Exception as e:
                logger.debug(f"Pattern 1 failed: {e}")

            # Pattern 2: companies.customer_id -> customers.id
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
            except Exception as e:
                logger.debug(f"Pattern 2 failed: {e}")

            # Pattern 3: Check for any column in companies referencing customers
            cursor.execute("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = 'companies'
                    AND COLUMN_NAME LIKE '%%customer%%'
            """, (settings.DB_NAME,))
            customer_columns = cursor.fetchall()

            for col in customer_columns:
                col_name = col['COLUMN_NAME']
                try:
                    cursor.execute(f"""
                        SELECT c.*
                        FROM companies c
                        WHERE c.`{col_name}` = %s
                        LIMIT 1
                    """, (customer_id,))
                    result = cursor.fetchone()
                    if result:
                        return result
                except Exception as e:
                    logger.debug(f"Pattern 3 ({col_name}) failed: {e}")

        logger.warning(f"No company found for customer {customer_id}")
        return None

    def get_all_active_tenants(self) -> List[Dict[str, Any]]:
        """
        Get all active tenants (companies with active customers).
        Returns list of dicts with customer and company data.
        """
        active_customers = self.get_active_customers()
        tenants = []

        for customer in active_customers:
            company = self.resolve_company_for_customer(customer['id'])
            if company:
                tenants.append({
                    "customer": customer,
                    "company": company,
                    "resolved_at": __import__('datetime').datetime.utcnow().isoformat() + "Z"
                })

        logger.info(f"Resolved {len(tenants)} active tenants from {len(active_customers)} active customers")
        return tenants

    def get_tenant_by_id(self, tenant_id: int) -> Optional[Dict[str, Any]]:
        """
        Get specific tenant by company ID.
        """
        with self.connection.cursor() as cursor:
            cursor.execute("""
                SELECT *
                FROM companies
                WHERE id = %s
                LIMIT 1
            """, (tenant_id,))
            company = cursor.fetchone()

        if company:
            # Find associated customers
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT cu.*
                    FROM customers cu
                    WHERE cu.company_id = %s
                    LIMIT 100
                """, (tenant_id,))
                customers = cursor.fetchall()

            return {
                "company": company,
                "customers": customers
            }

        return None

    def validate_tenant_access(self, tenant_id: int) -> bool:
        """
        Validate that a tenant exists and has active customers.
        """
        tenant = self.get_tenant_by_id(tenant_id)
        if not tenant:
            return False

        # Check if any customer has active subscription
        subscription_field = self.discover_subscription_field()
        if not subscription_field:
            return True  # Can't validate, assume valid

        for customer in tenant.get('customers', []):
            value = customer.get(subscription_field)
            if value in ('ACTIVE', 'active', 'Active', 1, '1', 'true', 'TRUE'):
                return True

        return False

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            logger.info("TenantResolver connection closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
