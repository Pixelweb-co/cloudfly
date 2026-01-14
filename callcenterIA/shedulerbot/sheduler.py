import requests
import time
import os

# Configuración (ajusta a tus credenciales)
ARI_URL = os.getenv('ARI_URL', 'http://127.0.0.1:8088')
ARI_USER = os.getenv('ARI_USER', 'ariuser')
ARI_PASS = os.getenv('ARI_PASS', 'aripass')
APP_NAME = 'voicebot'

def disparar_llamada_cobro():
    print(f"🚀 Iniciando llamada de cobro a Edwin (1003)...")
    
    # Endpoint para originar llamada
    url = f"{ARI_URL}/ari/channels"
    
    # Parámetros para llamar a la extensión 1003 y lanzarla a nuestra App
    payload = {
        "endpoint": "PJSIP/1003", # O "SIP/1003" según tu config
        "extension": "1003",
        "context": "from-internal",
        "priority": 1,
        "app": APP_NAME,
        "appArgs": "cobro_factura_1025", # Pasamos argumentos para identificar el flujo
        "callerId": "Laura Asistente <1000>"
    }
    
    try:
        response = requests.post(url, auth=(ARI_USER, ARI_PASS), json=payload)
        if response.status_code == 200 or response.status_code == 201:
            print("✅ Llamada originada con éxito.")
        else:
            print(f"❌ Error al originar: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"🔥 Error de conexión: {e}")

if __name__ == "__main__":
    while True:
        disparar_llamada_cobro()
        print("⏳ Esperando 1 hora para la próxima llamada...")
        time.sleep(3600) # 3600 segundos = 1 hora