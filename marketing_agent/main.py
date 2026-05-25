"""Marketing Agent Orchestrator

This module implements the :class:`MarketingAgent` class which is responsible for
executing a full marketing campaign.  The implementation follows the
specification in the Jira ticket and the architectural diagram.

The orchestrator performs the following steps:

1.  Initialise services (ProductService, CampaignService, EvolutionService).
2.  Fetch the active product with an image for the tenant.
3.  Build a campaign message from the product data.
4.  Retrieve active contacts from MySQL.
5.  Send the campaign to each contact applying anti‑spam delays.
6.  Log a summary of the campaign.

The module is intentionally lightweight so that it can be executed as a
stand‑alone script (``python -m marketing_agent.main``) or imported by the
unit tests.
"""

from __future__ import annotations

import os
import time
import random
import logging
from typing import List, Dict, Any

import mysql.connector
from mysql.connector import pooling

from .services.product_service import ProductService, ProductNotFoundException
from .services.campaign_service import CampaignService
from .services.evolution_service import EvolutionService
from .config import get_config

# Configure logging – the tests capture stdout, so we keep it simple.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# Anti‑spam constants – can be overridden via environment variables.
MIN_DELAY_MS = int(os.getenv("MIN_DELAY_MS", 3000))
MAX_DELAY_MS = int(os.getenv("MAX_DELAY_MS", 12000))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 20))
BATCH_PAUSE_MS = int(os.getenv("BATCH_PAUSE_MS", 30000))


class MarketingAgent:
    """Orchestrates a marketing campaign.

    Parameters
    ----------
    tenant_id: int
        The tenant for which the campaign is executed.
    company_id: int
        The company within the tenant.
    """

    def __init__(self, tenant_id: int, company_id: int):
        self.tenant_id = tenant_id
        self.company_id = company_id

        # Services
        self.product_service = ProductService()
        self.campaign_service = CampaignService()
        self.evolution_service = EvolutionService()

        # DB connection pool – created once per agent instance.
        cfg = get_config()
        self.db_pool = pooling.MySQLConnectionPool(
            pool_name="marketing_agent_pool",
            pool_size=5,
            pool_reset_session=True,
            host=cfg["DB_HOST"],
            port=int(cfg["DB_PORT"]),
            database=cfg["DB_DATABASE"],
            user=cfg["DB_USERNAME"],
            password=cfg["DB_PASSWORD"],
        )

    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------
    def _delay(self, ms: int):
        """Sleep for *ms* milliseconds.

        The helper exists so that unit tests can patch it easily.
        """
        time.sleep(ms / 1000.0)

    def get_active_contacts(self) -> List[Dict[str, Any]]:
        """Return a list of active contacts for the tenant/company.

        The method uses a connection pool to avoid creating a new
        connection for every call.
        """
        query = (
            "SELECT id, name, email, phone "
            "FROM contacts "
            "WHERE tenant_id = %s AND company_id = %s AND is_active = 1"
        )
        conn = self.db_pool.get_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, (self.tenant_id, self.company_id))
            results = cursor.fetchall()
            return results
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------
    # Main execution loop
    # ------------------------------------------------------------------
    def run(self):
        """Execute the marketing campaign.

        The method is intentionally straightforward – it logs progress and
        handles errors gracefully so that a failure for one contact does not
        abort the entire campaign.
        """
        log.info("Starting marketing campaign for tenant %s, company %s", self.tenant_id, self.company_id)

        # 1. Fetch active product
        try:
            product = self.product_service.get_active_product_with_image(self.tenant_id)
        except ProductNotFoundException:
            log.error("No active product found for tenant %s", self.tenant_id)
            return

        # 2. Build campaign message
        campaign_msg = self.campaign_service.build_campaign_message(product)

        # 3. Get contacts
        contacts = self.get_active_contacts()
        total = len(contacts)
        if total == 0:
            log.warning("No active contacts found – campaign aborted")
            return

        sent = 0
        failed = 0

        for idx, contact in enumerate(contacts, start=1):
            phone = contact.get("phone")
            if not phone:
                log.warning("Contact %s has no phone – skipping", contact.get("id"))
                continue

            # a. Send composing presence
            try:
                self.evolution_service.send_composing(phone)
            except Exception as exc:
                log.warning("Failed to send composing to %s: %s", phone, exc)

            # b. Random delay 1.5‑3.5s
            self._delay(random.randint(1500, 3500))

            # c. Send message
            try:
                self.evolution_service.send_message(phone, campaign_msg)
                sent += 1
            except Exception as exc:
                log.error("Failed to send message to %s: %s", phone, exc)
                failed += 1

            # d. Random delay 3‑12s
            self._delay(random.randint(3000, 12000))

            # e. Batch pause
            if idx % BATCH_SIZE == 0:
                pause = random.randint(30000, 45000)
                log.info("Batch pause for %s ms", pause)
                self._delay(pause)

        # 6. Summary
        log.info("✅ Campaign completed!")
        log.info(
            "📊 Summary:\n   - Product: %s\n   - Total contacts: %s\n   - Sent: %s\n   - Failed: %s",
            product.get("productName"),
            total,
            sent,
            failed,
        )


# ----------------------------------------------------------------------
# CLI entry point – allows ``python -m marketing_agent.main``
# ----------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run marketing campaign")
    parser.add_argument("--tenant", type=int, required=True, help="Tenant ID")
    parser.add_argument("--company", type=int, required=True, help="Company ID")
    args = parser.parse_args()

    agent = MarketingAgent(args.tenant, args.company)
    agent.run()
