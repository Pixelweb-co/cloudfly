from scraper.models import Lead
from scraper.regex_utils import phone_digits


class LeadDedup:
    def __init__(self) -> None:
        self.seen_urls: set[str] = set()
        self.seen_phones: set[str] = set()
        self.seen_emails: set[str] = set()

    def url_seen(self, url: str) -> bool:
        key = (url or "").rstrip("/").lower()
        if not key or key in self.seen_urls:
            return True
        self.seen_urls.add(key)
        return False

    def accept_lead(self, lead: Lead) -> bool:
        if lead.sitio_web:
            key = lead.sitio_web.rstrip("/").lower()
            if key in self.seen_urls and not (lead.telefono or lead.email or lead.whatsapp):
                return False
            self.seen_urls.add(key)

        for phone in (lead.telefono, lead.whatsapp):
            digits = phone_digits(phone)
            if digits:
                if digits in self.seen_phones:
                    return False
                self.seen_phones.add(digits)

        if lead.email:
            em = lead.email.lower()
            if em in self.seen_emails:
                return False
            self.seen_emails.add(em)

        return bool(lead.telefono or lead.whatsapp or lead.email)
