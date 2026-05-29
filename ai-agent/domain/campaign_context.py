"""
domain/campaign_context.py

Detect outbound campaign echoes (skip AI) vs genuine contact replies.

Formatted outbound = campaigns.message (al inicio) + detalle de producto + enlace.
El mensaje entrante (eco fromMe) debe comenzar con el texto base de la campaña.
"""
import re
import unicodedata
from typing import Any, Dict, Optional

# Zero-width chars appended by MessageFormatterService (marketing-worker)
_INVISIBLE = frozenset("\u200b\u200c\u200d\ufeff")

_MIN_PREFIX_LEN = 15


def strip_invisible(text: str) -> str:
    if not text:
        return ""
    return "".join(c for c in text if c not in _INVISIBLE)


def normalize_message_text(text: str) -> str:
    """Collapse whitespace and lowercase for fuzzy comparison."""
    text = strip_invisible(text or "")
    text = unicodedata.normalize("NFKC", text)
    return re.sub(r"\s+", " ", text.strip().lower())


def campaign_base_prefix(base_message: str) -> str:
    """
    Texto base al inicio del envío: plantilla sin variables {{...}} al final
    (el worker las sustituye antes de añadir producto/enlace).
    """
    raw = strip_invisible(base_message or "")
    if "{{" in raw:
        raw = raw.split("{{", 1)[0]
    return normalize_message_text(raw)


def inbound_starts_with_campaign_base(inbound: str, base_message: str) -> bool:
    """
    True si el mensaje entrante comienza con el texto de campaigns.message.
    Lo que sigue puede ser detalle de producto, enlace, etc.
    """
    inbound_n = normalize_message_text(inbound)
    base_n = campaign_base_prefix(base_message)
    if not inbound_n or not base_n:
        return False
    if len(base_n) < _MIN_PREFIX_LEN:
        if inbound_n == base_n:
            return True
        return _inbound_follows_template_with_variables(inbound_n, base_message)
    if inbound_n == base_n:
        return True
    if inbound_n.startswith(base_n):
        return True
    return _inbound_follows_template_with_variables(inbound_n, base_message)


def _inbound_follows_template_with_variables(inbound_n: str, template: str) -> bool:
    """
    Plantilla con {{nombre}}: el envío sustituye variables pero conserva los
    tramos fijos en orden (inicio = primer tramo, luego producto, etc.).
    """
    static_parts = [
        normalize_message_text(p)
        for p in re.split(r"\{\{[^}]+\}\}", template)
        if normalize_message_text(p)
    ]
    if not static_parts:
        return False

    first = static_parts[0]
    if len(first) >= 8:
        if not inbound_n.startswith(first):
            return False
        pos = len(first)
    else:
        pos = 0

    for seg in static_parts[1:] if len(first) >= 8 else static_parts:
        if not seg:
            continue
        idx = inbound_n.find(seg, pos)
        if idx == -1:
            return False
        if pos == 0 and idx > 80:
            return False
        pos = idx + len(seg)

    return pos > 0


def contains_campaign_outbound_markers(text: str, contact_id: int) -> bool:
    """Marcadores del bloque añadido después del texto base (producto + enlace)."""
    raw = strip_invisible(text or "")
    if not raw:
        return False

    compact = raw.replace(" ", "").lower()
    if f"dashboard.cloudfly.com.co/contacts/{contact_id}" in compact:
        return True

    markers = (
        "chatea con nosotros",
        "💬 chatea",
    )
    lowered = raw.lower()
    return any(m in lowered for m in markers)


def is_likely_campaign_outbound_echo(
    inbound_text: str,
    campaign_message: Optional[str],
    *,
    contact_id: Optional[int] = None,
    product_name: Optional[str] = None,
    seconds_since_send: Optional[float] = None,
) -> bool:
    """
    Eco del envío masivo: el inbound empieza con campaigns.message; después puede
    venir detalle de producto y enlace. Respuestas cortas del contacto no aplican.
    """
    del contact_id, product_name, seconds_since_send

    if not inbound_text or not inbound_text.strip() or not campaign_message:
        return False

    inbound_n = normalize_message_text(inbound_text)
    if len(inbound_n) <= 35:
        return False

    return inbound_starts_with_campaign_base(inbound_text, campaign_message)


def echo_check_from_row(row: Dict[str, Any], inbound_text: str, contact_id: int) -> bool:
    """Build echo check from a MySQL row with campaign + send metadata."""
    if not row:
        return False
    seconds_since = None
    sent_at = row.get("seconds_since_send")
    if sent_at is not None:
        try:
            seconds_since = float(sent_at)
        except (TypeError, ValueError):
            seconds_since = None
    return is_likely_campaign_outbound_echo(
        inbound_text,
        row.get("campaign_message"),
        contact_id=contact_id,
        product_name=row.get("product_name"),
        seconds_since_send=seconds_since,
    )
