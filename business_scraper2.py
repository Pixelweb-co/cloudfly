#!/usr/bin/env python3
"""
Business Lead Scraper – Google Search + extracción de contactos
Busca en Google, visita cada enlace y extrae: nombre, teléfono/WhatsApp, email, web.

Instalación:
    pip install playwright beautifulsoup4 requests
    playwright install chromium

Uso:
    python business_scraper.py --query "restaurantes Medellín Colombia"
    python business_scraper.py --query "dentistas Bogotá" --pages 3 --output leads.csv
    python business_scraper.py --query "hoteles Cartagena" --country-code 57 --headless
"""

import argparse
import csv
import json
import re
import sys
import time
from dataclasses import dataclass, asdict, fields
from typing import Optional
from urllib.parse import urljoin, urlparse, unquote

from playwright.sync_api import sync_playwright


# ─── Patrones de teléfono ─────────────────────────────────────────────────────

def build_phone_patterns(country_code: str = "57"):
    """
    Genera regexes para el código de país dado.
    Colombia (57): móviles empiezan en 3xx xxx xxxx
    México  (52):  móviles empiezan en 1xx / 55 / 33...
    etc. — el patrón genérico cubre cualquier número de 7-12 dígitos.
    """
    cc = re.escape(country_code)
    return [
        # WhatsApp directo: wa.me/573001234567
        re.compile(rf"wa\.me/({cc}\d{{7,12}})", re.I),
        # WhatsApp API: ?phone=573001234567
        re.compile(rf"phone=({cc}\d{{7,12}})", re.I),
        # Número con +57 o 0057 seguido de dígitos
        re.compile(rf"(?:\+{cc}|00{cc})[\s\-\.]?(\d[\d\s\-\.]{6,14}\d)"),
        # Colombia: local 3xx xxx xxxx (sin prefijo)
        re.compile(r"\b(3[0-9]{2}[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b"),
        # Número genérico largo (7-12 dígitos, separados o juntos)
        re.compile(r"\b(\d{3,4}[\s\-\.]\d{3,4}[\s\-\.]\d{3,4})\b"),
    ]


EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.I
)

BLACKLISTED_DOMAINS = {
    "example.com","sentry.io","wixpress.com","w3.org","schema.org",
    "google.com","facebook.com","instagram.com","twitter.com","tiktok.com",
    "whatsapp.com","amazonaws.com","cloudflare.com",
}

SKIP_EXTENSIONS = {".pdf",".jpg",".jpeg",".png",".gif",".svg",".zip",".mp4",".webp"}


# ─── Modelo ───────────────────────────────────────────────────────────────────

@dataclass
class Lead:
    nombre:    str = ""
    telefono:  str = ""
    whatsapp:  str = ""
    email:     str = ""
    sitio_web: str = ""
    fuente:    str = ""   # URL donde se encontró el contacto
    titulo:    str = ""   # título de la página


# ─── Helpers ─────────────────────────────────────────────────────────────────

def normalizar_telefono(raw: str, country_code: str = "57") -> str:
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00" + country_code):
        digits = digits[2 + len(country_code):]
    elif digits.startswith(country_code) and len(digits) > len(country_code) + 6:
        digits = digits[len(country_code):]
    # Reagrupa en bloques de 3
    if len(digits) == 10:
        return f"{digits[:3]} {digits[3:6]} {digits[6:]}"
    return digits


def limpiar_emails(lst: list) -> list:
    seen, out = set(), []
    for e in lst:
        e = e.lower()
        dom = e.split("@")[-1]
        if dom in BLACKLISTED_DOMAINS or len(e) > 80:
            continue
        if e not in seen:
            seen.add(e)
            out.append(e)
    return out


def debe_saltar(url: str) -> bool:
    parsed = urlparse(url)
    if any(d in parsed.netloc for d in ["google.","facebook.","instagram.","youtube.","twitter.","tiktok."]):
        return True
    path = parsed.path.lower()
    if any(path.endswith(ext) for ext in SKIP_EXTENSIONS):
        return True
    return False


# ─── Extracción de contactos en una página ───────────────────────────────────

def extraer_contactos(page, url: str, phone_patterns: list, country_code: str) -> Lead:
    lead = Lead(sitio_web=url)

    try:
        lead.titulo = page.title()[:100]
    except Exception:
        pass

    # Nombre: H1 o título
    try:
        h1 = page.locator("h1").first.inner_text(timeout=1500).strip()
        lead.nombre = h1[:80] if h1 else lead.titulo
    except Exception:
        lead.nombre = lead.titulo

    # Contenido de texto de la página + atributos href
    try:
        text = page.inner_text("body", timeout=2500)
    except Exception:
        text = ""

    # También el HTML crudo para capturar hrefs de WhatsApp
    try:
        html = page.content()
    except Exception:
        html = ""

    full = text + "\n" + html

    # ── WhatsApp ──────────────────────────────────────────────────────────────
    # Primero buscar links wa.me directos
    wa_links = re.findall(r'href=["\']https?://wa\.me/(\d+)', html, re.I)
    wa_links += re.findall(r'href=["\']https?://api\.whatsapp\.com/send\?phone=(\d+)', html, re.I)
    if wa_links:
        digits = wa_links[0]
        lead.whatsapp = "+" + digits if not digits.startswith("+") else digits

    # ── Teléfonos ─────────────────────────────────────────────────────────────
    phones_found = []
    for pat in phone_patterns:
        found = pat.findall(full)
        phones_found.extend(found)

    # Limpiar y deduplicar
    seen_phones = set()
    clean_phones = []
    for p in phones_found:
        norm = normalizar_telefono(p, country_code)
        digits_only = re.sub(r"\D", "", norm)
        if digits_only and digits_only not in seen_phones and len(digits_only) >= 7:
            seen_phones.add(digits_only)
            clean_phones.append(norm)

    if clean_phones:
        lead.telefono = " / ".join(clean_phones[:3])

    # Si no encontramos WA pero hay un número de celular, marcarlo también como WA
    if not lead.whatsapp and clean_phones:
        first_digits = re.sub(r"\D", "", clean_phones[0])
        if len(first_digits) == 10 and first_digits.startswith("3"):  # móvil Colombia
            lead.whatsapp = f"+{country_code}{first_digits}"

    # ── Email ─────────────────────────────────────────────────────────────────
    emails = limpiar_emails(EMAIL_RE.findall(full))
    if emails:
        lead.email = emails[0]

    # ── Intentar página de contacto si no hallamos nada ───────────────────────
    if not lead.telefono and not lead.email:
        base = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        for path in ["/contacto", "/contact"]:
            try:
                page.goto(base + path, wait_until="domcontentloaded", timeout=4000)
                time.sleep(0.5)
                extra_text = page.inner_text("body", timeout=2000)
                extra_html = page.content()
                combo = extra_text + "\n" + extra_html

                for pat in phone_patterns:
                    found = pat.findall(combo)
                    for p in found:
                        norm = normalizar_telefono(p, country_code)
                        digits_only = re.sub(r"\D", "", norm)
                        if digits_only and len(digits_only) >= 7:
                            if not lead.telefono:
                                lead.telefono = norm
                            break

                wa2 = re.findall(r'href=["\']https?://wa\.me/(\d+)', extra_html, re.I)
                if wa2 and not lead.whatsapp:
                    lead.whatsapp = "+" + wa2[0]

                emails2 = limpiar_emails(EMAIL_RE.findall(combo))
                if emails2 and not lead.email:
                    lead.email = emails2[0]

                if lead.telefono or lead.email or lead.whatsapp:
                    break
            except Exception:
                continue

    lead.fuente = url
    return lead


# ─── Motor principal ───────────────────────────────────────────────────────────

def scrape(
    query: str,
    pages: int = 2,
    country_code: str = "57",
    headless: bool = False,
    verbose: bool = True,
    max_links: int = 30,
) -> list:

    phone_patterns = build_phone_patterns(country_code)
    leads = []
    seen_urls = set()

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
            viewport={"width": 1366, "height": 768},
        )
        # Evitar detección de bot
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        """)

        page = context.new_page()

        # ── Google Search ─────────────────────────────────────────────────────
        result_links = []

        for page_num in range(pages):
            start = page_num * 10
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}&start={start}&hl=es"

            if verbose:
                print(f"\n🔍  Google página {page_num + 1}: {search_url}")

            try:
                page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(2)
            except Exception as e:
                print(f"  ⚠️  No se pudo cargar Google: {e}")
                break

            # Aceptar cookies si aparece
            for sel in ['button:has-text("Aceptar todo")', 'button:has-text("Accept all")', '#L2AGLb']:
                try:
                    btn = page.locator(sel).first
                    if btn.is_visible(timeout=1500):
                        btn.click()
                        time.sleep(1)
                        break
                except Exception:
                    pass

            # Extraer enlaces de resultados orgánicos
            try:
                anchors = page.locator("div#search a[href]").all()
                for a in anchors:
                    try:
                        href = a.get_attribute("href") or ""
                        # Limpiar URLs de redirección de Google
                        if href.startswith("/url?q="):
                            href = unquote(href.split("/url?q=")[1].split("&")[0])
                        if href.startswith("http") and not debe_saltar(href):
                            if href not in seen_urls:
                                seen_urls.add(href)
                                result_links.append(href)
                    except Exception:
                        pass
            except Exception as e:
                print(f"  ⚠️  Error extrayendo links: {e}")

            time.sleep(1.5)

        if not result_links:
            print("\n❌  No se encontraron enlaces en Google. ¿Está bloqueando el bot?")
            browser.close()
            return leads

        result_links = result_links[:max_links]
        if verbose:
            print(f"\n📋  {len(result_links)} enlaces encontrados. Visitando cada uno…\n")
            for i, u in enumerate(result_links, 1):
                print(f"  {i:>2}. {u}")
            print()

        # ── Visitar cada enlace ────────────────────────────────────────────────
        for i, url in enumerate(result_links, 1):
            if verbose:
                short = url[:70] + ("…" if len(url) > 70 else "")
                print(f"[{i}/{len(result_links)}] {short}")

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=6000)
                time.sleep(0.5)
            except Exception as e:
                if verbose:
                    print(f"         ⚠️  No se pudo cargar: {e}")
                continue

            lead = extraer_contactos(page, url, phone_patterns, country_code)

            has_contact = lead.telefono or lead.whatsapp or lead.email
            if has_contact:
                leads.append(lead)
                if verbose:
                    parts = []
                    if lead.telefono:  parts.append(f"📞 {lead.telefono}")
                    if lead.whatsapp:  parts.append(f"💬 WA {lead.whatsapp}")
                    if lead.email:     parts.append(f"✉️  {lead.email}")
                    print(f"         ✅ {lead.nombre[:40]}")
                    for part in parts:
                        print(f"            {part}")
            elif verbose:
                print("         — sin contacto encontrado")

            time.sleep(0.8)

        browser.close()

    return leads


# ─── Output ───────────────────────────────────────────────────────────────────

def print_table(leads: list) -> None:
    if not leads:
        print("\n⚠️  No se encontraron contactos.")
        return
    sep = "─" * 120
    print(f"\n{sep}")
    print(f"{'#':<4} {'NOMBRE':<30} {'TELÉFONO':<18} {'WHATSAPP':<18} {'EMAIL':<30} {'WEB':<22}")
    print(sep)
    for i, b in enumerate(leads, 1):
        web = (b.sitio_web[:20] + "…") if len(b.sitio_web) > 22 else b.sitio_web
        print(f"{i:<4} {b.nombre[:29]:<30} {b.telefono[:17]:<18} {b.whatsapp[:17]:<18} {b.email[:29]:<30} {web:<22}")
    print(sep)
    print(f"\nTotal: {len(leads)} contactos con al menos un dato\n")


def save_csv(leads: list, path: str) -> None:
    keys = [f.name for f in fields(Lead)]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for lead in leads:
            w.writerow(asdict(lead))
    print(f"✅  CSV: {path}  ({len(leads)} registros)")


def save_json(leads: list, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump([asdict(b) for b in leads], f, ensure_ascii=False, indent=2)
    print(f"✅  JSON: {path}  ({len(leads)} registros)")


# ─── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Busca en Google y extrae teléfonos, WhatsApp y emails de cada resultado.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python business_scraper.py --query "restaurantes Medellín Colombia"
  python business_scraper.py --query "clínicas dentales Bogotá" --pages 3 --output leads.csv
  python business_scraper.py --query "hoteles Cartagena sitio web contacto" --pages 2 --headless
  python business_scraper.py --query "peluquerías Cali Colombia" --country-code 57 --format both
        """,
    )
    ap.add_argument("--query",        "-q", required=True,  help="Búsqueda de Google (ej: 'restaurantes Medellín Colombia')")
    ap.add_argument("--pages",        "-p", type=int, default=2, help="Páginas de Google a leer (default: 2 = 20 resultados)")
    ap.add_argument("--country-code", "-cc", default="57",  help="Código de país para teléfonos (default: 57 = Colombia)")
    ap.add_argument("--max-links",    "-m",  type=int, default=30, help="Máximo de links a visitar (default: 30)")
    ap.add_argument("--output",       "-o",  default=None,  help="Nombre base del archivo de salida")
    ap.add_argument("--format",       "-f",  choices=["csv","json","both"], default="csv")
    ap.add_argument("--headless",     action="store_true",  help="Navegador sin ventana")
    ap.add_argument("--quiet",        action="store_true")
    args = ap.parse_args()

    leads = scrape(
        query=args.query,
        pages=args.pages,
        country_code=args.country_code,
        headless=args.headless,
        verbose=not args.quiet,
        max_links=args.max_links,
    )

    print_table(leads)

    slug = re.sub(r"[^\w]", "_", args.query).lower()[:50]
    base = args.output or slug

    if args.format in ("csv","both"):
        save_csv(leads, base + ".csv")
    if args.format in ("json","both"):
        save_json(leads, base + ".json")


if __name__ == "__main__":
    main()
