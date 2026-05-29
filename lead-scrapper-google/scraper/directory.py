import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.sync_api import Page

from scraper.browser import goto, page_html
from scraper.config import (
    CARD_SELECTORS,
    NAV_TIMEOUT_MS,
    PAGINATION_SELECTORS,
    PAGINATION_TEXT,
)
from scraper.models import Lead
from scraper.regex_utils import (
    build_phone_patterns,
    extract_emails,
    extract_name_from_card,
    extract_phones,
    extract_website,
    extract_whatsapp,
)


def is_directory(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return any(domain in host for domain in _directory_domains())


def _directory_domains() -> tuple[str, ...]:
    from scraper.config import DIRECTORY_DOMAINS

    return tuple(DIRECTORY_DOMAINS)


def parse_directory_html(
    html: str,
    source_url: str,
    phone_patterns: list,
    country_code: str,
    ciudad: str = "",
) -> list[Lead]:
    soup = BeautifulSoup(html, "html.parser")
    cards = _collect_cards(soup)
    leads: list[Lead] = []

    for card in cards:
        text = card.get_text("\n", strip=True)
        if len(text) < 12:
            continue
        card_html = str(card)
        phones = extract_phones(text + "\n" + card_html, phone_patterns, country_code)
        emails = extract_emails(text + "\n" + card_html)
        web = extract_website(card_html, source_url)
        nombre = extract_name_from_card(text)

        if not nombre and not phones and not emails:
            continue

        lead = Lead(
            nombre=nombre,
            telefono=" / ".join(phones[:2]) if phones else "",
            whatsapp=extract_whatsapp(card_html, phones, country_code),
            email=emails[0] if emails else "",
            sitio_web=web,
            fuente=source_url,
            titulo=nombre,
            ciudad=ciudad,
        )
        leads.append(lead)

    return leads


def _collect_cards(soup: BeautifulSoup) -> list:
    seen_ids: set[int] = set()
    cards: list = []
    for sel in CARD_SELECTORS:
        for el in soup.select(sel):
            eid = id(el)
            if eid in seen_ids:
                continue
            seen_ids.add(eid)
            cards.append(el)
    if not cards:
        # Fallback: bloques con teléfono o email embebido
        for el in soup.find_all(["div", "li", "section"], limit=400):
            chunk = el.get_text(" ", strip=True)
            if 20 < len(chunk) < 2500 and (
                "@" in chunk or "tel:" in str(el).lower() or "wa.me" in str(el).lower()
            ):
                eid = id(el)
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    cards.append(el)
    return cards


def find_next_page_url(soup: BeautifulSoup, current_url: str) -> str | None:
    for sel in PAGINATION_SELECTORS:
        tag = soup.select_one(sel)
        if tag and tag.get("href"):
            return urljoin(current_url, tag["href"])

    for a in soup.find_all("a", href=True):
        label = (a.get_text() or "").strip()
        if PAGINATION_TEXT.match(label):
            href = a["href"]
            if href and not href.startswith("#"):
                return urljoin(current_url, href)

    parsed = urlparse(current_url)
    if "page=" in parsed.query:
        m = re.search(r"page=(\d+)", parsed.query)
        if m:
            n = int(m.group(1)) + 1
            q = re.sub(r"page=\d+", f"page={n}", parsed.query)
            return parsed._replace(query=q).geturl()
    return None


def scrape_directory_pages(
    page: Page,
    start_url: str,
    phone_patterns: list,
    country_code: str,
    ciudad: str = "",
    max_pages: int = 5,
    verbose: bool = False,
) -> list[Lead]:
    all_leads: list[Lead] = []
    url = start_url
    visited_pages: set[str] = set()

    for _ in range(max_pages):
        if not url or url in visited_pages:
            break
        visited_pages.add(url)

        if not goto(page, url, NAV_TIMEOUT_MS):
            break

        html = page_html(page)
        batch = parse_directory_html(html, url, phone_patterns, country_code, ciudad)
        all_leads.extend(batch)

        if verbose:
            print(f"  📂 Directorio {url[:60]}… → {len(batch)} negocios")

        soup = BeautifulSoup(html, "html.parser")
        next_url = find_next_page_url(soup, url)
        if not next_url or next_url == url:
            break
        url = next_url

    return all_leads
