"""Background consumer for lead_search_results and lead_search_errors."""

import logging
import threading

from flows.autonomous_flow import AutonomousMarketingFlow
from flows.lead_search_pipeline import LeadSearchPipeline
from kafka.client import consume_forever, create_producer, create_results_consumer, publish, flush
from kafka.topics import TOPIC_ERRORS, TOPIC_REQUESTS, TOPIC_RESULTS
from services.lead_search_job_service import LeadSearchJobService

logger = logging.getLogger("marketing_team_ai.kafka_consumer")

_consumer_thread: threading.Thread | None = None
MAX_RETRIES = 3


def _handle_message(payload: dict, topic: str) -> None:
    flow = AutonomousMarketingFlow()
    pipeline = LeadSearchPipeline(flow)

    if topic == TOPIC_RESULTS and payload.get("status") == "completed":
        pipeline.on_search_completed(payload)
    elif topic == TOPIC_ERRORS:
        pipeline.on_search_error(payload)
        if payload.get("retryable"):
            _maybe_republish_retry(payload)


def _maybe_republish_retry(event: dict) -> None:
    request_id = event.get("request_id")
    if not request_id:
        return
    retries = event.get("retries", 0)
    if retries >= MAX_RETRIES:
        logger.warning(
            "request_id=%s max retries (%s) exceeded, skipping re-publish",
            request_id, MAX_RETRIES,
        )
        return
    job = LeadSearchJobService().get_job(request_id)
    if not job or job.get("status") not in ("retrying", "pending"):
        return
    producer = create_producer()
    retry_payload = {
        "request_id": request_id,
        "company_id": job["company_id"],
        "product_id": job.get("product_id"),
        "tenant_id": job.get("tenant_id"),
        "category": job["category"],
        "country": job["country"],
        "cities": job.get("cities") or [],
        "max_leads": job.get("max_leads", 20),
        "retries": retries + 1,
    }
    publish(producer, TOPIC_REQUESTS, retry_payload)
    flush(producer)
    logger.info(
        "request_id=%s re-published to lead_search_requests (retry %s/%s)",
        request_id, retries + 1, MAX_RETRIES,
    )


def _run_consumer() -> None:
    LeadSearchJobService.ensure_schema()
    consumer = create_results_consumer()
    consume_forever(consumer, [TOPIC_RESULTS, TOPIC_ERRORS], _handle_message)


def start_results_consumer_background() -> None:
    global _consumer_thread
    if _consumer_thread and _consumer_thread.is_alive():
        return
    _consumer_thread = threading.Thread(
        target=_run_consumer,
        name="lead-search-results-consumer",
        daemon=True,
    )
    _consumer_thread.start()
    logger.info("Lead search results consumer thread started")


def is_consumer_healthy() -> bool:
    """Check if the consumer thread is still alive."""
    return _consumer_thread is not None and _consumer_thread.is_alive()
