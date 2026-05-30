import logging
import os
import signal
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from flows.autonomous_flow import AutonomousMarketingFlow
from kafka.results_consumer import start_results_consumer_background
from services.lead_search_job_service import LeadSearchJobService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

logger = logging.getLogger("cloudfly_main")

_shutdown_requested = False


def _signal_handler(signum, frame):
    global _shutdown_requested
    logger.info("Received signal %s, initiating graceful shutdown...", signum)
    _shutdown_requested = True


def run_loop():
    Config.validate()
    LeadSearchJobService.ensure_schema()
    start_results_consumer_background()

    flow = AutonomousMarketingFlow()

    cycle = 0

    while not _shutdown_requested:
        cycle += 1

        logger.info(f"Starting cycle {cycle}")

        try:
            flow.run()
        except Exception as e:
            logger.exception(e)

        logger.info("Waiting 10 seconds...")

        for _ in range(10):
            if _shutdown_requested:
                break
            time.sleep(1)

    logger.info("Graceful shutdown complete. Total cycles: %s", cycle)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)
    run_loop()
