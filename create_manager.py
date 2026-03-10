import requests
import json

API_URL = "https://api.cloudfly.com.co"

def create_manager():
    # 1. Registro
    reg_data = {
        "nombres": "Manager",
        "apellidos": "Cloudfly",
        "username": "manager_cf_final",
        "email": "manager_cloudfly_test@cloudfly.com.co",
        "password": "Password123*",
        "roles": ["MANAGER"]
    }
    
    print(f"Registrando usuario {reg_data['username']}...")
    res = requests.post(f"{API_URL}/auth/register", json=reg_data)
    if res.status_code != 201:
        print(f"Error en registro: {res.text}")
        return
    
    reg_res = res.json()
    token = reg_res.get('user', {}).get('verificationToken')
    print(f"Usuario registrado. Token: {token}")

    # 2. Verificación
    if token:
        print("Verificando cuenta...")
        verify_res = requests.get(f"{API_URL}/auth/verify?token={token}")
        print(f"Resultado verificación: {verify_res.json()}")

    # 3. Login para ver respuesta
    login_data = {
        "username": reg_data['username'],
        "password": reg_data['password']
    }
    print("Iniciando sesión...")
    login_res = requests.post(f"{API_URL}/auth/login", json=login_data)
    print("--- RESPUESTA LOGIN ---")
    print(json.dumps(login_res.json(), indent=2))

if __name__ == "__main__":
    create_manager()
