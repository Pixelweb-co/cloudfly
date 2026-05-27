#!/usr/bin/env python3
"""
Business Scraper API
FastAPI wrapper sobre el scraper de Google Search.

Endpoints:
  GET  /                        → info
  POST /search                  → lanza búsqueda, devuelve JSON
  GET  /search?category=...     → misma búsqueda por GET
  GET  /health                  → estado del servicio
"""

import asyncio
import re
import time
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Importar el motor del scraper
from business_scraper import scrape, Lead

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Business Scraper API",
    description="Busca negocios en Google y extrae teléfono, WhatsApp y email.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=3)


# ─── Modelos ──────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    category: str
    country: str
    city: Optional[str] = None
    pages: int = 2
    max_links: int = 20
    country_code: str = "57"

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "category": "clínicas dentales",
                    "country": "Colombia",
                    "city": "Bogotá",
                    "pages": 2,
                    "max_links": 20,
                    "country_code": "57"
                }
            ]
        }
    }


class LeadOut(BaseModel):
    nombre:    str
    telefono:  str
    whatsapp:  str
    email:     str
    sitio_web: str
    fuente:    str
    titulo:    str


class SearchResponse(BaseModel):
    query:      str
    total:      int
    duration_s: float
    results:    list[LeadOut]


# ─── Helper ───────────────────────────────────────────────────────────────────

def build_query(category: str, city: Optional[str], country: str) -> str:
    parts = [category]
    if city:
        parts.append(city)
    parts.append(country)
    return " ".join(parts)


def run_scrape(req: SearchRequest) -> list[Lead]:
    query = build_query(req.category, req.city, req.country)
    return scrape(
        query=query,
        pages=req.pages,
        country_code=req.country_code,
        headless=True,          # siempre headless en API/Docker
        verbose=True,
        max_links=req.max_links,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/", tags=["info"])
def root():
    return {
        "service": "Business Scraper API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "POST /search": "Búsqueda con body JSON",
            "GET  /search": "Búsqueda con query params",
            "GET  /health": "Estado del servicio",
        },
    }


@app.get("/health", tags=["info"])
def health():
    return {"status": "ok", "timestamp": time.time()}


@app.post("/search", response_model=SearchResponse, tags=["scraper"])
async def search_post(req: SearchRequest):
    """
    Busca negocios y devuelve lista de contactos.

    - **category**: tipo de negocio (ej: `"restaurante"`, `"dentista"`)
    - **country**: país (ej: `"Colombia"`)
    - **city**: ciudad opcional (ej: `"Medellín"`)
    - **pages**: páginas de Google a leer (default: 2)
    - **max_links**: máximo de sitios a visitar (default: 20)
    - **country_code**: código telefónico (default: `"57"` para Colombia)
    """
    query = build_query(req.category, req.city, req.country)
    t0 = time.time()

    try:
        loop = asyncio.get_event_loop()
        leads = await loop.run_in_executor(executor, partial(run_scrape, req))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return SearchResponse(
        query=query,
        total=len(leads),
        duration_s=round(time.time() - t0, 2),
        results=[LeadOut(**lead.__dict__) for lead in leads],
    )


@app.get("/search", response_model=SearchResponse, tags=["scraper"])
async def search_get(
    category:     str            = Query(...,        description="Tipo de negocio"),
    country:      str            = Query(...,        description="País"),
    city:         Optional[str]  = Query(None,       description="Ciudad (opcional)"),
    pages:        int            = Query(2,    ge=1, description="Páginas de Google"),
    max_links:    int            = Query(20,   ge=1, description="Máx. sitios a visitar"),
    country_code: str            = Query("57",       description="Código telefónico del país"),
):
    req = SearchRequest(
        category=category,
        country=country,
        city=city,
        pages=pages,
        max_links=max_links,
        country_code=country_code,
    )
    return await search_post(req)
