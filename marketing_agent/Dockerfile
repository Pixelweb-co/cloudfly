FROM python:3.11-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables (defaults for local dev)
# These can be overridden at runtime via docker run -e or env_file
ENV BACKEND_URL=http://backend:8080 \
    BACKEND_API_KEY="" \
    EVOLUTION_API_URL=http://evolution-api:8080 \
    EVOLUTION_API_KEY="" \
    EVOLUTION_INSTANCE=cloudfly-main \
    DB_HOST=localhost \
    DB_PORT=3306 \
    DB_NAME=cloud_master \
    DB_USER=root \
    DB_PASSWORD="" \
    TENANT_ID=1 \
    COMPANY_ID=1 \
    MIN_DELAY_MS=3000 \
    MAX_DELAY_MS=12000 \
    BATCH_SIZE=20 \
    BATCH_PAUSE_MS=30000

# Health check - verify the application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Run the marketing agent
# Using exec form (JSON array) so Python receives SIGTERM directly as PID 1
CMD ["python", "main.py"]
