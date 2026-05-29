#!/usr/bin/env python3
"""Health check only — scraping vía Kafka worker (lead_search_requests)."""

import logging
import os
import time

from fastapi import FastAPI

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="Lead Scraper",
    description="Workers consumen Kafka topic lead_search_requests. Sin HTTP /search.",
    version="3.0.0",
)


@app.get("/")
def root():
    return {
        "service": "Lead Scraper",
        "version": "3.0.0",
        "mode": "kafka-worker",
        "topics": {
            "requests": "lead_search_requests",
            "results": "lead_search_results",
            "errors": "lead_search_errors",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}
