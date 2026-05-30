FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero (cache Docker)
COPY requirements.txt .

# Instalar dependencias
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar todos los módulos del proyecto
COPY *.py ./
COPY agents/ ./agents/
COPY crews/ ./crews/
COPY flows/ ./flows/
COPY kafka/ ./kafka/
COPY services/ ./services/
COPY tools/ ./tools/
COPY sql/ ./sql/

# Puerto
EXPOSE 8000

# Ejecutar worker
CMD ["python", "main.py"]