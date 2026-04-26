import requests
import json
import uuid
import time
import sys

# Configuration
WEBHOOK_URL = "https://chat.cloudfly.com.co/webhook/evolution"
INSTANCE_NAME = "cloudfly_t1_c1"  # Vinculado al tenant 1 / compañía 1 en la base de datos
PHONE_NUMBER = "aidebug"
PUSH_NAME = "AiDebug User"

def send_message(text):
    payload = {
        "event": "messages.upsert",
        "instance": INSTANCE_NAME,
        "data": {
            "message": {
                "conversation": text
            },
            "key": {
                "remoteJid": f"{PHONE_NUMBER}@s.whatsapp.net",
                "fromMe": False,
                "id": f"SIM_{uuid.uuid4().hex[:10].upper()}"
            },
            "pushName": PUSH_NAME
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }

    try:
        print(f"Enviando: '{text}'...")
        response = requests.post(WEBHOOK_URL, json=payload, headers=headers)
        if response.status_code == 200:
            print("OK: Mensaje enviado al webhook exitosamente.")
        else:
            print(f"Error al enviar mensaje: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error de conexion: {e}")

if __name__ == "__main__":
    print("=======================================")
    print(f" Simulador de Chat (Evolution Webhook) ")
    print(f" Instancia: {INSTANCE_NAME}")
    print(f" Contacto: {PHONE_NUMBER}")
    print("=======================================\n")
    print("Escribe un mensaje para enviarlo al bot.")
    print("Escribe 'salir' o 'exit' para terminar.\n")
    
    while True:
        try:
            msg = input("Tú: ")
            if msg.lower() in ['salir', 'exit', 'quit']:
                print("Saliendo...")
                break
            
            if msg.strip():
                send_message(msg)
                print("💡 Nota: Espera unos segundos para ver la respuesta del bot en los logs o en la consola del servidor.\n")
        except KeyboardInterrupt:
            print("\nSaliendo...")
            break
