#!/usr/bin/env python3
"""Kafka consumer worker: lead_search_requests → scrape → DB → lead_search_results."""

import logging
import os
import time
from datetime import datetime, timezone

from db import ensure_schema, get_job_by_request_id, insert_leads, update_job_status
from kafka_bus import (
    GROUP_SCRAPER,
    TOPIC_ERRORS,
    TOPIC_REQUESTS,
    TOPIC_RESULTS,
    consume_loop,
    create_consumer,
    create_producer,
    flush_producer,
    publish,
    worker_id,
)
from scraper.engine import scrape

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("lead_scraper.worker")

MAX_RETRIES = int(os.getenv("LEAD_SEARCH_MAX_RETRIES", "3"))
BACKOFF_BASE_SEC = float(os.getenv("LEAD_SEARCH_BACKOFF_BASE", "2.0"))


def _build_query(payload: dict) -> str:
    parts = [payload.get("category", "")]
    cities = payload.get("cities") or []
    if cities:
        parts.append(cities[0])
    parts.append(payload.get("country", ""))
    return " ".join(p for p in parts if p).strip()


def _handle_failure(producer, payload: dict, error: str, retryable: bool) -> None:
    request_id = payload.get("request_id", "")
    job = get_job_by_request_id(request_id)
    retries = (job or {}).get("retries", 0)

    update_job_status(
        request_id,
        "retrying" if retryable and retries < MAX_RETRIES else "failed",
        error_message=error,
        increment_retries=retryable,
    )

    err_event = {
        "request_id": request_id,
        "status": "failed",
        "error": error[:500],
        "retryable": retryable and retries < MAX_RETRIES,
        "retries": retries + (1 if retryable else 0),
        "failed_at": datetime.now(timezone.utc).isoformat(),
    }
    publish(producer, TOPIC_ERRORS, err_event)
    flush_producer(producer)

    if retryable and retries < MAX_RETRIES:
        delay = BACKOFF_BASE_SEC * (2 ** retries)
        logger.warning(
            "request_id=%s retry %s/%s in %.1fs error=%s",
            request_id,
            retries + 1,
            MAX_RETRIES,
            delay,
            error,
        )
        time.sleep(delay)
        publish(producer, TOPIC_REQUESTS, payload)
        flush_producer(producer)
        update_job_status(request_id, "pending")


def handle_request(payload: dict, producer) -> None:
    request_id = payload.get("request_id")
    if not request_id:
        logger.error("Missing request_id in payload")
        return

    wid = worker_id()
    t0 = time.time()
    logger.info(
        "request_id=%s worker_id=%s category='%s' max_leads=%s",
        request_id,
        wid,
        payload.get("category"),
        payload.get("max_leads"),
    )

    job = get_job_by_request_id(request_id)
    if not job:
        logger.error("request_id=%s job not found in DB", request_id)
        return

    job_id = job["id"]
    update_job_status(request_id, "processing", worker_id_val=wid)

    try:
        query = _build_query(payload)
        max_leads = int(payload.get("max_leads") or 20)
        country_code = payload.get("country_code", "57")

        leads = scrape(
            query=query,
            pages=int(payload.get("pages", 1)),
            country_code=country_code,
            headless=True,
            verbose=False,
            max_links=max_leads,
            city=(payload.get("cities") or [""])[0] if payload.get("cities") else "",
        )

        saved = insert_leads(job_id, leads)
        update_job_status(request_id, "completed", total_leads=saved)

        result_event = {
            "request_id": request_id,
            "status": "completed",
            "total_leads": saved,
            "job_id": job_id,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_s": round(time.time() - t0, 2),
            "worker_id": wid,
        }
        publish(producer, TOPIC_RESULTS, result_event)
        flush_producer(producer)

        logger.info(
            "request_id=%s completed job_id=%s leads=%s duration_s=%.2f worker_id=%s",
            request_id,
            job_id,
            saved,
            time.time() - t0,
            wid,
        )
    except Exception as e:
        logger.exception("request_id=%s scrape failed", request_id)
        _handle_failure(producer, payload, str(e), retryable=True)


def main() -> None:
    ensure_schema()
    producer = create_producer()
    consumer = create_consumer(GROUP_SCRAPER, [TOPIC_REQUESTS])

    def _handler(payload: dict) -> None:
        handle_request(payload, producer)

    logger.info("Lead scraper worker started worker_id=%s", worker_id())
    consume_loop(consumer, [TOPIC_REQUESTS], _handler)


if __name__ == "__main__":
    main()
