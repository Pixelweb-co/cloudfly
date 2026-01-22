from flask import Flask, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

# Configuración básica
ASTERISK_HOST = os.getenv('ASTERISK_HOST', 'asterisk')
ARI_URL = f"http://{ASTERISK_HOST}:8088/ari"
ARI_USER = os.getenv('ARI_USER', 'ariuser')
ARI_PASS = os.getenv('ARI_PASS', 'aripass')
EXT_PASSWORD = os.getenv('EXT_PASSWORD', 'cloudfly2025')

# Mapeo simple de Usuario ERP ID -> Extensión
# En un entorno real, esto vendría de la base de datos
def get_extension_for_user(user_id):
    return 1000 + int(user_id)

@app.route('/config/<int:user_id>', methods=['GET'])
def get_phone_config(user_id):
    extension = get_extension_for_user(user_id)
    
    config = {
        'extension': str(extension),
        'password': EXT_PASSWORD,
        'domain': ASTERISK_HOST,
        'websocket_url': f"ws://{os.getenv('PUBLIC_IP', '192.168.255.6')}:8088/ws",
        'ice_servers': [
            {'urls': 'stun:stun.l.google.com:19302'}
        ]
    }
    return jsonify(config)

@app.route('/status/<extension>', methods=['GET'])
def get_status(extension):
    try:
        # Consultar estado en Asterisk vía ARI
        response = requests.get(
            f"{ARI_URL}/endpoints/PJSIP/{extension}",
            auth=(ARI_USER, ARI_PASS)
        )
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'extension': extension,
                'state': data.get('state', 'unknown'),
                'online': data.get('state') == 'online'
            })
        return jsonify({'error': 'Extension not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
