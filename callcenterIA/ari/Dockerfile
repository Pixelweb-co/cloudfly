FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del bot
COPY . .

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Comando para ejecutar el bot y API server
CMD ["/app/entrypoint.sh"]
