"""
main.py

Entry point for the IA Marketing Operation Module.
Orchestrates schema discovery, tenant resolution, company analysis,
and self-learning processes.
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime

from config.settings import settings
from agents.schema_discovery_agent import SchemaDiscoveryAgent
from agents.company_analysis_agent import CompanyAnalysisAgent
from learning.self_learning_engine import SelfLearningEngine
from storage.domain_store import DomainStore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


def print_banner():
    """Print module banner."""
    logger.info("=" * 60)
    logger.info("IA Marketing Operation Module - Initialized")
    logger.info("=" * 60)
    logger.info(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    logger.info(f"Database: {settings.DB_NAME}@{settings.DB_HOST}:{settings.DB_PORT}")
    logger.info(f"SSH Target: {settings.SSH_USER}@{settings.SSH_HOST}:{settings.SSH_PORT}")
    logger.info(f"Kafka: {settings.KAFKA_BOOTSTRAP_SERVERS}")
    logger.info(f"Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    logger.info(f"Qdrant: {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
    logger.info("=" * 60)


def run_discovery(output_dir: str = "outputs"):
    """Run schema discovery process."""
    logger.info("Starting Schema Discovery...")

    agent = SchemaDiscoveryAgent(output_dir=output_dir)
    results = agent.run_discovery()
    report = agent.generate_report()
    print(report)

    return results


def run_analysis(company_id: int = None, output_dir: str = "outputs"):
    """Run company analysis process."""
    logger.info("Starting Company Analysis...")

    agent = CompanyAnalysisAgent(output_dir=output_dir)
    try:
        analyses = agent.run_analysis(company_id=company_id)
        for analysis in analyses:
            report = agent.generate_report(analysis)
            print(report)
        return analyses
    finally:
        agent.close()


def run_self_learning(output_dir: str = "outputs"):
    """Run self-learning cycle."""
    logger.info("Starting Self-Learning Cycle...")

    engine = SelfLearningEngine(output_dir=output_dir)
    try:
        results = engine.run_learning_cycle()
        report = engine.generate_learning_report()
        print(report)
        return results
    finally:
        engine.close()


def run_full_pipeline(output_dir: str = "outputs"):
    """Run the full pipeline: discovery -> tenant resolution -> analysis -> learning."""
    logger.info("=" * 60)
    logger.info("RUNNING FULL PIPELINE")
    logger.info("=" * 60)

    # Step 1: Initialize domain store
    logger.info("Step 1: Initializing Domain Store...")
    with DomainStore() as store:
        store.init_database()

    # Step 2: Run schema discovery
    logger.info("Step 2: Running Schema Discovery...")
    discovery_results = run_discovery(output_dir)

    # Step 3: Run company analysis
    logger.info("Step 3: Running Company Analysis...")
    analysis_results = run_analysis(output_dir=output_dir)

    # Step 4: Run self-learning
    logger.info("Step 4: Running Self-Learning...")
    learning_results = run_self_learning(output_dir)

    logger.info("=" * 60)
    logger.info("FULL PIPELINE COMPLETED")
    logger.info("=" * 60)

    return {
        "discovery": discovery_results,
        "analysis": analysis_results,
        "learning": learning_results
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="IA Marketing Operation Module")
    parser.add_argument(
        'command',
        choices=['discover', 'analyze', 'learn', 'full', 'init'],
        help='Command to execute'
    )
    parser.add_argument(
        '--company-id',
        type=int,
        default=None,
        help='Company ID for analysis (optional)'
    )
    parser.add_argument(
        '--output-dir',
        default='outputs',
        help='Output directory for generated files'
    )

    args = parser.parse_args()

    print_banner()

    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)

    if args.command == 'discover':
        run_discovery(args.output_dir)
    elif args.command == 'analyze':
        run_analysis(args.company_id, args.output_dir)
    elif args.command == 'learn':
        run_self_learning(args.output_dir)
    elif args.command == 'full':
        run_full_pipeline(args.output_dir)
    elif args.command == 'init':
        logger.info("Initializing database tables...")
        with DomainStore() as store:
            store.init_database()
        logger.info("Initialization complete.")


if __name__ == "__main__":
    main()
