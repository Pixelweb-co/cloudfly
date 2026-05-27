FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero (cache Docker)
COPY marketing_team_ai/requirements.txt .

# Instalar dependencias
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar proyecto y el modulo de servicios del agente antiguo para resolver dependencias
COPY marketing_team_ai/ .
COPY marketing_agent/services/ ./services/


# Puerto
EXPOSE 8000

# Ejecutar worker
CMD ["python", "main.py"]