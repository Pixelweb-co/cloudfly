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
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
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

# --- Dynamic Prompt Constants ---

PROMPT_EXPLORE = """Eres un asistente de ventas de {company_info}. Tu objetivo es saludar cordialmente, entender las necesidades del cliente y despertar su interés.

REGLA DE PERFILAMIENTO: 
1. Si el cliente proporciona su Nombre o Email, DEBES usar 'manage_contact' (action: update) para actualizar su ficha técnica inmediatamente con el ID de contacto actual (revisa el estado interno).
2. Si el cliente pregunta por productos, usa 'search_products_semantically'.
3. Si detectas un interés claro en comprar o agendar, responde con entusiasmo y prepárate para el siguiente paso."""

PROMPT_INTENT = """Eres un experto comercial de {company_info}. El cliente muestra un interés claro en nuestros productos o servicios. Tu labor es destacar los beneficios, resolver dudas y perfilar la venta.

[ESTADO INTERNO DEL PIPELINE]
{pipeline_context}

REGLA DE PERFILAMIENTO: 
1. Si el usuario te da un dato (Nombre o Email) que NO está en el estado interno arriba, usa 'manage_contact' (action: update) para guardarlo de inmediato.
2. Si el cliente muestra intención de avanzar, valida los datos faltantes. Si ya existen, confírmalos (ej: "Confírmame si tu correo es [email]").
3. Utiliza 'search_products_semantically' para encontrar productos. Si envías fotos, usa el formato [URL].
"""

PROMPT_CLOSING = """Eres un cerrador de ventas experto de {company_info}. El cliente está listo para comprar o agendar. 

[ESTADO INTERNO DEL PIPELINE]
{pipeline_context}

REGLA DE ORO: Antes de usar 'create_order' o 'manage_calendar_event', DEBES:
1. Validar que el Nombre y Email estén en el sistema (revisa el estado interno).
2. Si falta algo o el usuario proporciona datos nuevos, usa 'manage_contact' (action: update) inmediatamente.
3. Solicita confirmación explícita de los datos (ej: "¿Mantenemos el correo [email]?").

NO intentes cerrar el trato sin tener estos datos validados y guardados en el CRM.

Para la gestión de pedidos, utiliza 'create_order'. Asegúrate de haber confirmado los productos, cantidades y precios antes de llamar a esta herramienta.

Para la gestión de citas o agendamientos, utiliza 'manage_calendar_event'. Antes de agendar, usa 'search_calendar_events' para revisar la disponibilidad general. Para consultar visitas previas del contacto, usa 'filter_by_contact': true. Las citas duran 30 min por defecto con recordatorio de 5 min.

REGLA ESTRICTA: Es TU responsabilidad cerrar el trato o agendar las citas necesarias. JAMÁS delegues esta tarea a un humano a menos que sea estrictamente necesario mediante 'transfer_to_human'."""

def classify_mode_by_pipeline(pipeline_data: dict, message: str) -> str:
    msg = message.lower()
    
    # Priority 1: Direct Purchase/Order/Calendar Intent -> Always CLOSING (Tools enabled)
    if any(k in msg for k in ["comprar", "lo quiero", "confirmo", "pedido", "pedir", "orden", "haz el pedido", "cita", "visita", "reprograme", "reprogramar", "agendar"]):
        return "CLOSING"
    
    # Priority 2: Providing contact data -> At least INTENT
    if "@" in msg or any(char.isdigit() for char in msg if char not in " +-.()"):
        # If it's just a number/email, it's likely a response to a previous data request.
        # We classify as INTENT to ensure tools are active and profiling rule is present.
        return "INTENT"
    
    # Priority 2: Product/Price Interest -> Always INTENT (Tools enabled)
    if any(k in msg for k in ["precio", "producto", "catalogo", "catálogo", "cuánto", "cuanto", "valen", "vale"]):
        return "INTENT"

    # Priority 3: Pipeline-based classification
    if not pipeline_data:
        return "EXPLORE"
        
    stage_name = pipeline_data.get("current_stage_name", "").lower()
    
    if any(s in stage_name for s in ["negociacion", "negociación", "cierre", "venta", "cliente"]):
        return "CLOSING"
    if any(s in stage_name for s in ["interes", "interés", "cotizacion", "cotización"]):
        return "INTENT"
        
    return "EXPLORE"

# Tool definitions exposed to the LLM
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_products_semantically",
            "description": "Busca productos en el catálogo usando lenguaje natural. Úsalo para encontrar qué vendemos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Descripción del producto o necesidad del cliente.",
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
            "description": "Verifica el stock y disponibilidad de uno o varios productos por sus IDs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "Lista de IDs de productos a verificar.",
                    }
                },
                "required": ["product_ids"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_contact",
            "description": "Busca un contacto existente por su teléfono o email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "identifier": {
                        "type": "string",
                        "description": "Teléfono o email del contacto.",
                    }
                },
                "required": ["identifier"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_contact",
            "description": "Crea o actualiza la información de un contacto (nombre, email, dirección, documento, etc). Úsalo siempre que el cliente proporcione o confirme sus datos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["create", "update"]},
                    "contact_id": {"type": "integer", "description": "Requerido para update."},
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "phone": {"type": "string"},
                    "address": {"type": "string"},
                    "tax_id": {"type": "string", "description": "NIT o ID tributario"},
                    "document_type": {"type": "string", "enum": ["CC", "NIT", "TI", "PASAPORTE"]},
                    "document_number": {"type": "string"},
                },
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_order",
            "description": "Crea un pedido oficial. Llama a esto SOLO después de haber solicitado y confirmado el Nombre y Email del cliente para actualizar su ficha.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "integer"},
                    "notes": {"type": "string"},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "productId": {"type": "integer"},
                                "productName": {"type": "string"},
                                "quantity": {"type": "integer"},
                                "unitPrice": {"type": "number"},
                            },
                            "required": ["productId", "productName", "quantity", "unitPrice"],
                        },
                    },
                },
                "required": ["customer_id", "items"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_order",
            "description": "Consulta detalles de un pedido previo.",
            "parameters": {
                "type": "object",
                "properties": {"order_id": {"type": "integer"}},
                "required": ["order_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "modify_order",
            "description": "Modifica un pedido existente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "integer"},
                    "items": {"type": "array", "items": {"type": "object"}},
                    "notes": {"type": "string"},
                },
                "required": ["order_id", "items"],
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
    {
        "type": "function",
        "function": {
            "name": "get_contact_pipeline",
            "description": "Consulta todas las etapas disponibles del pipeline para un contacto.",
            "parameters": {
                "type": "object",
                "properties": {"contact_id": {"type": "integer"}},
                "required": ["contact_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_quote",
            "description": "Crea una cotización (proforma). Úsalo SOLO después de haber solicitado y confirmado el Nombre y Email del cliente para actualizar su ficha.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "integer"},
                    "notes": {"type": "string"},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "productId": {"type": "integer"},
                                "productName": {"type": "string"},
                                "quantity": {"type": "integer"},
                                "unitPrice": {"type": "number"},
                            },
                            "required": ["productId", "productName", "quantity", "unitPrice"],
                        },
                    },
                },
                "required": ["customer_id", "items"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "convert_quote_to_order",
            "description": "Convierte una cotización previa en un pedido oficial.",
            "parameters": {
                "type": "object",
                "properties": {"quote_id": {"type": "integer"}},
                "required": ["quote_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "transfer_to_human",
            "description": (
                "Transfiere la conversación a un asesor humano cuando no puedas ayudar al cliente, "
                "si el cliente lo pide explícitamente, o si detectas frustración extrema."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Breve razón de la transferencia.",
                    }
                },
                "required": ["reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_calendar_event",
            "description": "Crea o actualiza un evento en el Calendario IA. Llama a esto SOLO después de haber solicitado y confirmado el Nombre y Email del cliente para actualizar su ficha.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["create", "update"]},
                    "event_id": {"type": "integer", "description": "Requerido para update."},
                    "title": {"type": "string", "description": "Título creativo basado en el motivo."},
                    "description": {"type": "string"},
                    "start_time": {"type": "string", "description": "ISO 8601 (ej: 2024-04-28T15:00:00)"},
                    "email": {"type": "string", "description": "Email del contacto para confirmación."},
                },
                "required": ["action", "title", "start_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_calendar_events",
            "description": "Busca eventos existentes en un rango de fechas para verificar disponibilidad.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_time": {"type": "string", "description": "Inicio del rango ISO 8601 (ej: 2024-04-28T00:00:00)"},
                    "end_time": {"type": "string", "description": "Fin del rango ISO 8601 (ej: 2024-04-30T23:59:59)"},
                    "filter_by_contact": {"type": "boolean", "description": "Si es true, solo busca eventos del contacto actual."}
                },
                "required": ["start_time", "end_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_calendar_event",
            "description": "Elimina o cancela una cita del calendario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "integer"},
                },
                "required": ["event_id"],
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
        self._db = db
        self._qdrant = qdrant

    # ── OpenAI Call (with retries) ─────────────────────────────────────────

    @retry(
        retry=retry_if_exception_type(_OPENAI_RETRYABLE),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _call_openai_dynamic(self, messages: List[Dict], tools: Optional[List[Dict]], temperature: float) -> Any:
        return await self._openai.chat.completions.create(
            model=config.openai_model,
            messages=messages,
            tools=tools if tools else None,
            temperature=temperature,
            timeout=config.openai_timeout_seconds,
        )

    # ── Tool Dispatcher ───────────────────────────────────────────────────

    async def _execute_tool(
        self,
        function_name: str,
        function_args: Dict[str, Any],
        tenant_id: int,
        contact_id: int,
        message_id: str = "unknown",
    ) -> str:
        """Dispatch a tool call to its implementation. Returns a JSON string."""
        log_ctx = {"tool": function_name, "func_args": function_args, "tenant_id": tenant_id, "contact_id": contact_id, "message_id": message_id}
        logger.info(f"Executing tool: {function_name}", extra=log_ctx)
        try:
            if function_name == "search_products_semantically":
                return await self._search_products(function_args["query"], tenant_id)
            elif function_name == "check_products_stock":
                return self._check_stock(function_args["product_ids"], tenant_id)
            elif function_name == "update_pipeline_stage":
                return json.dumps({
                    "action": "update_pipeline_stage",
                    "contact_id": function_args["contact_id"],
                    "stage_id": function_args["stage_id"],
                })
            elif function_name == "get_contact_pipeline":
                return await self._get_contact_pipeline(function_args["contact_id"], tenant_id)
            elif function_name == "get_contact":
                return await self._get_contact(function_args["identifier"], tenant_id)
            elif function_name == "manage_contact":
                return await self._manage_contact(function_args, tenant_id)
            elif function_name == "create_order":
                return await self._create_order(
                    function_args["customer_id"], 
                    function_args["items"], 
                    tenant_id, 
                    function_args.get("notes"),
                    message_id
                )
            elif function_name == "get_order":
                return await self._get_order(function_args["order_id"], tenant_id)
            elif function_name == "modify_order":
                return await self._modify_order(
                    function_args["order_id"], function_args["items"], tenant_id, function_args.get("notes")
                )
            elif function_name == "transfer_to_human":
                return self._transfer_to_human(function_args["reason"])
            elif function_name == "create_quote":
                return await self._create_quote(
                    function_args["customer_id"],
                    function_args["items"],
                    tenant_id,
                    function_args.get("notes"),
                    message_id
                )
            elif function_name == "convert_quote_to_order":
                return await self._convert_quote_to_order(function_args["quote_id"], tenant_id)
            elif function_name == "manage_calendar_event":
                return await self._manage_calendar_event(function_args, tenant_id, contact_id)
            elif function_name == "search_calendar_events":
                return await self._search_calendar_events(function_args, tenant_id, contact_id)
            elif function_name == "delete_calendar_event":
                return await self._delete_calendar_event(function_args, tenant_id)
            else:
                return json.dumps({"error": f"Unknown tool: {function_name}"})
        except Exception as exc:
            logger.error("Tool execution failed", extra={"tool": function_name, "error": str(exc)})
            return json.dumps({"error": str(exc)})

    # ── Public Entry Point ────────────────────────────────────────────────

    async def generate_response(
        self,
        tenant_id: int,
        company_id: Optional[int],
        contact_id: int,
        conversation_id: str,
        message: str,
        history: List[ChatMessage],
        pipeline_state: Optional[ContactPipelineState],
        message_id: str = "unknown",
    ) -> tuple[str, Optional[Dict], Optional[Dict], TokenUsage]:
        """
        Builds the prompt and calls OpenAI in a tool execution loop.
        Returns (final_text, pipeline_update_request, handoff_request, token_usage)
        """
        log_ctx = {
            "tenant_id": tenant_id,
            "contact_id": contact_id,
            "conversation_id": conversation_id,
            "message_id": message_id
        }
        # 1. Fetch Context and Pipeline State
        company_info_data = await self._db.get_company_info(tenant_id, company_id)
        company_info_str = f"{company_info_data.get('name')} (NIT: {company_info_data.get('nit')})"
        
        pipeline_data = {}
        try:
            # Reusing internal tool implementation to fetch full pipeline JSON
            pipeline_json = await self._get_contact_pipeline(contact_id, tenant_id)
            pipeline_data = json.loads(pipeline_json) if not "error" in pipeline_json else {}
        except Exception as e:
            logger.warning(f"Could not fetch pipeline data: {e}", extra=log_ctx)

        # 2. Classify Mode and Set Dynamic Parameters
        mode = classify_mode_by_pipeline(pipeline_data, message)
        logger.info(f"AI Mode: {mode}", extra=log_ctx)

        if mode == "EXPLORE":
            system_prompt = PROMPT_EXPLORE.format(company_info=company_info_str)
            temp = 0.7
            active_tools = TOOLS
        elif mode == "INTENT":
            pipeline_context = json.dumps(pipeline_data, indent=2)
            logger.info(f"Pipeline Context for LLM (INTENT): {pipeline_context}", extra=log_ctx)
            system_prompt = PROMPT_INTENT.format(company_info=company_info_str, pipeline_context=pipeline_context)
            temp = 0.5
            active_tools = TOOLS
        else: # CLOSING
            pipeline_context = json.dumps(pipeline_data, indent=2)
            logger.info(f"Pipeline Context for LLM: {pipeline_context}", extra=log_ctx)
            system_prompt = PROMPT_CLOSING.format(company_info=company_info_str, pipeline_context=pipeline_context)
            temp = 0.3
            active_tools = TOOLS
            
        # Append current datetime to system prompt
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        system_prompt += f"\n\n[CONTEXTO DEL SISTEMA]\nFecha y hora actual: {now_str}\nUsa esta fecha como referencia para 'hoy', 'mañana', etc."

        messages: List[Dict] = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": message})

        pipeline_update_request: Optional[Dict] = None
        handoff_request: Optional[Dict] = None
        usage = TokenUsage()
        final_text = ""

        # Loop to handle sequential tool calls (max 5 iterations)
        for _ in range(5):
            try:
                response = await self._call_openai_dynamic(messages, active_tools, temp)
            except _OPENAI_RETRYABLE as exc:
                raise RetryableError(f"OpenAI transient error: {exc}") from exc
            except Exception as exc:
                raise NonRetryableError(f"OpenAI fatal error: {exc}") from exc

            # Track token usage
            if response.usage:
                usage.prompt_tokens += response.usage.prompt_tokens
                usage.completion_tokens += response.usage.completion_tokens
                usage.total_tokens += response.usage.total_tokens

            response_message = response.choices[0].message
            messages.append(response_message)

            if not response_message.tool_calls:
                # No more tools to call, we have a final text response
                final_text = response_message.content or ""
                break

            # Handle tool calls
            for tool_call in response_message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)

                tool_result = await self._execute_tool(fn_name, fn_args, tenant_id, contact_id, conversation_id)
                tool_data = json.loads(tool_result)

                # Capture pipeline update intent (executed async by orchestrator)
                if fn_name == "update_pipeline_stage" and "action" in tool_data:
                    pipeline_update_request = {
                        "contact_id": tool_data["contact_id"],
                        "stage_id": tool_data["stage_id"],
                    }
                    tool_result = json.dumps({"success": True})

                # Capture handoff intent
                if fn_name == "transfer_to_human" and "action" in tool_data:
                    handoff_request = {"reason": fn_args.get("reason", "No reason provided")}
                    tool_result = json.dumps({"success": True, "status": "transfer_initiated"})

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": fn_name,
                    "content": tool_result,
                })
            # Continue the loop for the next assistant response
        else:
            logger.warning("Tool call limit reached", extra={"contact_id": contact_id})
            final_text = "Disculpa, estoy procesando mucha información. ¿Podrías ser más específico?"

        # Fallback for empty content (shouldn't happen with Gpt-4o but good for safety)
        if not final_text.strip() and not pipeline_update_request:
             final_text = "Entendido. ¿En qué más puedo ayudarte?"

        # 4. Final Formatting (WhatsApp Optimization)
        final_text = self._format_output_for_whatsapp(final_text)

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
                "mode": mode
            },
        )

        return final_text, pipeline_update_request, handoff_request, usage

    # ── Output Formatting ───────────────────────────────────────────────

    def _format_output_for_whatsapp(self, text: str) -> str:
        """
        Cleans the AI output to be more human-like and compatible with WhatsApp.
        Inspired by n8n 'Verificador de Respuesta' logic.
        """
        if not text:
            return text

        # 1. Remove Markdown headers and bold markers
        # WhatsApp supports *bold*, but OpenAI often uses it excessively for labels.
        # We'll remove '#' and keep '*' only if the user specifically wants it, 
        # but for now, following n8n logic of total cleanup:
        text = text.replace("#", "")
        text = text.replace("*", "")

        # 2. Punctuation cleanup (Simplified chat style)
        text = text.replace("¿", "")
        text = text.replace("¡", "")

        # 3. Remove internal thinking artifacts or meta-commentary
        # (Though prompts should handle this, this is a safety net)
        text = text.replace("Utilizando la herramienta", "")
        text = text.replace("He consultado", "Ya revisé")

        # 4. Cleanup white spaces and multiple newlines
        lines = [line.strip() for line in text.split("\n")]
        text = "\n".join(filter(None, lines))

        return text.strip()

    def split_text_for_whatsapp(self, text: str, max_chars: int = 450) -> List[str]:
        """
        Splits a long message into multiple fragments, trying to respect newlines.
        """
        if not text or len(text) <= max_chars:
            return [text] if text else []

        fragments = []
        current_fragment = []
        current_length = 0

        # Split by lines to preserve structure
        lines = text.split("\n")
        
        for line in lines:
            if current_length + len(line) > max_chars and current_fragment:
                fragments.append("\n".join(current_fragment))
                current_fragment = []
                current_length = 0
            
            current_fragment.append(line)
            current_length += len(line) + 1 # +1 for the newline

        if current_fragment:
            fragments.append("\n".join(current_fragment))

        return fragments

    # ── Tool Implementations ──────────────────────────────────────────────

    def _transfer_to_human(self, reason: str) -> str:
        """Called when the AI wants to hand over to a human advisor."""
        logger.info("Human handoff request received from AI", extra={"reason": reason})
        return json.dumps({"action": "handoff", "status": "pending", "reason": reason})

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
            url = f"{config.java_api_url}/productos/stock/multiple?ids={ids_str}&tenantId={tenant_id}&ai_secret={config.ai_api_secret}"
            headers = {"X-AI-Secret": config.ai_api_secret, "Authorization": f"AI-Secret {config.ai_api_secret}"}
            res = requests.get(url, headers=headers, timeout=5)
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

    async def _get_contact(self, identifier: str, tenant_id: int) -> str:
        contact = await self._db.get_contact(identifier, tenant_id)
        if not contact:
            return json.dumps({"error": "Contact not found"})
        # Stringify dates for JSON
        for k, v in contact.items():
            if hasattr(v, "isoformat"):
                contact[k] = v.isoformat()
        return json.dumps(contact)

    async def _manage_contact(self, args: Dict[str, Any], tenant_id: int) -> str:
        action = args.pop("action")
        
        # Ensure company_id is present if not provided (Default to principal company)
        if "company_id" not in args:
            comp = await self._db.get_company_info(tenant_id)
            if comp.get("id"):
                args["company_id"] = comp["id"]
                
        if action == "create":
            # Check for duplicate email before creation
            if args.get("email"):
                existing = await self._db.get_contact(args.get("email"), tenant_id)
                if existing:
                    logger.info(f"Email {args.get('email')} already exists for contact {existing.get('id')}. Returning info instead of creating new.", extra={"tenant_id": tenant_id})
                    return json.dumps({
                        "success": True,
                        "info": "CONTACT_ALREADY_EXISTS",
                        "id": existing.get("id"),
                        "name": existing.get("name"),
                        "email": existing.get("email"),
                        "message": "Este correo ya está registrado. He vinculado la información."
                    })
            new_id = await self._db.create_contact(tenant_id, args)
            return json.dumps({"success": True, "id": new_id, "message": "Contact created"})
        elif action == "update":
            cid = args.pop("contact_id", None)
            if not cid:
                return json.dumps({"error": "contact_id required for update"})
            
            # Check for duplicate email before update
            if args.get("email"):
                existing = await self._db.get_contact(args.get("email"), tenant_id)
                if existing and existing.get("id") != cid:
                    logger.info(f"Email {args.get('email')} already exists for contact {existing.get('id')}. Returning info.", extra={"tenant_id": tenant_id})
                    return json.dumps({
                        "success": True,
                        "info": "CONTACT_ALREADY_EXISTS",
                        "contact_id": existing.get("id"),
                        "name": existing.get("name"),
                        "email": existing.get("email")
                    })
                    
            success = await self._db.update_contact(cid, tenant_id, args)
            return json.dumps({"success": success})
        return json.dumps({"error": "Invalid action"})

    async def _get_contact_pipeline(self, contact_id: int, tenant_id: int) -> str:
        state = await self._db.get_contact_pipeline_state(contact_id, tenant_id)
        if not state:
            return json.dumps({"error": "No pipeline assigned or contact not found"})
        return json.dumps({
            "contact_name": state.contact_name,
            "contact_email": state.contact_email,
            "pipeline_id": state.pipeline_id,
            "pipeline_name": state.pipeline_name,
            "current_stage_id": state.current_stage_id,
            "stages": [
                {"id": s.id, "name": s.name, "position": s.position, "color": s.color}
                for s in state.stages
            ]
        })

    async def _create_order(self, customer_id: int, items: List[Dict], tenant_id: int, notes: str = None, message_id: str = "unknown") -> str:
        # 0. Pre-validation: Check for missing name or email in contact
        contact = await self._db.get_contact_by_id(customer_id, tenant_id)
        if not contact or not contact.get("name") or not contact.get("email"):
            return json.dumps({
                "error": "INCOMPLETE_CONTACT_INFO",
                "message": "Falta el nombre o el correo electrónico del contacto. Por favor, solicítalos antes de crear el pedido."
            })

        # Idempotency: generate a hash of the critical order data + message_id
        import hashlib
        raw = f"{customer_id}:{json.dumps(items, sort_keys=True)}:{message_id}"
        idempotency_key = hashlib.sha256(raw.encode()).hexdigest()[:16]

        log_ctx = {
            "customer_id": customer_id,
            "tenant_id": tenant_id,
            "idempotency_key": idempotency_key,
            "message_id": message_id
        }
        logger.info(f"Creating order for customer {customer_id}", extra=log_ctx)
        try:
            # 1. Fetch contact to get company_id (important for multitenancy/multicompany)
            contact = await self._db.get_contact_by_id(customer_id, tenant_id)
            company_id = contact.get("company_id") if contact else None
            
            # Fallback to default company for the tenant if contact doesn't have one
            if not company_id:
                comp = await self._db.get_company_info(tenant_id)
                company_id = comp.get("id")

            order_items = []
            total_sum = 0
            for item in items:
                qty = item.get("quantity", 0)
                price = item.get("unitPrice", 0)
                subtotal = qty * price
                total_sum += subtotal
                order_items.append({
                    "productId": item.get("productId"),
                    "productName": item.get("productName"),
                    "quantity": qty,
                    "unitPrice": price,
                    "discount": 0,
                    "subtotal": subtotal
                })

            payload = {
                "customerId": customer_id,
                "companyId": company_id,
                "status": "PROCESANDO",
                "notes": notes,
                "items": order_items,
                "total": total_sum,
                "externalReference": idempotency_key # Used for idempotency in the backend
            }

            url = f"{config.java_api_url}/orders?tenantId={tenant_id}&ai_secret={config.ai_api_secret}"
            headers = {"X-AI-Secret": config.ai_api_secret, "Authorization": f"AI-Secret {config.ai_api_secret}"}
            logger.info(f"🚀 [AI-API-TOOL] Calling POST {url} for company {company_id}", extra=log_ctx)
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            logger.info(f"📥 [AI-API-TOOL] Response {res.status_code}: {res.text}", extra=log_ctx)
            if res.status_code in [200, 201]:
                return json.dumps(res.json())
            return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
        except Exception as exc:
            logger.error("Order creation failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

    async def _get_order(self, order_id: int, tenant_id: int) -> str:
        try:
            url = f"{config.java_api_url}/orders/{order_id}?tenantId={tenant_id}&ai_secret={config.ai_api_secret}"
            headers = {"X-AI-Secret": config.ai_api_secret, "Authorization": f"AI-Secret {config.ai_api_secret}"}
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                return json.dumps(res.json())
            return json.dumps({"error": f"API {res.status_code}"})
        except Exception as exc:
            logger.error("Fetch order failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

    async def _modify_order(self, order_id: int, items: List[Dict], tenant_id: int, notes: str = None) -> str:
        try:
            order_items = []
            for item in items:
                qty = item.get("quantity", 0)
                price = item.get("unitPrice", 0)
                order_items.append({
                    "productId": item.get("productId"),
                    "productName": item.get("productName"),
                    "quantity": qty,
                    "unitPrice": price,
                    "discount": 0,
                    "subtotal": qty * price
                })

            payload = {"notes": notes, "items": order_items}
            url = f"{config.java_api_url}/orders/{order_id}?tenantId={tenant_id}&ai_secret={config.ai_api_secret}"
            headers = {"X-AI-Secret": config.ai_api_secret, "Authorization": f"AI-Secret {config.ai_api_secret}"}
            res = requests.put(url, json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                return json.dumps(res.json())
            return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
        except Exception as exc:
            logger.error("Modify order failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

    async def _create_quote(self, customer_id: int, items: List[Dict], tenant_id: int, notes: str = None, message_id: str = "unknown") -> str:
        try:
            # Fetch contact to get company_id
            contact = await self._db.get_contact_by_id(customer_id, tenant_id)
            company_id = contact.get("company_id") if contact else None

            quote_items = []
            total_sum = 0
            for item in items:
                qty = item.get("quantity", 0)
                price = item.get("unitPrice", 0)
                subtotal = qty * price
                total_sum += subtotal
                quote_items.append({
                    "productId": item.get("productId"),
                    "productName": item.get("productName"),
                    "quantity": qty,
                    "unitPrice": price,
                    "subtotal": subtotal
                })

            payload = {
                "customerId": customer_id,
                "companyId": company_id,
                "notes": notes,
                "items": quote_items,
                "total": total_sum,
                "status": "PENDING"
            }

            url = f"{config.java_api_url}/quotes?tenantId={tenant_id}&ai_secret={config.ai_api_secret}"
            headers = {"X-AI-Secret": config.ai_api_secret, "Authorization": f"AI-Secret {config.ai_api_secret}"}
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                return json.dumps(res.json())
            return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
        except Exception as exc:
            logger.error("Quote creation failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

    async def _convert_quote_to_order(self, quote_id: int, tenant_id: int) -> str:
        try:
            url = f"{config.java_api_url}/quotes/{quote_id}/convert-to-order?tenantId={tenant_id}&ai_secret={config.ai_api_secret}"
            headers = {"X-AI-Secret": config.ai_api_secret, "Authorization": f"AI-Secret {config.ai_api_secret}"}
            res = requests.post(url, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                return json.dumps(res.json())
            return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
        except Exception as exc:
            logger.error("Quote conversion failed", extra={"error": str(exc)})
            return json.dumps({"error": str(exc)})

    async def _manage_calendar_event(self, args: Dict[str, Any], tenant_id: int, contact_id: int) -> str:
        action = args.pop("action")
        
        # 1. Fetch contact to check for name and email
        contact = await self._db.get_contact_by_id(contact_id, tenant_id)
        if not contact:
            return json.dumps({"error": "Contact not found"})
        
        name = contact.get("name")
        email = args.get("email") or contact.get("email")
        
        if not name or not email:
            return json.dumps({
                "error": "INCOMPLETE_CONTACT_INFO", 
                "message": "Necesito el nombre completo y el correo electrónico del cliente para agendar la cita. ¿Podrías pedírselos?"
            })
        
        # 2. Update contact if a new email was provided
        if args.get("email") and args.get("email") != contact.get("email"):
            # Idempotency check: does this email already belong to someone else?
            existing_contact = await self._db.get_contact(args.get("email"), tenant_id)
            if existing_contact and existing_contact.get("id") != contact_id:
                logger.info(f"Using existing contact email {args.get('email')} for event without updating current contact.", extra={"tenant_id": tenant_id})
                email = args.get("email")
            else:
                await self._db.update_contact(contact_id, tenant_id, {"email": args.get("email")})
                email = args.get("email")
        else:
            email = email or contact.get("email")
        
        # 3. Get or create "Calendario IA"
        company_id = contact.get("company_id")
        if not company_id:
            comp = await self._db.get_company_info(tenant_id)
            company_id = comp.get("id")
        
        calendar_id = await self._db.get_or_create_ai_calendar(tenant_id, company_id)
        
        # 4. Prepare event data
        start_time_str = args["start_time"]
        try:
            # ISO 8601 parsing
            clean_time = start_time_str.replace("Z", "").split(".")[0]
            start_dt = datetime.fromisoformat(clean_time)
            end_dt = start_dt + timedelta(minutes=30)
            end_time_str = end_dt.isoformat()
        except Exception as e:
            return json.dumps({"error": f"Invalid date format: {str(e)}"})
            
        event_data = {
            "calendar_id": calendar_id,
            "title": args["title"],
            "description": args.get("description", ""),
            "start_time": start_time_str,
            "end_time": end_time_str,
            "event_type": "NOTIFICATION",
            "event_subtype": "whatsapp",
            "status": "SCHEDULED",
            "related_entity_type": "CONTACT",
            "related_entity_id": contact_id,
            "payload": json.dumps({
                "remindBefore": 5,
                "remindUnit": "MINUTES",
                "notifyVia": "email",
                "to": email,
                "subject": f"Confirmación de Cita: {args['title']}",
                "body": f"Hola {contact.get('name', 'cliente')}, tu cita para '{args['title']}' ha sido agendada para el {start_dt.strftime('%d/%m/%Y a las %H:%M')}.",
                "sendConfirmation": True
            })
        }
        
        if action == "create":
            try:
                url = f"{config.scheduler_api_url}/api/events"
                # EventDto expected by Java
                payload = {
                    "tenantId": tenant_id,
                    "companyId": company_id,
                    "calendarId": calendar_id,
                    "title": args["title"],
                    "description": args.get("description", ""),
                    "eventType": "NOTIFICATION",
                    "eventSubtype": "whatsapp",
                    "startTime": args["start_time"],
                    "endTime": end_time_str,
                    "relatedEntityType": "CONTACT",
                    "relatedEntityId": contact_id,
                    "payload": json.dumps({
                        "remindBefore": 5,
                        "remindUnit": "MINUTES",
                        "notifyVia": "email",
                        "to": email,
                        "subject": f"Confirmación de Cita: {args['title']}",
                        "body": f"Hola {contact.get('name', 'cliente')}, tu cita para '{args['title']}' ha sido agendada para el {start_dt.strftime('%d/%m/%Y a las %H:%M')}.",
                        "sendConfirmation": True
                    })
                }
                logger.info(f"🚀 Calling scheduler-service API: {url}")
                res = requests.post(url, json=payload, timeout=10)
                if res.status_code in [200, 201]:
                    return json.dumps({"success": True, "data": res.json(), "message": "Cita agendada correctamente y confirmación enviada."})
                return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
            except Exception as e:
                logger.error(f"Failed to call scheduler API: {e}")
                return json.dumps({"error": str(e)})

        elif action == "update":
            eid = args.get("event_id")
            if not eid:
                return json.dumps({"error": "event_id is required for update"})
            try:
                url = f"{config.scheduler_api_url}/api/events/{eid}"
                update_payload = {
                    "title": args["title"],
                    "description": args.get("description", ""),
                    "startTime": args["start_time"],
                    "endTime": end_time_str,
                    "payload": json.dumps({
                        "remindBefore": 5,
                        "remindUnit": "MINUTES",
                        "notifyVia": "email",
                        "to": email,
                        "subject": f"Reprogramación de Cita: {args['title']}",
                        "body": f"Hola {contact.get('name', 'cliente')}, tu cita para '{args['title']}' ha sido REPROGRAMADA para el {start_dt.strftime('%d/%m/%Y a las %H:%M')}.",
                        "sendConfirmation": True
                    })
                }
                res = requests.put(url, json=update_payload, timeout=10)
                if res.status_code == 200:
                    return json.dumps({"success": True, "message": "Cita reprogramada correctamente y notificación enviada."})
                return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
            except Exception as e:
                return json.dumps({"error": str(e)})
            
        return json.dumps({"error": "Invalid action"})

    async def _search_calendar_events(self, args: Dict[str, Any], tenant_id: int, contact_id: int) -> str:
        contact = await self._db.get_contact_by_id(contact_id, tenant_id)
        company_id = contact.get("company_id") if contact else None
        if not company_id:
            comp = await self._db.get_company_info(tenant_id)
            company_id = comp.get("id")
            
        cid = contact_id if args.get("filter_by_contact") else None
        events = await self._db.get_calendar_events(tenant_id, company_id, args["start_time"], args["end_time"], cid)
        for ev in events:
            for k, v in ev.items():
                if hasattr(v, "isoformat"):
                    ev[k] = v.isoformat()
        return json.dumps(events)

    async def _delete_calendar_event(self, args: Dict[str, Any], tenant_id: int) -> str:
        eid = args.get("event_id")
        try:
            url = f"{config.scheduler_api_url}/api/events/{eid}"
            res = requests.delete(url, timeout=10)
            if res.status_code in [200, 204]:
                return json.dumps({"success": True})
            return json.dumps({"error": f"API {res.status_code}", "detail": res.text})
        except Exception as e:
            return json.dumps({"error": str(e)})
