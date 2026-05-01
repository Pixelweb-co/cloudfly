import logging
from chatbot_config_loader import ChatbotConfigLoader
from agents.sales_agent import SalesAgent
from agents.support_agent import SupportAgent

logger = logging.getLogger(__name__)

class AgentFactory:
    AGENT_REGISTRY = {
        "sales": SalesAgent,
        "support": SupportAgent,
        "booking": SalesAgent,      # Defaulting to Sales for now as per instructions
        "restaurant": SalesAgent,   # Defaulting to Sales for now as per instructions
        "custom": SalesAgent        # Defaulting to Sales for now as per instructions
    }

    @staticmethod
    def create(tenant_id: int, contact_id: int, ai_service, openai_client):
        """Carga la configuración y retorna una instancia del agente correspondiente."""
        try:
            cfg = ChatbotConfigLoader.get(tenant_id)
            agent_type = cfg.get("agent_type", "sales")
            
            agent_class = AgentFactory.AGENT_REGISTRY.get(agent_type, SalesAgent)
            logger.info(f"Creating agent of type '{agent_type}' for tenant {tenant_id}")
            
            return agent_class(tenant_id, contact_id, cfg, ai_service, openai_client)
        except Exception as e:
            logger.error(f"Error in AgentFactory.create: {e}")
            # Fallback to default SalesAgent
            return SalesAgent(tenant_id, contact_id, ChatbotConfigLoader._default_config(tenant_id), ai_service, openai_client)
