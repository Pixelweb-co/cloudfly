"""
domain/ai_service.py

Core AI service: builds system prompts, calls OpenAI with retries,
dispatches tool calls, and tracks token usage.

Design decisions:
  - Uses tenacity for exponential-backoff retries on transient OpenAI errors.
  - Pipeline state is injected directly into the system prompt (no tool call
    needed to read it) to guarantee the LLM always has stage IDs available.
  - Tool execution is a simple dispatcher pattern — easy to extend.
  - Token usage is logged on every call for cost monitoring.
"""
import json
import logging
from typing import Any, Dict, List, Optional

import requests
from openai import AsyncOpenAI, RateLimitError, APITimeoutError, APIConnectionError
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from application.config import config
from domain.models import ChatMessage, ContactPipelineState, TokenUsage
from domain.exceptions import RetryableError, NonRetryableError

logger = logging.getLogger(__name__)

# Transient OpenAI errors that are worth retrying
_OPENAI_RETRYABLE = (RateLimitError, APITimeoutError, APIConnectionError)

# Tool definitions exposed to the LLM
_TOOLS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_products_semantically",
            "description": (
                "Busca productos en el catálogo usando lenguaje natural. "
                "Úsalo cuando el cliente pregunte por precios, catálogo o disponibilidad."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Término de búsqueda o descripción del producto.",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_products_stock",
            "description": "Consulta el inventario real de productos por sus IDs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "Lista de IDs de productos.",
                    }
                },
                "required": ["product_ids"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_pipeline_stage",
            "description": (
                "Actualiza silenciosamente la etapa de venta del contacto. "
                "Usa SOLO los IDs de etapa que vienen en el [ESTADO INTERNO DEL PIPELINE]."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "contact_id": {"type": "integer"},
                    "stage_id": {"type": "integer"},
                },
                "required": ["contact_id", "stage_id"],
            },
        },
    },
]


class AIService:
    """
    Orchestrates OpenAI calls with tool-use support.
    Inject db and qdrant at construction time for easy testing/mocking.
    """

    def __init__(self, db, qdrant: Optional[QdrantClient] = None) -> None:
        self._openai = AsyncOpenAI(api_key=config.openai_api_key)
        self._db = db          # infrastructure.mysql_client.AsyncMySQLClient
        self._qdrant = qdrant

    # ── System Prompt Builder ─────────────────────────────────────────────

    def _build_system_prompt(
        self,
        company_info: Dict[str, Any],
        agent_config: Dict[str, Any],
        pipeline_state: Optional[ContactPipelineState],
    ) -> str:
        company_block = (
            f"Empresa: {company_info.get('name', 'CloudFly')}\n"
            f"NIT: {company_info.get('nit', 'N/A')}\n"
            f"Dirección: {company_info.get('address', 'N/A')}\n"
            f"Teléfono: {company_info.get('phone', 'N/A')}"
        )
        custom_block = agent_config.get("custom_instructions", "")

        pipeline_block = ""
        if pipeline_state:
            pipeline_block = f"""
[ESTADO INTERNO DEL PIPELINE - SOLO PARA TU USO, NO MENCIONAR AL USUARIO]
Pipeline: {pipeline_state.pipeline_name}
Etapa actual: {pipeline_state.current_stage_name} (ID: {pipeline_state.current_stage_id})

Etapas disponibles (usa estos IDs con update_pipeline_stage):
{pipeline_state.stages_prompt()}
"""

        return f"""Eres un asistente de ventas profesional de CloudFly.
Ayuda al cliente de forma entusiasta, directa y natural.

INFORMACIÓN DE LA EMPRESA:
{company_block}
{custom_block}
{pipeline_block}

FORMATO OBLIGATORIO PARA PRODUCTOS:
Si tienes imagen: escribe la URL en la primera línea. Si no, omítela.
*Nombre del Producto*
Descripción breve
Precio: $X.XX
Estado: Disponible (N unidades) / Agotado

GESTIÓN AUTÓNOMA DEL PIPELINE (proceso interno silencioso):
- Evalúa el contexto de la conversación y usa update_pipeline_stage si el contacto avanza.
- Saludos / consulta inicial → etapa inicial.
- Pregunta por precios o catálogo → etapa de cotización.
- Pide método de pago o confirma compra → etapa de venta/cierre.
- Usa update_pipeline_stage SOLO cuando el cambio esté claramente justificado.

PROHIBICIONES ABSOLUTAS:
- JAMÁS menciones pipelines, IDs, etapas o procesos internos al usuario.
- JAMÁS menciones errores técnicos. Si algo falla internamente, sigue respondiendo con normalidad.
- JAMÁS pidas al usuario que visite páginas externas de registro.

Responde siempre en el idioma del cliente."""

    # ── OpenAI Call (with retries) ─────────────────────────────────────────

    @retry(
        retry=retry_if_exception_type(_OPENAI_RETRYABLE),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _call_openai(self, messages: List[Dict], tools: List[Dict]) -> Any:
        return await self._openai.chat.completions.create(
            model=config.openai_model,
            messages=messages,
            tools=tools,
            temperature=config.openai_temperature,
            timeout=config.openai_timeout_seconds,
        )

    # ── Tool Dispatcher ───────────────────────────────────────────────────

    async def _execute_tool(
        self,
        function_name: str,
        function_args: Dict[str, Any],
        tenant_id: int,
        contact_id: int,
    ) -> str:
        """Dispatch a tool call to its implementation. Returns a JSON string."""
        try:
            if function_name == "search_products_semantically":
                return await self._search_products(function_args["query"], tenant_id)
            elif function_name == "check_products_stock":
                return self._check_stock(function_args["product_ids"], tenant_id)
            elif function_name == "update_pipeline_stage":
                # Note: actual async DB call deferred — we return success optimistically.
                # The orchestrator (main.py) handles the real async DB update.
                return json.dumps({
                    "action": "update_pipeline_stage",
                    "contact_id": function_args["contact_id"],
                    "stage_id": function_args["stage_id"],
                })
            else:
                logger.warning("Unknown tool called", extra={"function_name": function_name})
                return json.dumps({"error": "Unknown tool"})
        except Exception as exc:
            logger.error("Tool execution failed", extra={"tool": function_name, "error": str(exc)})
            return json.dumps({"error": str(exc)})

    # ── Public Entry Point ────────────────────────────────────────────────

    async def generate_response(
        self,
        tenant_id: int,
        contact_id: int,
        conversation_id: str,
        message: str,
        history: List[ChatMessage],
        pipeline_state: Optional[ContactPipelineState],
    ) -> tuple[str, Optional[Dict], TokenUsage]:
        """
        Returns:
          (response_text, pipeline_update_request, token_usage)

          pipeline_update_request: {contact_id, stage_id} if the LLM
          decided to move the stage, otherwise None.
        """
        # Fetch context from DB
        company_info = await self._db.get_company_info(tenant_id)
        agent_config = await self._db.get_tenant_agent_config(tenant_id)

        system_prompt = self._build_system_prompt(company_info, agent_config, pipeline_state)

        messages: List[Dict] = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": message})

        pipeline_update_request: Optional[Dict] = None
        usage = TokenUsage()

        try:
            response = await self._call_openai(messages, _TOOLS)
        except _OPENAI_RETRYABLE as exc:
            raise RetryableError(f"OpenAI transient error: {exc}") from exc
        except Exception as exc:
            raise NonRetryableError(f"OpenAI fatal error: {exc}") from exc

        # Accumulate token usage
        if response.usage:
            usage.prompt_tokens = response.usage.prompt_tokens
            usage.completion_tokens = response.usage.completion_tokens
            usage.total_tokens = response.usage.total_tokens

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        if tool_calls:
            messages.append(response_message)
            for tool_call in tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)

                tool_result = await self._execute_tool(fn_name, fn_args, tenant_id, contact_id)
                tool_data = json.loads(tool_result)

                # Capture pipeline update intent (executed async by orchestrator)
                if fn_name == "update_pipeline_stage" and "action" in tool_data:
                    pipeline_update_request = {
                        "contact_id": tool_data["contact_id"],
                        "stage_id": tool_data["stage_id"],
                    }
                    tool_result = json.dumps({"success": True})

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": fn_name,
                    "content": tool_result,
                })

            # Second OpenAI call with tool results
            try:
                second_response = await self._call_openai(messages, _TOOLS)
            except Exception as exc:
                raise RetryableError(f"Second OpenAI call failed: {exc}") from exc

            if second_response.usage:
                usage.prompt_tokens += second_response.usage.prompt_tokens
                usage.completion_tokens += second_response.usage.completion_tokens
                usage.total_tokens += second_response.usage.total_tokens

            final_text = second_response.choices[0].message.content or ""
        else:
            final_text = response_message.content or ""

        logger.info(
            "AI response generated",
            extra={
                "tenant_id": tenant_id,
                "contact_id": contact_id,
                "conversation_id": conversation_id,
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
                "pipeline_update": pipeline_update_request is not None,
            },
        )

        return final_text, pipeline_update_request, usage

    # ── Tool Implementations ──────────────────────────────────────────────

    async def _search_products(self, query: str, tenant_id: int) -> str:
        if not self._qdrant:
            return json.dumps({"error": "Vector database unreachable"})
        try:
            vector_res = await self._openai.embeddings.create(
                input=query, model="text-embedding-3-small"
            )
            query_vector = vector_res.data[0].embedding
            results = self._qdrant.query_points(
                collection_name="products",
                query=query_vector,
                query_filter=Filter(
                    must=[FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id))]
                ),
                limit=5,
            )
            points = results.points if hasattr(results, "points") else results
            return json.dumps([p.payload for p in points])
        except Exception as exc:
            logger.error("Vector search failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

    def _check_stock(self, product_ids: List[int], tenant_id: int) -> str:
        try:
            ids_str = ",".join(map(str, product_ids))
            url = f"{config.qdrant_host}/productos/stock/multiple?ids={ids_str}&tenantId={tenant_id}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                slim = [
                    {"id": p["id"], "stock": p["inventoryQty"], "status": p["inventoryStatus"]}
                    for p in data
                ]
                return json.dumps(slim)
            return json.dumps({"error": f"API {res.status_code}"})
        except Exception as exc:
            logger.error("Stock check failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

