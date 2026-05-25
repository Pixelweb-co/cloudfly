FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set environment variables (defaults for local dev)
ENV BACKEND_URL=http://backend:8080
ENV BACKEND_API_KEY=
ENV EVOLUTION_API_URL=http://evolution-api:8080
ENV EVOLUTION_API_KEY=
ENV EVOLUTION_INSTANCE=cloudfly-main
ENV DB_HOST=localhost
ENV DB_PORT=3306
ENV DB_NAME=cloud_master
ENV DB_USER=root
ENV DB_PASSWORD=
ENV TENANT_ID=1
ENV COMPANY_ID=1
ENV MIN_DELAY_MS=3000
ENV MAX_DELAY_MS=12000
ENV BATCH_SIZE=20
ENV BATCH_PAUSE_MS=30000

# Run the marketing agent
CMD ["python", "main.py"]
