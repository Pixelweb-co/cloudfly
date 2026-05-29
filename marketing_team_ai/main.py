import logging
import time

from flows.autonomous_flow import AutonomousMarketingFlow
from kafka.results_consumer import start_results_consumer_background
from services.lead_search_job_service import LeadSearchJobService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

logger = logging.getLogger("cloudfly_main")

def run_loop():
    # TODO: Uncomment this when the schema is ready
    #   LeadSearchJobService.ensure_schema()
    start_results_consumer_background()

    flow = AutonomousMarketingFlow()

    cycle = 0

    while True:

        cycle += 1

        logger.info(f"Starting cycle {cycle}")

        try:
            flow.run()
        except Exception as e:
            logger.exception(e)

        logger.info("Waiting 10 minutes...")

        time.sleep(60)

if __name__ == "__main__":
    run_loop()
