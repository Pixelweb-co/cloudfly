# Dockerfile for CloudFly AI
# Base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements if any
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || true

# Copy source code
COPY . .

# Expose port 8000 for the web service
EXPOSE 8000

# Default command
CMD ["python", "app.py"]
