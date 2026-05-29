from urllib.parse import urlparse

from playwright.sync_api import Page

from scraper.browser import goto, page_html, page_text
from scraper.config import CONTACT_PAGE_TIMEOUT_MS, NAV_TIMEOUT_MS
from scraper.models import Lead
from scraper.regex_utils import (
    extract_emails,
    extract_phones,
    extract_whatsapp,
)


def scrape_single_business(
    page: Page,
    url: str,
    phone_patterns: list,
    country_code: str,
    ciudad: str = "",
) -> Lead:
    lead = Lead(sitio_web=url, fuente=url, ciudad=ciudad)

    if not goto(page, url, NAV_TIMEOUT_MS):
        return lead

    try:
        lead.titulo = (page.title() or "")[:100]
    except Exception:
        pass

    try:
        h1 = page.locator("h1").first.inner_text(timeout=1200).strip()
        lead.nombre = (h1 or lead.titulo)[:80]
    except Exception:
        lead.nombre = lead.titulo[:80]

    text = page_text(page)
    html = page_html(page)
    full = f"{text}\n{html}"

    phones = extract_phones(full, phone_patterns, country_code)
    if phones:
        lead.telefono = " / ".join(phones[:3])
    lead.whatsapp = extract_whatsapp(html, phones, country_code)
    emails = extract_emails(full)
    if emails:
        lead.email = emails[0]

    if not lead.telefono and not lead.email and not lead.whatsapp:
        _try_contact_paths(page, lead, phone_patterns, country_code, url)

    return lead


def _try_contact_paths(
    page: Page,
    lead: Lead,
    phone_patterns: list,
    country_code: str,
    base_url: str,
) -> None:
    parsed = urlparse(base_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    for path in ("/contacto", "/contact"):
        contact_url = base + path
        if not goto(page, contact_url, CONTACT_PAGE_TIMEOUT_MS):
            continue
        combo = page_text(page) + "\n" + page_html(page)
        phones = extract_phones(combo, phone_patterns, country_code)
        if phones and not lead.telefono:
            lead.telefono = phones[0]
        if not lead.whatsapp:
            lead.whatsapp = extract_whatsapp(combo, phones, country_code)
        emails = extract_emails(combo)
        if emails and not lead.email:
            lead.email = emails[0]
        if lead.telefono or lead.email or lead.whatsapp:
            break
