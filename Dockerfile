FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . ./

# Expose the default port (adjust if needed)
EXPOSE 8000

# Define environment variables (can be overridden at runtime)
ENV PYTHONUNBUFFERED=1

# Start the application (modify entrypoint as required)
CMD ["python", "app.py"]