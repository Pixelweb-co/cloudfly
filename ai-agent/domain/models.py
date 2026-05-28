"""
domain/models.py

Pure data classes representing the core domain entities.
No business logic, no I/O — only structured data.
"""
from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class MessagePayload:
    """Kafka inbound message from chat-socket-service."""
    tenant_id: int
    company_id: Optional[int]
    contact_id: int
    conversation_id: str
    message_text: str
    message_id: str          # UUID for idempotency
    timestamp: str
    media_type: str = "text"
    media_url: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> "MessagePayload":
        """
        Build a MessagePayload from a raw Kafka JSON payload.
        Raises KeyError if required fields are missing.
        """
        return cls(
            tenant_id=int(data["tenantId"]),
            company_id=int(data["companyId"]) if data.get("companyId") is not None else None,
            contact_id=int(data["contactId"]),
            conversation_id=str(data["conversationId"]),
            message_text=str(data["mensaje"]),
            # Prefer explicit messageId; fall back to timestamp for legacy compat
            message_id=str(data.get("messageId") or data.get("timestamp", "")),
            timestamp=str(data.get("timestamp", "")),
            media_type=str(data.get("mediaType", "text")),
            media_url=str(data.get("mediaUrl")) if data.get("mediaUrl") else None,
        )


@dataclass
class ChatMessage:
    """A single turn in a conversation (user or assistant)."""
    role: str    # "user" | "assistant"
    content: str


@dataclass
class PipelineStage:
    """One stage inside a sales pipeline."""
    id: int
    name: str
    position: int
    color: Optional[str] = None


@dataclass
class ContactPipelineState:
    """The current pipeline context for a contact."""
    pipeline_id: int
    pipeline_name: str
    current_stage_id: Optional[int]
    current_stage_name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    stages: List[PipelineStage] = field(default_factory=list)

    def stages_prompt(self) -> str:
        """Return a human-readable list of stages for LLM injection."""
        return "\n".join(f"- {s.name} (ID: {s.id})" for s in self.stages)


@dataclass
class CampaignContext:
    """
    Active marketing campaign context for a contact who received a campaign message
    and is now replying. Used only to enrich the LLM prompt; does not change routing.
    """
    campaign_id: int
    campaign_name: str
    campaign_message: str
    campaign_status: str
    sent_at: Optional[str] = None
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    product_description: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

    @classmethod
    def from_row(cls, row: dict) -> "CampaignContext":
        return cls(
            campaign_id=int(row["campaign_id"]),
            campaign_name=str(row.get("campaign_name") or ""),
            campaign_message=str(row.get("campaign_message") or ""),
            campaign_status=str(row.get("campaign_status") or ""),
            sent_at=str(row["sent_at"]) if row.get("sent_at") else None,
            product_id=int(row["product_id"]) if row.get("product_id") else None,
            product_name=row.get("product_name"),
            product_description=row.get("product_description"),
            media_url=row.get("media_url"),
            media_type=row.get("media_type"),
        )

    def to_prompt_block(self) -> str:
        lines = [
            "[CONTEXTO DE CAMPAÑA DE MARKETING]",
            f"Campaña: {self.campaign_name} (ID {self.campaign_id}, estado {self.campaign_status})",
        ]
        if self.sent_at:
            lines.append(f"Mensaje de campaña enviado al contacto: {self.sent_at}")
        if self.campaign_message:
            lines.append(f"Texto enviado en la campaña:\n{self.campaign_message}")
        if self.product_name:
            product_line = f"Producto promocionado: {self.product_name}"
            if self.product_id:
                product_line += f" (ID {self.product_id})"
            lines.append(product_line)
        if self.product_description:
            lines.append(f"Descripción: {self.product_description}")
        lines.extend([
            "",
            "INSTRUCCIONES DE SEGUIMIENTO:",
            "- El cliente está respondiendo después de recibir esta campaña; continúa ese hilo comercial.",
            "- No repitas el mensaje masivo literalmente; responde a lo que el cliente acaba de escribir.",
            "- Usa search_products_semantically si necesitas detalle del producto de la campaña.",
            "- Mantén el mismo tono comercial y objetivo de conversión de la campaña.",
        ])
        return "\n".join(lines)


@dataclass
class TokenUsage:
    """Tracks OpenAI token consumption per call."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
