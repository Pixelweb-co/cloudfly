import requests
import json
import argparse
import sys

# Configuración base
BASE_URL = "https://api.cloudfly.com.co"

def test_rbac_api(username, password):
    print(f"--- INICIANDO TEST API DIRECTA PARA: {username} ---")
    
    # 1. Login
    print("\n1. Intentando Login...")
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(login_url, json=login_payload, timeout=10)
        if response.status_code != 200:
            print(f"ERROR: Login falló con status {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        jwt = data.get("jwt")
        if not jwt:
            print("ERROR: No se recibió JWT en la respuesta.")
            return False
            
        print("SUCCESS: Login exitoso. JWT obtenido.")
        
        # Extraer info del usuario del DTO retornado
        user_dto = data.get("user", {})
        roles_dto = user_dto.get("roles", [])
        print(f"Roles en UserDto (Login): {[r.get('name') or r.get('role') for r in roles_dto]}")
        
    except Exception as e:
        print(f"ERROR en Login: {e}")
        return False

    headers = {
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json"
    }

    # 2. Get Permissions
    print("\n2. Consultando Permisos (/api/rbac/my-permissions)...")
    try:
        res_perm = requests.get(f"{BASE_URL}/api/rbac/my-permissions", headers=headers, timeout=10)
        if res_perm.status_code == 200:
            p_data = res_perm.json()
            print(f"Roles detectados: {p_data.get('roles')}")
            print(f"Permisos: {list(p_data.get('permissions', []))}")
        else:
            print(f"ERROR: Fallo al obtener permisos ({res_perm.status_code})")
    except Exception as e:
        print(f"ERROR en /my-permissions: {e}")

    # 3. Get Menu
    print("\n3. Consultando Menú (/api/rbac/menu)...")
    try:
        res_menu = requests.get(f"{BASE_URL}/api/rbac/menu", headers=headers, timeout=10)
        if res_menu.status_code == 200:
            m_data = res_menu.json()
            labels = [item.get("label") for item in m_data]
            print(f"Items de Menú retornados: {labels}")
            
            # Verificar si trae el menú administrativo para MANAGER/ADMIN
            if any(label in ["Ventas", "Contabilidad", "Facturación"] for label in labels):
                print("SUCCESS: El menú administrativo está presente en la respuesta.")
            else:
                print("WARNING: No se encontraron ítems administrativos en el menú.")
        else:
            print(f"ERROR: Fallo al obtener menú ({res_menu.status_code})")
    except Exception as e:
        print(f"ERROR en /menu: {e}")

    # 4. Check Subscriptions (Optional if tenantId is available)
    if user_dto.get("tenantId"):
        tenant_id = user_dto.get("tenantId")
        print(f"\n4. Verificando Subscripción Activa (Tenant: {tenant_id})...")
        try:
            sub_url = f"{BASE_URL}/api/v1/subscriptions/tenant/{tenant_id}/active"
            res_sub = requests.get(sub_url, headers=headers, timeout=10)
            if res_sub.status_code == 200:
                print("SUCCESS: Subscripción activa encontrada.")
                print(f"Data: {res_sub.text}")
            else:
                print(f"ERROR: Endpoint de subscripción retornó {res_sub.status_code}")
        except Exception as e:
            print(f"ERROR en subscripciones: {e}")

    print("\n--- TEST FINALIZADO ---")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='CloudFly RBAC API Tester')
    parser.add_argument('--user', default="manager", help='Username')
    parser.add_argument('--password', default="Password123*", help='Password')
    
    args = parser.parse_args()
    test_rbac_api(args.user, args.password)
