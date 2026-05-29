#!/usr/bin/env python3
"""Lead scraper — solo API REST (consumida por marketing_team_ai / frontend)."""

import asyncio
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scraper.engine import scrape

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("lead_scraper.api")

app = FastAPI(
    title="Lead Scraper API",
    description="Búsqueda de leads vía Google. Solo JSON por API; sin exportación a archivos.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=2)


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
                    "country_code": "57",
                }
            ]
        }
    }


class LeadOut(BaseModel):
    nombre: str
    telefono: str
    whatsapp: str
    email: str
    sitio_web: str
    fuente: str
    titulo: str
    ciudad: str = ""


class SearchResponse(BaseModel):
    query: str
    total: int
    duration_s: float
    results: list[LeadOut]


def build_query(category: str, city: Optional[str], country: str) -> str:
    parts = [category]
    if city:
        parts.append(city)
    parts.append(country)
    return " ".join(parts)


def run_scrape(req: SearchRequest):
    query = build_query(req.category, req.city, req.country)
    logger.info(
        "Start scrape query='%s' pages=%s max_links=%s city='%s'",
        query,
        req.pages,
        req.max_links,
        req.city or "",
    )
    return scrape(
        query=query,
        pages=req.pages,
        country_code=req.country_code,
        headless=True,
        verbose=False,
        max_links=req.max_links,
        city=req.city or "",
    )


@app.get("/", tags=["info"])
def root():
    return {
        "service": "Lead Scraper API",
        "version": "2.0.0",
        "mode": "api-only",
        "docs": "/docs",
        "endpoints": {
            "POST /search": "Búsqueda con body JSON",
            "GET /search": "Búsqueda con query params",
            "GET /health": "Estado del servicio",
        },
    }


@app.get("/health", tags=["info"])
def health():
    return {"status": "ok", "timestamp": time.time()}


@app.post("/search", response_model=SearchResponse, tags=["scraper"])
async def search_post(req: SearchRequest):
    query = build_query(req.category, req.city, req.country)
    t0 = time.time()
    try:
        loop = asyncio.get_event_loop()
        leads = await loop.run_in_executor(executor, partial(run_scrape, req))
    except Exception as e:
        logger.exception("Scrape failed query='%s': %s", query, e)
        raise HTTPException(status_code=500, detail=str(e)) from e

    logger.info(
        "Completed scrape query='%s' total=%s duration_s=%.2f",
        query,
        len(leads),
        time.time() - t0,
    )
    return SearchResponse(
        query=query,
        total=len(leads),
        duration_s=round(time.time() - t0, 2),
        results=[LeadOut(**lead.__dict__) for lead in leads],
    )


@app.get("/search", response_model=SearchResponse, tags=["scraper"])
async def search_get(
    category: str = Query(..., description="Tipo de negocio"),
    country: str = Query(..., description="País"),
    city: Optional[str] = Query(None, description="Ciudad (opcional)"),
    pages: int = Query(2, ge=1, description="Páginas de Google"),
    max_links: int = Query(20, ge=1, description="Máx. sitios a visitar"),
    country_code: str = Query("57", description="Código telefónico del país"),
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
