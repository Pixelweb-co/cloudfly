import requests
import json
from datetime import datetime, timedelta

url = "http://localhost:8085/api/events"
payload = {
    "tenantId": 1,
    "companyId": 1,
    "calendarId": 1,
    "title": "WhatsApp Notificación VPS",
    "eventType": "NOTIFICATION",
    "startTime": (datetime.now() + timedelta(minutes=1)).isoformat(),
    "payload": json.dumps({
        "to": "3115602559",
        "body": "🚀 Hola! Esta es una notificación de prueba por WhatsApp desde el Scheduler Service de CloudFly. Verificando instancia dinámica.",
        "type": "whatsapp"
    })
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
