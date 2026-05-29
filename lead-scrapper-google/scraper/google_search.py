from urllib.parse import unquote, urlparse

from playwright.sync_api import Page

from scraper.browser import dismiss_cookie_banner, goto, page_html
from scraper.config import GOOGLE_TIMEOUT_MS, SKIP_EXTENSIONS, SKIP_NETLOC_FRAGMENTS


def debe_saltar(url: str) -> bool:
    parsed = urlparse(url)
    if any(d in parsed.netloc for d in SKIP_NETLOC_FRAGMENTS):
        return True
    path = parsed.path.lower()
    return any(path.endswith(ext) for ext in SKIP_EXTENSIONS)


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
            if not href.startswith("http") or debe_saltar(href):
                continue
            key = href.rstrip("/").lower()
            if key not in seen:
                seen.add(key)
                links.append(href)

    return links


def _extract_hrefs_from_html(html: str) -> list[str]:
    import re

    return re.findall(r'href=["\']([^"\']+)["\']', html, re.I)
