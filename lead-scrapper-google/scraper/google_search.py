import logging
from urllib.parse import unquote, urlparse

from playwright.sync_api import Page

from scraper.browser import dismiss_cookie_banner, goto, page_html
from scraper.config import (
    GOOGLE_TIMEOUT_MS,
    SKIP_EXTENSIONS,
    SKIP_HOST_EXACT,
    SKIP_NETLOC_FRAGMENTS,
)
from scraper.directory import is_directory

logger = logging.getLogger("lead_scraper.google")


def debe_saltar(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host in SKIP_HOST_EXACT:
        return True
    if any(d in host for d in SKIP_NETLOC_FRAGMENTS):
        return True
    path = parsed.path.lower()
    if any(path.endswith(ext) for ext in SKIP_EXTENSIONS):
        return True
    # Datasets / APIs abiertas
    if any(seg in path for seg in ("/dataset", "/datasets", "/api/", "/resource/")):
        return True
    return False


def prioritize_links(links: list[str]) -> list[str]:
    """Directorios primero para extraer muchos leads sin visitar cada web."""
    directories = [u for u in links if is_directory(u)]
    rest = [u for u in links if u not in directories]
    if directories:
        logger.info("Prioritized %s directory URLs before %s other links", len(directories), len(rest))
    return directories + rest


def collect_google_links(page: Page, query: str, pages: int, verbose: bool) -> list[str]:
    links: list[str] = []
    seen: set[str] = set()

    for page_num in range(pages):
        start = page_num * 10
        search_url = (
            f"https://www.google.com/search?q={query.replace(' ', '+')}&start={start}&hl=es"
        )
        if verbose:
            print(f"\n🔍  Google página {page_num + 1}: {search_url}")

        if not goto(page, search_url, GOOGLE_TIMEOUT_MS):
            break

        dismiss_cookie_banner(page)
        html = page_html(page)

        for href in _extract_hrefs_from_html(html):
            if href.startswith("/url?q="):
                href = unquote(href.split("/url?q=")[1].split("&")[0])
            if not href.startswith("http"):
                continue
            if debe_saltar(href):
                logger.debug("Skip google result url='%s'", href)
                continue
            key = href.rstrip("/").lower()
            if key not in seen:
                seen.add(key)
                links.append(href)

    return prioritize_links(links)


def _extract_hrefs_from_html(html: str) -> list[str]:
    import re

    return re.findall(r'href=["\']([^"\']+)["\']', html, re.I)
