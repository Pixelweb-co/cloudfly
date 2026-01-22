FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema (ffmpeg vital para audio)
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Instalar dependencias python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt edge-tts

# Copiar el código del bot
COPY . .

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Comando para ejecutar el bot y API server
CMD ["/app/entrypoint.sh"]
