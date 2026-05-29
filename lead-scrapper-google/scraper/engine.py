import logging

from scraper.browser import launch_browser, new_page
from scraper.dedup import LeadDedup
from scraper.directory import is_directory, scrape_directory_pages
from scraper.google_search import collect_google_links
from scraper.models import Lead
from scraper.regex_utils import build_phone_patterns, contacts_complete
from scraper.single_business import scrape_single_business

logger = logging.getLogger("lead_scraper.worker")


def scrape(
    query: str,
    pages: int = 2,
    country_code: str = "57",
    headless: bool = True,
    verbose: bool = True,
    max_links: int = 30,
    city: str = "",
    max_directory_pages: int = 5,
) -> list[Lead]:
    logger.info(
        "Worker started query='%s' pages=%s max_links=%s city='%s'",
        query,
        pages,
        max_links,
        city or "",
    )
    phone_patterns = build_phone_patterns(country_code)
    dedup = LeadDedup()
    leads: list[Lead] = []
    ciudad = city or _city_from_query(query)

    with launch_browser(headless=headless) as (_, _browser, context):
        gpage = new_page(context)
        try:
            result_links = collect_google_links(gpage, query, pages, verbose)
        finally:
            gpage.close()

        if not result_links:
            if verbose:
                print("\n❌  No se encontraron enlaces en Google.")
            logger.warning("No google links found query='%s'", query)
            return leads

        result_links = result_links[:max_links]
        logger.info("Collected %s google links query='%s'", len(result_links), query)
        for n, link in enumerate(result_links, 1):
            mode = "directory" if is_directory(link) else "single"
            logger.info("  [%s/%s] %s → %s", n, len(result_links), mode, link[:100])
        if verbose:
            print(f"\n📋  {len(result_links)} enlaces. Procesando…\n")

        for i, url in enumerate(result_links, 1):
            if dedup.url_seen(url):
                logger.debug("Skip duplicate result url='%s'", url)
                continue

            logger.info("Processing [%s/%s] url='%s'", i, len(result_links), url)

            if verbose:
                short = url[:72] + ("…" if len(url) > 72 else "")
                print(f"[{i}/{len(result_links)}] {short}")

            if is_directory(url):
                logger.info("Directory mode url='%s'", url)
                batch = _process_directory(
                    context, url, phone_patterns, country_code, ciudad,
                    max_directory_pages, verbose, dedup, leads,
                )
                if verbose and batch:
                    print(f"         ✅ directorio → {batch} leads nuevos")
                logger.info("Directory processed url='%s' new_leads=%s", url, batch)
            else:
                logger.info("Single mode url='%s'", url)
                _process_single(
                    context, url, phone_patterns, country_code, ciudad,
                    verbose, dedup, leads,
                )

    logger.info("Worker finished query='%s' total_leads=%s", query, len(leads))
    return leads


def _process_directory(
    context,
    url: str,
    phone_patterns: list,
    country_code: str,
    ciudad: str,
    max_directory_pages: int,
    verbose: bool,
    dedup: LeadDedup,
    leads: list[Lead],
) -> int:
    page = new_page(context)
    added = 0
    try:
        raw = scrape_directory_pages(
            page, url, phone_patterns, country_code, ciudad,
            max_pages=max_directory_pages, verbose=verbose,
        )
        logger.info("Parsed directory raw_count=%s url='%s'", len(raw), url)
        for lead in raw:
            if lead.sitio_web and not contacts_complete(lead):
                logger.debug(
                    "Enrich candidate name='%s' website='%s'",
                    lead.nombre,
                    lead.sitio_web,
                )
                _enrich_from_website(
                    context, lead, phone_patterns, country_code, ciudad,
                    verbose, dedup,
                )
            if not dedup.accept_lead(lead):
                logger.debug(
                    "Discard lead duplicate/no-contact name='%s' email='%s' phone='%s'",
                    lead.nombre,
                    lead.email,
                    lead.telefono or lead.whatsapp,
                )
                continue
            leads.append(lead)
            added += 1
            if verbose and lead.nombre:
                print(f"         · {lead.nombre[:40]}")
    finally:
        page.close()
    return added


def _process_single(
    context,
    url: str,
    phone_patterns: list,
    country_code: str,
    ciudad: str,
    verbose: bool,
    dedup: LeadDedup,
    leads: list[Lead],
) -> None:
    page = new_page(context)
    try:
        lead = scrape_single_business(page, url, phone_patterns, country_code, ciudad)
    finally:
        page.close()

    if not contacts_complete(lead):
        if verbose:
            print("         — sin contacto")
        logger.debug("No contact found single url='%s'", url)
        return

    if not dedup.accept_lead(lead):
        logger.debug("Discard single lead duplicate url='%s'", url)
        return

    leads.append(lead)
    logger.info(
        "Lead added single name='%s' phone='%s' email='%s'",
        lead.nombre,
        lead.telefono or lead.whatsapp,
        lead.email,
    )
    if verbose:
        parts = []
        if lead.telefono:
            parts.append(f"📞 {lead.telefono}")
        if lead.whatsapp:
            parts.append(f"💬 {lead.whatsapp}")
        if lead.email:
            parts.append(f"✉️  {lead.email}")
        print(f"         ✅ {lead.nombre[:40]}")
        for p in parts:
            print(f"            {p}")


def _enrich_from_website(
    context,
    lead: Lead,
    phone_patterns: list,
    country_code: str,
    ciudad: str,
    verbose: bool,
    dedup: LeadDedup,
) -> None:
    web = lead.sitio_web
    if not web or dedup.url_seen(web):
        logger.debug("Skip enrich website='%s' (empty/seen)", web or "")
        return

    page = new_page(context)
    try:
        enriched = scrape_single_business(page, web, phone_patterns, country_code, ciudad)
    finally:
        page.close()

    if enriched.telefono and not lead.telefono:
        lead.telefono = enriched.telefono
    if enriched.whatsapp and not lead.whatsapp:
        lead.whatsapp = enriched.whatsapp
    if enriched.email and not lead.email:
        lead.email = enriched.email
    logger.info(
        "Enriched lead name='%s' website='%s' phone='%s' email='%s'",
        lead.nombre,
        web,
        lead.telefono or lead.whatsapp,
        lead.email,
    )
    if verbose and contacts_complete(lead):
        print(f"         ↳ enriquecido desde web: {web[:50]}…")


def _city_from_query(query: str) -> str:
    # Heurística simple: segunda palabra si parece ciudad (sin país largo)
    parts = query.split()
    if len(parts) >= 2:
        return parts[1][:60]
    return ""
