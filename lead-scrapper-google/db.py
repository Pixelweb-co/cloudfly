"""MySQL persistence for lead search jobs and scraped leads."""

import json
import logging
import os
from pathlib import Path
from typing import Any

import mysql.connector

logger = logging.getLogger("lead_scraper.db")


def _db_config() -> dict:
    return {
        "host": os.getenv("DB_HOST", "mysql"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "database": os.getenv("DB_DATABASE", "cloud_master"),
        "user": os.getenv("DB_USERNAME", "root"),
        "password": os.getenv("DB_PASSWORD", "widowmaker"),
    }


def ensure_schema() -> None:
    sql_path = Path(__file__).parent / "sql" / "001_lead_search_tables.sql"
    if not sql_path.exists():
        return
    conn = mysql.connector.connect(**_db_config())
    cursor = conn.cursor()
    try:
        for stmt in sql_path.read_text(encoding="utf-8").split(";"):
            stmt = stmt.strip()
            if stmt:
                cursor.execute(stmt)
        conn.commit()
        logger.info("Lead search schema ensured")
    finally:
        cursor.close()
        conn.close()


def get_job_by_request_id(request_id: str) -> dict | None:
    conn = mysql.connector.connect(**_db_config())
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM lead_search_jobs WHERE request_id = %s LIMIT 1",
            (request_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def update_job_status(
    request_id: str,
    status: str,
    *,
    total_leads: int | None = None,
    error_message: str | None = None,
    worker_id_val: str | None = None,
    increment_retries: bool = False,
) -> int | None:
    conn = mysql.connector.connect(**_db_config())
    cursor = conn.cursor()
    try:
        sets = ["status = %s", "updated_at = NOW()"]
        params: list[Any] = [status]

        if total_leads is not None:
            sets.append("total_leads = %s")
            params.append(total_leads)
        if error_message is not None:
            sets.append("error_message = %s")
            params.append(error_message[:2000])
        if worker_id_val:
            sets.append("worker_id = %s")
            params.append(worker_id_val)
        if increment_retries:
            sets.append("retries = retries + 1")
        if status == "completed":
            sets.append("completed_at = NOW()")

        params.append(request_id)
        cursor.execute(
            f"UPDATE lead_search_jobs SET {', '.join(sets)} WHERE request_id = %s",
            tuple(params),
        )
        conn.commit()
        cursor.execute("SELECT id FROM lead_search_jobs WHERE request_id = %s", (request_id,))
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        cursor.close()
        conn.close()


def insert_leads(job_id: int, leads: list) -> int:
    if not leads:
        return 0
    conn = mysql.connector.connect(**_db_config())
    cursor = conn.cursor()
    q = """
        INSERT INTO lead_search_results
        (job_id, nombre, telefono, whatsapp, email, sitio_web, fuente, titulo, ciudad)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    rows = [
        (
            job_id,
            l.nombre,
            l.telefono,
            l.whatsapp,
            l.email,
            l.sitio_web,
            l.fuente,
            l.titulo,
            getattr(l, "ciudad", "") or "",
        )
        for l in leads
    ]
    try:
        cursor.executemany(q, rows)
        conn.commit()
        return len(rows)
    finally:
        cursor.close()
        conn.close()
