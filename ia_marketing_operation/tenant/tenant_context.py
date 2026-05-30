"""
tenant/tenant_context.py

Tenant Context Manager - Manages active tenant context for operations.
Thread-safe implementation for multi-tenant processing.
"""

import logging
import threading
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class TenantContext:
    """
    Thread-safe tenant context manager.
    Maintains the active tenant for the current execution context.
    """

    _local = threading.local()

    @classmethod
    def set_active_tenant(cls, tenant_id: int, tenant_data: Optional[Dict] = None):
        """
        Set the active tenant for the current thread.
        """
        cls._local.tenant_id = tenant_id
        cls._local.tenant_data = tenant_data or {}
        logger.info(f"Active tenant set: {tenant_id}")

    @classmethod
    def get_active_tenant(cls) -> Optional[int]:
        """
        Get the active tenant ID for the current thread.
        """
        return getattr(cls._local, 'tenant_id', None)

    @classmethod
    def get_active_tenant_data(cls) -> Optional[Dict[str, Any]]:
        """
        Get the active tenant data for the current thread.
        """
        return getattr(cls._local, 'tenant_data', None)

    @classmethod
    def get_tenant_metadata(cls) -> Dict[str, Any]:
        """
        Get metadata for the active tenant.
        """
        tenant_data = cls.get_active_tenant_data()
        if not tenant_data:
            return {}

        company = tenant_data.get('company', {})
        return {
            "tenant_id": cls.get_active_tenant(),
            "company_id": company.get('id'),
            "company_name": company.get('name', 'Unknown'),
            "resolved_at": tenant_data.get('resolved_at')
        }

    @classmethod
    def get_tenant_hierarchy(cls) -> Dict[str, Any]:
        """
        Get the hierarchy for the active tenant.
        """
        tenant_data = cls.get_active_tenant_data()
        if not tenant_data:
            return {}

        return {
            "company": tenant_data.get('company', {}),
            "customers": [tenant_data.get('customer', {})] if tenant_data.get('customer') else []
        }

    @classmethod
    def clear_tenant_context(cls):
        """
        Clear the tenant context for the current thread.
        """
        cls._local.tenant_id = None
        cls._local.tenant_data = None
        logger.info("Tenant context cleared")

    @classmethod
    def is_tenant_set(cls) -> bool:
        """
        Check if a tenant is set for the current thread.
        """
        return getattr(cls._local, 'tenant_id', None) is not None
