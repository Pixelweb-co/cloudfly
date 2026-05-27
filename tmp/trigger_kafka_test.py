import json
import time

# Script para simular el mensaje de Kafka que el backend enviaría
# Útil para verificar que el notification-service en el VPS procesa bien el mensaje

def generate_welcome_payload():
    return {
        "customerName": "Empresa Test Final",
        "phoneNumber": "573246285134",
        "contactName": "Admin Test",
        "email": "test@cloudfly.com.co",
        "businessType": "Salón de Belleza"
    }

print("Simulando envío de notificación de bienvenida a Kafka...")
print(json.dumps(generate_welcome_payload(), indent=2))
print("\n--- PASO SIGUIENTE ---")
print("Ejecuta esto en el VPS para disparar la notificación real:")
print(f"docker exec -it kafka kafka-console-producer --bootstrap-server localhost:9092 --topic welcome-notifications")
print("Y pega el JSON de arriba.")
