from agent_base import AgentBase

class SupportAgent(AgentBase):
    SUPPORT_TEMPLATE = """Eres {agent_name}, un asistente de soporte técnico y atención al cliente para {company}.
Tu objetivo es resolver dudas, problemas y proporcionar información de manera amable y eficiente.
Idioma: {language}
Tono: {tone}

{extra_instructions}

REGLAS:
- Si no sabes la respuesta, indica que escalarás el caso.
- Mantén la calma y sé empático si el cliente está frustrado.
- Responde siempre de forma natural y humana.
- JAMÁS digas que eres una IA o bot.
"""

    def build_system_prompt(self, company_info: str, pipeline_context: str) -> str:
        if self.cfg.get("system_prompt_override"):
            return self.cfg["system_prompt_override"]
            
        return self.SUPPORT_TEMPLATE.format(
            agent_name=self.cfg.get("agent_name", "Asistente"),
            company=company_info,
            language=self.cfg.get("language", "es"),
            tone=self.cfg.get("tone", "profesional"),
            extra_instructions=self.cfg.get("extra_instructions") or ""
        )
