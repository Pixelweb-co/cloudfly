#!/usr/bin/env python3
"""
Business Lead Scraper – Google Maps (browser automation)
Busca negocios por categoría, país y ciudad usando Google Maps real.
Extrae: nombre, teléfono, email, sitio web, dirección, rating.

Instalación:
    pip install playwright beautifulsoup4 requests
    playwright install chromium

Uso:
    python business_scraper.py --category "restaurante" --country "Colombia" --city "Medellín"
    python business_scraper.py --category "dentista" --country "México" --city "CDMX" --max 40
    python business_scraper.py --category "hotel" --country "Argentina" --city "Buenos Aires" --output leads.csv
    python business_scraper.py --category "gym" --country "España" --no-email --headless
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from dataclasses import dataclass, asdict, fields
from typing import Optional
from urllib.parse import urljoin, unquote

import requests
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout


# ─── Modelo ───────────────────────────────────────────────────────────────────

@dataclass
class Business:
    name:    str = ""
    category: str = ""
    country: str = ""
    city:    str = ""
    address: str = ""
    phone:   str = ""
    email:   str = ""
    website: str = ""
    rating:  str = ""
    reviews: str = ""
    maps_url: str = ""


# ─── Email scraping ────────────────────────────────────────────────────────────

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.IGNORECASE
)

BLACKLISTED = {
    "example.com", "sentry.io", "wixpress.com", "w3.org", "schema.org",
    "google.com", "facebook.com", "instagram.com", "twitter.com",
    "tiktok.com", "whatsapp.com",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}


def clean_emails(raw: list) -> list:
    seen, result = set(), []
    for e in raw:
        e = e.lower()
        domain = e.split("@")[-1]
        if domain in BLACKLISTED or len(e) > 80:
            continue
        if e not in seen:
            seen.add(e)
            result.append(e)
    return result


def fetch_email_from_website(url: str) -> str:
    if not url:
        return ""
    if not url.startswith("http"):
        url = "https://" + url

    session = requests.Session()
    session.headers.update(HEADERS)

    pages_to_try = [url] + [
        urljoin(url, p)
        for p in ["/contacto", "/contact", "/contactanos", "/nosotros", "/about"]
    ]

    for page_url in pages_to_try:
        try:
            r = session.get(page_url, timeout=8, allow_redirects=True)
            if r.ok and "text/html" in r.headers.get("content-type", ""):
                found = clean_emails(EMAIL_REGEX.findall(r.text))
                if found:
                    return found[0]
        except Exception:
            pass
        time.sleep(0.3)

    return ""


# ─── Google Maps scraper ───────────────────────────────────────────────────────

def build_query(category: str, city, country: str) -> str:
    parts = [category]
    if city:
        parts.append(city)
    parts.append(country)
    return " ".join(parts)


def scrape_google_maps(
    category: str,
    country: str,
    city=None,
    max_results: int = 20,
    fetch_emails: bool = True,
    headless: bool = False,
    verbose: bool = True,
) -> list:

    query = build_query(category, city, country)
    search_url = "https://www.google.com/maps/search/" + query.replace(" ", "+")
    businesses = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            locale="es-ES",
            user_agent=HEADERS["User-Agent"],
            viewport={"width": 1280, "height": 900},
        )
        page = context.new_page()

        if verbose:
            print(f"\n🗺️  Google Maps: {search_url}\n")

        page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)

        # Cerrar diálogos de cookies
        for sel in [
            'button:has-text("Aceptar todo")',
            'button:has-text("Accept all")',
            '[aria-label="Aceptar"]',
        ]:
            try:
                btn = page.locator(sel).first
                if btn.is_visible(timeout=1500):
                    btn.click()
                    time.sleep(1)
                    break
            except Exception:
                pass

        # ── Scroll para cargar resultados ──────────────────────────────────────
        if verbose:
            print("📜  Cargando resultados…")

        feed = page.locator('[role="feed"]')
        for _ in range(max_results // 4 + 6):
            try:
                feed.evaluate("el => el.scrollBy(0, 900)")
            except Exception:
                page.evaluate("window.scrollBy(0, 900)")
            time.sleep(1.3)

            count = page.locator('[role="feed"] > div[jsaction]').count()
            if verbose:
                print(f"   → {count} resultados cargados…", end="\r")
            if count >= max_results:
                break

            try:
                if page.locator('text="Llegas al final"').is_visible(timeout=400):
                    break
            except Exception:
                pass

        print()
        cards = page.locator('[role="feed"] > div[jsaction]').all()[:max_results]
        total = len(cards)

        if verbose:
            print(f"\n✅  {total} negocios encontrados. Extrayendo detalles…\n")

        for i, card in enumerate(cards, 1):
            try:
                card.scroll_into_view_if_needed(timeout=3000)
                card.click(timeout=5000)
                time.sleep(2)
            except Exception:
                continue

            biz = Business(category=category, country=country, city=city or "")

            panel = page.locator('[role="main"]')

            # Nombre
            try:
                biz.name = panel.locator("h1").first.inner_text(timeout=3000).strip()
            except Exception:
                try:
                    biz.name = card.locator(".fontHeadlineSmall").first.inner_text().strip()
                except Exception:
                    pass

            # Rating
            try:
                aria = (
                    panel.locator('[aria-label*="estrellas"], [aria-label*="stars"]')
                    .first.get_attribute("aria-label", timeout=2000) or ""
                )
                nums = re.findall(r"[\d.,]+", aria)
                if nums:
                    biz.rating  = nums[0]
                    biz.reviews = nums[1] if len(nums) > 1 else ""
            except Exception:
                pass

            # Dirección
            try:
                biz.address = (
                    panel.locator('[data-item-id="address"], button[aria-label*="irección"]')
                    .first.inner_text(timeout=2000).strip()
                )
            except Exception:
                pass

            # Teléfono
            try:
                raw_phone = (
                    panel.locator('[data-tooltip*="Copiar número"], [aria-label*="eléfono"], [aria-label*="phone"]')
                    .first.inner_text(timeout=2000).strip()
                )
                biz.phone = re.sub(r"[^\d\s\+\-\(\)]", "", raw_phone).strip()
            except Exception:
                pass

            # Sitio web
            try:
                href = (
                    panel.locator('a[data-item-id="authority"], a[aria-label*="itio web"], a[aria-label*="ebsite"]')
                    .first.get_attribute("href", timeout=2000) or ""
                )
                if "google.com/url" in href:
                    m = re.search(r"url=([^&]+)", href)
                    href = unquote(m.group(1)) if m else href
                biz.website = href
            except Exception:
                pass

            # URL Maps actual
            try:
                biz.maps_url = page.url
            except Exception:
                pass

            # Email
            if fetch_emails and biz.website:
                if verbose:
                    print(f"  [{i}/{total}] {biz.name or '?':<30} → buscando email…")
                biz.email = fetch_email_from_website(biz.website)
            elif verbose:
                print(f"  [{i}/{total}] {biz.name or '?'}")

            businesses.append(biz)

        browser.close()

    return businesses


# ─── Output ───────────────────────────────────────────────────────────────────

def print_table(businesses: list) -> None:
    sep = "─" * 115
    print(f"\n{sep}")
    print(f"{'#':<4} {'NOMBRE':<28} {'TELÉFONO':<16} {'EMAIL':<32} {'RATING':<7} {'WEB':<25}")
    print(sep)
    for i, b in enumerate(businesses, 1):
        web = (b.website[:23] + "..") if len(b.website) > 25 else b.website
        print(f"{i:<4} {b.name:<28} {b.phone:<16} {b.email:<32} {b.rating:<7} {web:<25}")
    print(sep)
    print(f"Total: {len(businesses)} negocios\n")


def save_csv(businesses: list, path: str) -> None:
    keys = [f.name for f in fields(Business)]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for b in businesses:
            writer.writerow(asdict(b))
    print(f"✅  CSV guardado: {path}  ({len(businesses)} registros)")


def save_json(businesses: list, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump([asdict(b) for b in businesses], f, ensure_ascii=False, indent=2)
    print(f"✅  JSON guardado: {path}  ({len(businesses)} registros)")


# ─── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Extrae negocios de Google Maps: nombre, teléfono, email, web.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python business_scraper.py --category "restaurante" --country "Colombia" --city "Medellín"
  python business_scraper.py --category "clínica dental" --country "México" --city "CDMX" --max 40
  python business_scraper.py --category "hotel boutique" --country "Perú" --city "Cusco" --headless
  python business_scraper.py --category "peluquería" --country "Chile" --no-email --format json
        """,
    )
    ap.add_argument("--category", "-c", required=True)
    ap.add_argument("--country",  "-C", required=True)
    ap.add_argument("--city",     "-l", default=None)
    ap.add_argument("--max",      "-m", type=int, default=20)
    ap.add_argument("--output",   "-o", default=None, help="Nombre base del archivo de salida")
    ap.add_argument("--format",   "-f", choices=["csv","json","both"], default="csv")
    ap.add_argument("--no-email", action="store_true", help="No buscar emails (más rápido)")
    ap.add_argument("--headless", action="store_true", help="Navegador invisible")
    ap.add_argument("--quiet",    "-q", action="store_true")
    args = ap.parse_args()

    businesses = scrape_google_maps(
        category=args.category,
        country=args.country,
        city=args.city,
        max_results=args.max,
        fetch_emails=not args.no_email,
        headless=args.headless,
        verbose=not args.quiet,
    )

    if not businesses:
        print("⚠️  Sin resultados.")
        sys.exit(0)

    print_table(businesses)

    slug = "_".join(filter(None, [args.category, args.city, args.country]))
    slug = re.sub(r"[^\w]", "_", slug).lower()[:60]
    base = args.output or slug

    if args.format in ("csv", "both"):
        save_csv(businesses, base + ".csv")
    if args.format in ("json", "both"):
        save_json(businesses, base + ".json")


if __name__ == "__main__":
    main()
