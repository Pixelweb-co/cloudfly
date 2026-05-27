import logging
import time

from flows.autonomous_flow import AutonomousMarketingFlow

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

logger = logging.getLogger("cloudfly_main")

def run_loop():

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

        time.sleep(600)

if __name__ == "__main__":
    run_loop()
