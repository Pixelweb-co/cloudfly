FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements (if any) and install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Create non‑root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (if the service runs a web server, e.g., FastAPI on 8000)
EXPOSE 8000

# Define entrypoint
CMD ["python", "-m", "marketing_agent.main"]
