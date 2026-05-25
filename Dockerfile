# Dockerfile for CloudFly main application
# This Dockerfile builds a lightweight Python image that runs app.py
# It assumes that all required dependencies are listed in requirements.txt
# If requirements.txt is not present, install minimal dependencies.

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else pip install --no-cache-dir flask; fi

# Expose application port (adjust if needed)
EXPOSE 8000

# Run the application
CMD ["python", "app.py"]
