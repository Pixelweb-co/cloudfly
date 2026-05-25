FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY ai_scrum_team/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ai_scrum_team/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
