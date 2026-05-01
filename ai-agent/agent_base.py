import json
import logging
import asyncio
from abc import ABC, abstractmethod
from types import SimpleNamespace
from token_tracker import TokenTracker
from tool_registry import ToolRegistry

logger = logging.getLogger(__name__)

class AgentBase(ABC):
    def __init__(self, tenant_id, contact_id, cfg, ai_service, openai_client):
        self.tenant_id = tenant_id
        self.contact_id = contact_id
        self.cfg = cfg
        self.ai_service = ai_service
        self.client = openai_client
        self.tracker = TokenTracker()
        self.tool_registry = ToolRegistry(ai_service, tenant_id)

    @abstractmethod
    def build_system_prompt(self, company_info: str, pipeline_context: str) -> str:
        """Construye el prompt de sistema específico para el agente."""
        pass

    def get_enabled_tools(self) -> list:
        """Obtiene las definiciones de herramientas habilitadas para este chatbot."""
        return self.tool_registry.get_definitions(self.cfg.get("enabled_tools", []))

    async def _build_pipeline_context(self) -> str:
        """Obtiene y formatea el contexto del pipeline."""
        try:
            pipeline_json = await self.ai_service.get_contact_pipeline(self.contact_id, self.tenant_id)
            data = json.loads(pipeline_json)
            if "error" in data: return ""
            
            stages = data.get("stages", [])
            curr_id = data.get("current_stage_id")
            curr_name = next((s["name"] for s in stages if s["id"] == curr_id), "N/A")
            
            stages_str = "|".join([f"{s['name']}:{s['id']}" for s in stages])
            return f"[PIPELINE] Actual: {curr_name} (ID:{curr_id}) | Disponibles: {stages_str}"
        except Exception as e:
            logger.warning(f"Error building pipeline context: {e}")
            return ""

    async def generate_response(self, message, history, conversation_id) -> str:
        """Loop agentico para generar respuesta con llamadas a herramientas."""
        # a) Trim history
        max_h = self.cfg.get("max_history", 10)
        history = history[-max_h:] if len(history) > max_h else history
        
        # b) Prep context
        company_info = self.ai_service.get_company_context(self.tenant_id)
        pipeline_context = await self._build_pipeline_context()
        
        # c) Build messages
        system_prompt = self.build_system_prompt(company_info, pipeline_context)
        messages = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})
        
        tools = self.get_enabled_tools()
        total_usage = SimpleNamespace(prompt_tokens=0, completion_tokens=0, total_tokens=0)
        max_loops = self.cfg.get("max_tool_loops", 5)
        
        iterations = 0
        try:
            while iterations < max_loops:
                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=self.cfg.get("model", "gpt-4o-mini"),
                    messages=messages,
                    tools=tools if tools else None,
                    temperature=self.cfg.get("temperature", 0.7),
                    timeout=30
                )
                
                # Tracking
                label = "PRIMERA_LLAMADA" if iterations == 0 else f"LLAMADA_{iterations+1}"
                self.tracker.track(response.usage, label, self.tenant_id, conversation_id)
                
                total_usage.prompt_tokens += response.usage.prompt_tokens
                total_usage.completion_tokens += response.usage.completion_tokens
                total_usage.total_tokens += response.usage.total_tokens
                
                response_message = response.choices[0].message
                tool_calls = response_message.tool_calls
                
                if not tool_calls:
                    if iterations == 0:
                        self.tracker.track(response.usage, "LLAMADA_DIRECTA", self.tenant_id, conversation_id)
                    else:
                        self.tracker.track(total_usage, "TOTAL_TURNO", self.tenant_id, conversation_id)
                    return response_message.content
                
                messages.append(response_message)
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    logger.info(f"🛠️ [AGENT-BASE] Dispatching tool: {function_name}")
                    function_response = await self.tool_registry.dispatch(function_name, function_args)
                    
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    })
                
                iterations += 1
                logger.info(f"🔄 [AGENT-BASE] Iteration {iterations} completed")
                
            logger.warning(f"⚠️ [AGENT-BASE] Max tool loops ({max_loops}) reached for tenant {self.tenant_id}")
            self.tracker.track(total_usage, "TOTAL_TURNO", self.tenant_id, conversation_id)
            return response.choices[0].message.content if 'response' in locals() else "Lo siento, la solicitud es demasiado compleja."
            
        except Exception as e:
            logger.error(f"Error in AgentBase generate_response: {e}")
            return "Lo siento, estoy experimentando dificultades técnicas."
