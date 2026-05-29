from contextlib import contextmanager
from typing import Generator

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, sync_playwright

from scraper.config import BLOCKED_RESOURCE_TYPES, NAV_TIMEOUT_MS


def _route_handler(route) -> None:
    if route.request.resource_type in BLOCKED_RESOURCE_TYPES:
        route.abort()
    else:
        route.continue_()


@contextmanager
def launch_browser(headless: bool = True) -> Generator[tuple[Playwright, Browser, BrowserContext], None, None]:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=headless,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            locale="es-CO",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 720},
        )
        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        )
        context.route("**/*", _route_handler)
        try:
            yield pw, browser, context
        finally:
            browser.close()


def new_page(context: BrowserContext) -> Page:
    page = context.new_page()
    page.set_default_timeout(NAV_TIMEOUT_MS)
    page.set_default_navigation_timeout(NAV_TIMEOUT_MS)
    return page


def goto(page: Page, url: str, timeout_ms: int = NAV_TIMEOUT_MS) -> bool:
    try:
        page.goto(url, wait_until="commit", timeout=timeout_ms)
        return True
    except Exception:
        return False


def dismiss_cookie_banner(page: Page) -> None:
    for sel in ('button:has-text("Aceptar todo")', 'button:has-text("Accept all")', "#L2AGLb"):
        try:
            btn = page.locator(sel).first
            if btn.is_visible(timeout=800):
                btn.click(timeout=800)
                return
        except Exception:
            pass


def page_html(page: Page) -> str:
    try:
        return page.content()
    except Exception:
        return ""


def page_text(page: Page) -> str:
    try:
        return page.inner_text("body", timeout=2000)
    except Exception:
        return ""
