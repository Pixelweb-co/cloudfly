# Use ultra-lightweight Python Alpine image
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install dependencies first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run application (main is inside app folder)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
