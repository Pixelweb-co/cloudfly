FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY lead_scrapper_google/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Instalar únicamente el navegador Chromium y sus dependencias del sistema
RUN playwright install --with-deps chromium

COPY business_scraper2.py ./business_scraper.py
COPY lead_scrapper_google/api.py ./api.py

RUN mkdir -p /app/output

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
