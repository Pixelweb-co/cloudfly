FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb x11vnc novnc \
    && rm -rf /var/lib/apt/lists/*

COPY lead_scrapper_google/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY business_scraper2.py ./business_scraper.py
COPY lead_scrapper_google/api.py ./api.py

RUN mkdir -p /app/output

EXPOSE 8000

# Por defecto arranca la API; para CLI sobreescribir el entrypoint
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
