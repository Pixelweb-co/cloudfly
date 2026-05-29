"""Lead search jobs: DB + Kafka producer (no HTTP to scraper)."""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import mysql.connector

from config import Config
from kafka.client import create_producer, flush, publish
from kafka.topics import TOPIC_REQUESTS

logger = logging.getLogger("marketing_team_ai.lead_search")


def _conn():
    return mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
    )


def ensure_schema() -> None:
    sql_path = Path(__file__).resolve().parents[1] / "sql" / "001_lead_search_tables.sql"
    if not sql_path.exists():
        logger.warning("SQL migration not found at %s", sql_path)
        return
    conn = _conn()
    cur = conn.cursor()
    try:
        for stmt in sql_path.read_text(encoding="utf-8").split(";"):
            stmt = stmt.strip()
            if stmt:
                cur.execute(stmt)
        conn.commit()
    finally:
        cur.close()
        conn.close()


class LeadSearchJobService:
    def create_and_publish(
        self,
        *,
        category: str,
        country: str,
        company_id: int,
        product_id: Optional[int],
        tenant_id: Optional[int],
        cities: Optional[list[str]] = None,
        max_leads: int = 20,
        context: Optional[dict] = None,
        pages: int = 1,
        country_code: str = "57",
    ) -> str:
        request_id = str(uuid.uuid4())
        cities = cities or []
        ctx = context or {}

        conn = _conn()
        cur = conn.cursor()
        try:
            cur.execute(
                """
                INSERT INTO lead_search_jobs
                (request_id, status, category, country, cities, company_id, product_id,
                 tenant_id, max_leads, context_json)
                VALUES (%s, 'pending', %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    request_id,
                    category,
                    country,
                    json.dumps(cities),
                    company_id,
                    product_id,
                    tenant_id,
                    max_leads,
                    json.dumps(ctx, ensure_ascii=False),
                ),
            )
            conn.commit()
        finally:
            cur.close()
            conn.close()

        payload = {
            "request_id": request_id,
            "company_id": company_id,
            "product_id": product_id,
            "tenant_id": tenant_id,
            "category": category,
            "country": country,
            "cities": cities,
            "max_leads": max_leads,
            "pages": pages,
            "country_code": country_code,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        producer = create_producer()
        publish(producer, TOPIC_REQUESTS, payload)
        flush(producer)

        logger.info(
            "Published lead_search_requests request_id=%s category='%s' company_id=%s max_leads=%s",
            request_id,
            category,
            company_id,
            max_leads,
        )
        return request_id

    def get_job(self, request_id: str) -> Optional[dict]:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(
                "SELECT * FROM lead_search_jobs WHERE request_id = %s LIMIT 1",
                (request_id,),
            )
            row = cur.fetchone()
            if row and row.get("context_json") and isinstance(row["context_json"], str):
                row["context_json"] = json.loads(row["context_json"])
            if row and row.get("cities") and isinstance(row["cities"], str):
                row["cities"] = json.loads(row["cities"])
            return row
        finally:
            cur.close()
            conn.close()

    def load_leads_for_job(self, job_id: int) -> list[dict]:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(
                """
                SELECT nombre, telefono, whatsapp, email, sitio_web, fuente, titulo, ciudad
                FROM lead_search_results WHERE job_id = %s
                """,
                (job_id,),
            )
            rows = cur.fetchall()
        finally:
            cur.close()
            conn.close()

        leads = []
        for item in rows:
            phone = item.get("telefono") or item.get("whatsapp") or ""
            if not phone:
                continue
            leads.append(
                {
                    "name": item.get("nombre") or item.get("titulo") or "Cliente Frío",
                    "phone": phone,
                    "whatsapp": item.get("whatsapp") or "",
                    "email": item.get("email") or "",
                    "website": item.get("sitio_web") or "",
                }
            )
        return leads
