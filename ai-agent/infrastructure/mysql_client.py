"""
infrastructure/mysql_client.py

Async MySQL connection pool using aiomysql.
Provides context-manager helpers for transactional queries.
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, List, Dict, Any

import aiomysql

from application.config import config
from domain.models import ContactPipelineState, PipelineStage

logger = logging.getLogger(__name__)


class AsyncMySQLClient:
    """
    Wraps an aiomysql connection pool.
    Call await client.connect() at startup; await client.close() on shutdown.
    """

    def __init__(self) -> None:
        self._pool: Optional[aiomysql.Pool] = None

    async def connect(self) -> None:
        self._pool = await aiomysql.create_pool(
            host=config.db_host,
            port=config.db_port,
            user=config.db_user,
            password=config.db_password,
            db=config.db_name,
            minsize=2,
            maxsize=config.db_pool_size,
            autocommit=False,
            charset="utf8mb4",
        )
        logger.info(
            "MySQL pool created",
            extra={"host": config.db_host, "pool_size": config.db_pool_size},
        )

    async def close(self) -> None:
        if self._pool:
            self._pool.close()
            await self._pool.wait_closed()

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[aiomysql.Cursor, None]:
        """
        Async context manager for transactional operations.
        Automatically commits on success, rolls back on any exception.

        Usage:
            async with db.transaction() as cur:
                await cur.execute(...)
        """
        async with self._pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                try:
                    yield cur
                    await conn.commit()
                except Exception as exc:
                    await conn.rollback()
                    logger.error("DB transaction rolled back", extra={"error": str(exc)})
                    raise

    @asynccontextmanager
    async def readonly(self) -> AsyncGenerator[aiomysql.Cursor, None]:
        """Context manager for read-only queries (no commit needed)."""
        async with self._pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                yield cur

    # ── Business Queries ───────────────────────────────────────────────────

    async def get_contact_pipeline_state(
        self, contact_id: int, tenant_id: int
    ) -> Optional[ContactPipelineState]:
        """
        Returns the pipeline state for a contact, or None if no pipeline set.
        Single optimised query using a JOIN.
        """
        sql = """
            SELECT
                c.pipeline_id,
                p.name          AS pipeline_name,
                c.stage_id      AS current_stage_id,
                cs.name         AS current_stage_name,
                ps.id           AS stage_id,
                ps.name         AS stage_name,
                ps.position     AS stage_position,
                ps.color        AS stage_color
            FROM contacts c
            LEFT JOIN pipelines p        ON p.id = c.pipeline_id
            LEFT JOIN pipeline_stages cs ON cs.id = c.stage_id
            LEFT JOIN pipeline_stages ps ON ps.pipeline_id = c.pipeline_id
            WHERE c.id = %s AND c.tenant_id = %s
              AND c.pipeline_id IS NOT NULL
            ORDER BY ps.position ASC
        """
        async with self.readonly() as cur:
            await cur.execute(sql, (contact_id, tenant_id))
            rows: List[Dict[str, Any]] = await cur.fetchall()

        if not rows:
            return None

        first = rows[0]
        stages = [
            PipelineStage(
                id=r["stage_id"],
                name=r["stage_name"],
                position=r["stage_position"],
                color=r["stage_color"],
            )
            for r in rows
            if r["stage_id"] is not None
        ]
        return ContactPipelineState(
            pipeline_id=first["pipeline_id"],
            pipeline_name=first["pipeline_name"] or "",
            current_stage_id=first["current_stage_id"],
            current_stage_name=first["current_stage_name"] or "Desconocido",
            stages=stages,
        )

    async def ensure_pipeline_assigned(
        self, tenant_id: int, contact_id: int
    ) -> bool:
        """
        Assigns the tenant's first pipeline + first stage to a contact
        ONLY if pipeline_id IS NULL. Uses a single atomic UPDATE to avoid
        race conditions. Returns True if an assignment was made.
        """
        # Step 1: Get default pipeline and first stage in one query
        sql_defaults = """
            SELECT p.id AS pipeline_id, ps.id AS stage_id
            FROM pipelines p
            JOIN pipeline_stages ps
              ON ps.pipeline_id = p.id
             AND ps.position = (
                 SELECT MIN(position) FROM pipeline_stages WHERE pipeline_id = p.id
             )
            WHERE p.tenant_id = %s
            ORDER BY p.id ASC
            LIMIT 1
        """
        async with self.transaction() as cur:
            await cur.execute(sql_defaults, (tenant_id,))
            default = await cur.fetchone()
            if not default:
                return False

            pipeline_id = default["pipeline_id"]
            stage_id = default["stage_id"]

            # Step 2: Atomic UPDATE — only touches rows where pipeline is absent
            await cur.execute(
                """
                UPDATE contacts
                   SET pipeline_id = %s, stage_id = %s, updated_at = NOW()
                 WHERE id = %s AND tenant_id = %s AND pipeline_id IS NULL
                """,
                (pipeline_id, stage_id, contact_id, tenant_id),
            )
            rows_affected = cur.rowcount

            if rows_affected == 0:
                return False  # Another worker already set it

            # Step 3: Upsert conversation_pipeline_state for dashboard tracking
            await cur.execute(
                """
                INSERT INTO conversation_pipeline_state
                    (tenant_id, contact_id, pipeline_id, current_stage_id,
                     entered_stage_at, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    pipeline_id       = VALUES(pipeline_id),
                    current_stage_id  = VALUES(current_stage_id),
                    entered_stage_at  = NOW(),
                    updated_at        = NOW()
                """,
                (tenant_id, contact_id, pipeline_id, stage_id),
            )

        logger.info(
            "Pipeline auto-assigned",
            extra={
                "tenant_id": tenant_id,
                "contact_id": contact_id,
                "pipeline_id": pipeline_id,
                "stage_id": stage_id,
            },
        )
        return True

    async def update_stage(
        self, contact_id: int, stage_id: int, tenant_id: int
    ) -> bool:
        """
        Updates contact.stage_id and conversation_pipeline_state in one transaction.
        Returns True on success.
        """
        async with self.transaction() as cur:
            await cur.execute(
                "UPDATE contacts SET stage_id = %s, updated_at = NOW() WHERE id = %s AND tenant_id = %s",
                (stage_id, contact_id, tenant_id),
            )
            # Determine pipeline_id for the upsert
            await cur.execute(
                "SELECT pipeline_id FROM pipeline_stages WHERE id = %s", (stage_id,)
            )
            row = await cur.fetchone()
            pipeline_id = row["pipeline_id"] if row else None

            await cur.execute(
                """
                INSERT INTO conversation_pipeline_state
                    (tenant_id, contact_id, pipeline_id, current_stage_id,
                     entered_stage_at, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    current_stage_id = VALUES(current_stage_id),
                    entered_stage_at = NOW(),
                    updated_at       = NOW()
                """,
                (tenant_id, contact_id, pipeline_id, stage_id),
            )
        logger.info(
            "Stage updated",
            extra={
                "contact_id": contact_id,
                "stage_id": stage_id,
                "tenant_id": tenant_id,
            },
        )
        return True

    async def get_company_info(self, tenant_id: int) -> Dict[str, Any]:
        """Returns name and other details of the company for the system prompt."""
        async with self.readonly() as cur:
            await cur.execute(
                "SELECT name, nit, address, phone FROM companies WHERE tenant_id = %s LIMIT 1",
                (tenant_id,),
            )
            row = await cur.fetchone()
            return row or {}

    async def get_tenant_agent_config(self, tenant_id: int) -> Dict[str, Any]:
        """Returns AI agent custom instructions if configured."""
        async with self.readonly() as cur:
            await cur.execute(
                "SELECT company_specific_context FROM tenant_agent_configs WHERE tenant_id = %s LIMIT 1",
                (tenant_id,),
            )
            row = await cur.fetchone()
            return row or {}

    async def disable_chatbot(self, contact_id: int, tenant_id: int) -> bool:
        """
        Disables the chatbot for a specific contact. This effectively hands
        over the conversation to a human operator.
        """
        async with self.transaction() as cur:
            await cur.execute(
                "UPDATE contacts SET chatbot_enabled = 0, updated_at = NOW() WHERE id = %s AND tenant_id = %s",
                (contact_id, tenant_id),
            )
        logger.info(
            "Chatbot disabled (Handoff to human)",
            extra={"contact_id": contact_id, "tenant_id": tenant_id},
        )
        return True
