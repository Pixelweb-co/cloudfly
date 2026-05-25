# Dockerfile for ia-scrum-team service
FROM python:3.11-slim

# Create a non‑root user
RUN useradd -m -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Install system dependencies required for building some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc libffi-dev libssl-dev make \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for caching layers
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Switch to non‑root user
USER appuser

# Expose the service port
EXPOSE 8000

# Default command to run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
