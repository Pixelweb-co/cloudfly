import re
from urllib.parse import urlparse

from scraper.config import BLACKLISTED_EMAIL_DOMAINS

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.I)
WEB_RE = re.compile(r"https?://[^\s\"'<>]+", re.I)
WA_ME_RE = re.compile(r"wa\.me/(\d{7,15})", re.I)
WA_API_RE = re.compile(r"api\.whatsapp\.com/send\?phone=(\d{7,15})", re.I)
TEL_HREF_RE = re.compile(r"tel:([+\d\s\-().]{7,20})", re.I)


def build_phone_patterns(country_code: str = "57") -> list[re.Pattern]:
    cc = re.escape(country_code)
    return [
        re.compile(rf"wa\.me/({cc}\d{{7,12}})", re.I),
        re.compile(rf"phone=({cc}\d{{7,12}})", re.I),
        re.compile(rf"(?:\+{cc}|00{cc})[\s\-\.]?(\d[\d\s\-\.]{{6,14}}\d)"),
        re.compile(r"\b(3[0-9]{2}[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b"),
        re.compile(r"\b(\d{3,4}[\s\-\.]\d{3,4}[\s\-\.]\d{3,4})\b"),
    ]


def normalize_phone(raw: str, country_code: str = "57") -> str:
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00" + country_code):
        digits = digits[2 + len(country_code) :]
    elif digits.startswith(country_code) and len(digits) > len(country_code) + 6:
        digits = digits[len(country_code) :]
    if len(digits) == 10:
        return f"{digits[:3]} {digits[3:6]} {digits[6:]}"
    return digits


def phone_digits(phone: str) -> str:
    return re.sub(r"\D", "", phone or "")


def clean_emails(raw: list[str]) -> list[str]:
    seen, out = set(), []
    for e in raw:
        e = e.lower().strip()
        dom = e.split("@")[-1]
        if dom in BLACKLISTED_EMAIL_DOMAINS or len(e) > 80:
            continue
        if e not in seen:
            seen.add(e)
            out.append(e)
    return out


def extract_phones(text: str, patterns: list[re.Pattern], country_code: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for pat in patterns:
        for match in pat.findall(text):
            norm = normalize_phone(match if isinstance(match, str) else match[0], country_code)
            digits = phone_digits(norm)
            if digits and digits not in seen and len(digits) >= 7:
                seen.add(digits)
                found.append(norm)
    return found


def extract_whatsapp(html: str, phones: list[str], country_code: str) -> str:
    for pat in (WA_ME_RE, WA_API_RE):
        m = pat.search(html)
        if m:
            d = m.group(1)
            return f"+{d}" if not d.startswith("+") else d
    if phones:
        first = phone_digits(phones[0])
        if len(first) == 10 and first.startswith("3"):
            return f"+{country_code}{first}"
    return ""


def extract_emails(text: str) -> list[str]:
    return clean_emails(EMAIL_RE.findall(text))


def extract_website(html: str, base_url: str) -> str:
    skip = {"facebook.com", "instagram.com", "twitter.com", "linkedin.com", "youtube.com"}
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, re.I):
        if not href.startswith("http"):
            continue
        host = urlparse(href).netloc.lower()
        if any(s in host for s in skip):
            continue
        if host and host not in urlparse(base_url).netloc.lower():
            return href.split("?")[0]
    return ""


def extract_name_from_card(card_text: str, fallback: str = "") -> str:
    lines = [ln.strip() for ln in card_text.splitlines() if ln.strip()]
    for line in lines[:5]:
        if len(line) < 3 or len(line) > 120:
            continue
        if EMAIL_RE.search(line) or re.search(r"\d{7,}", line):
            continue
        if line.lower() in {"ver más", "llamar", "whatsapp", "sitio web", "mapa"}:
            continue
        return line[:80]
    return (fallback or (lines[0][:80] if lines else ""))[:80]


def contacts_complete(lead) -> bool:
    return bool(lead.telefono or lead.whatsapp or lead.email)
