import requests
import json
from datetime import datetime, timedelta

url = "http://localhost:8085/api/events"
payload = {
    "tenantId": 1,
    "companyId": 1,
    "calendarId": 1,
    "title": "Notificacion con Branding",
    "eventType": "NOTIFICATION",
    "startTime": (datetime.now() + timedelta(minutes=1)).isoformat(),
    "payload": json.dumps({
        "to": "egbmaster2007@gmail.com",
        "subject": "🔔 Nueva Notificación Programada",
        "body": "Esta es una notificación de prueba con el nuevo diseño de cabecera y pie de página de la compañía.",
        "type": "notification",
        "username": "egbmaster",
        "templateData": {
            "companyName": "CloudFly Marketing AI"
        }
    })
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
