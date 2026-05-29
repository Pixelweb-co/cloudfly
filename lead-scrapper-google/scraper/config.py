import re

DIRECTORY_DOMAINS = [
    "yelp",
    "paginasamarillas",
    "páginasamarillas",
    "cylex",
    "hotfrog",
    "doctoralia",
    "tripadvisor",
    "guialocal",
    "tupalo",
    "infobel",
    "einforma",
    "kompass",
]

CARD_SELECTORS = [
    "article",
    ".listing",
    ".business-card",
    ".result",
    ".card",
    "[class*='listing']",
    "[class*='business-card']",
    "[class*='result-item']",
    "[data-testid*='listing']",
]

PAGINATION_SELECTORS = [
    'a[rel="next"]',
    'a.next',
    '.pagination a.next',
    'a[aria-label*="Next"]',
    'a[aria-label*="Siguiente"]',
]

PAGINATION_TEXT = re.compile(
    r"^(siguiente|next|›|»|>\s*$|ver más|más resultados)",
    re.I,
)

# Playwright
NAV_TIMEOUT_MS = 5000
GOOGLE_TIMEOUT_MS = 12000
CONTACT_PAGE_TIMEOUT_MS = 4000

BLOCKED_RESOURCE_TYPES = {"image", "media", "font", "stylesheet"}

SKIP_NETLOC_FRAGMENTS = (
    "google.",
    "facebook.",
    "instagram.",
    "youtube.",
    "twitter.",
    "tiktok.",
    "linkedin.",
    "gstatic.",
    "googleusercontent.",
    # Portales de datos / gobierno / enciclopedias (no son fichas de negocio)
    "datos.gov",
    "data.gov",
    "wikipedia.",
    "wikimedia.",
    "archive.org",
    "github.com",
    "schemas.microsoft",
    "schema.org",
)

# Dominios que no aportan leads B2C aunque pasen el filtro general
SKIP_HOST_EXACT = {
    "datos.gov.co",
    "www.datos.gov.co",
    "www.wikipedia.org",
    "es.wikipedia.org",
}

SKIP_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".zip", ".mp4", ".webp"}

BLACKLISTED_EMAIL_DOMAINS = {
    "example.com",
    "sentry.io",
    "wixpress.com",
    "w3.org",
    "schema.org",
    "google.com",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "tiktok.com",
    "whatsapp.com",
    "amazonaws.com",
    "cloudflare.com",
    "yelp.com",
    "tripadvisor.com",
}
