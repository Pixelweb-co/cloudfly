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
    stages: List[PipelineStage] = field(default_factory=list)

    def stages_prompt(self) -> str:
        """Return a human-readable list of stages for LLM injection."""
        return "\n".join(f"- {s.name} (ID: {s.id})" for s in self.stages)


@dataclass
class TokenUsage:
    """Tracks OpenAI token consumption per call."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
