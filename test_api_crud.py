import requests
import json
import argparse
import sys
import time

BASE_URL = "https://api.cloudfly.com.co"

def print_step(msg):
    print(f"\n[{time.strftime('%H:%M:%S')}] {msg}")

def test_api_crud(username, password):
    print_step(f"INICIANDO TEST API CRUD DIRECTA PARA: {username}")
    
    # --- 1. LOGIN ---
    print_step("Fase 1: Login...")
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {"username": username, "password": password}
    
    try:
        response = requests.post(login_url, json=login_payload, timeout=10)
        if response.status_code != 200:
            print(f"ERROR: Login falló (Status {response.status_code})")
            return False
        jwt = response.json().get("jwt")
        if not jwt:
            print("ERROR: No se recibió JWT.")
            return False
        print("SUCCESS: Login exitoso.")
    except Exception as e:
        print(f"Excepción en Login: {e}")
        return False

    headers = {
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json"
    }

    # --- 2. CREAR (CREATE) ---
    print_step("Fase 2: Creando Módulo nuevo...")
    module_code = f"API{int(time.time())}"
    create_payload = {
        "code": module_code,
        "name": f"API Test Module {module_code}",
        "description": "Módulo creado desde el script de test API",
        "icon": "api_icon",
        "displayOrder": 99,
        "isActive": True,
        "menuPath": f"/api-test-{module_code}"
    }
    
    module_id = None
    try:
        res_create = requests.post(f"{BASE_URL}/api/rbac/modules", json=create_payload, headers=headers)
        if res_create.status_code in (200, 201):
            created_data = res_create.json()
            module_id = created_data.get("id")
            print(f"SUCCESS: Módulo creado con ID: {module_id}")
        else:
            print(f"ERROR: Falló creación (Status {res_create.status_code}): {res_create.text}")
            return False
    except Exception as e:
        print(f"Excepción creando módulo: {e}")
        return False

    # --- 3. LISTAR Y VERIFICAR (READ) ---
    print_step("Fase 3: Listando Módulos para verificar creación...")
    try:
        res_list = requests.get(f"{BASE_URL}/api/rbac/modules-list", headers=headers)
        if res_list.status_code == 200:
            modules = res_list.json()
            found = next((m for m in modules if m.get("id") == module_id), None)
            if found:
                print(f"SUCCESS: Módulo {module_id} encontrado en la lista exitosamente.")
                print(f" -> Nombre: {found.get('name')}, Activo: {found.get('isActive')}")
            else:
                print(f"ERROR: El módulo {module_id} no aparece en la lista.")
                return False
        else:
            print(f"ERROR: Falló al listar módulos (Status {res_list.status_code})")
            return False
    except Exception as e:
        print(f"Excepción listando módulos: {e}")
        return False

    # --- 4. LEER DETALLE EXACTO (GET BY ID) ---
    print_step(f"Fase 4: Obteniendo detalle del módulo ID {module_id}...")
    try:
        res_detail = requests.get(f"{BASE_URL}/api/rbac/modules/{module_id}", headers=headers)
        if res_detail.status_code == 200:
            detail = res_detail.json()
            if detail.get("code") == module_code and detail.get("description") == create_payload["description"]:
                print("SUCCESS: Los campos se guardaron correctamente en BD.")
            else:
                print("ERROR: Los datos devueltos no coinciden con los enviados.")
        else:
            print(f"ERROR: Falló lectura directa del módulo (Status {res_detail.status_code})")
    except Exception as e:
        print(f"Excepción leyendo módulo: {e}")

    # --- 5. ACTUALIZAR (UPDATE) ---
    print_step(f"Fase 5: Actualizando Módulo {module_id}...")
    update_payload = create_payload.copy()
    update_payload["name"] = f"{create_payload['name']} (Editado por API)"
    update_payload["isActive"] = False
    
    try:
        res_update = requests.put(f"{BASE_URL}/api/rbac/modules/{module_id}", json=update_payload, headers=headers)
        if res_update.status_code == 200:
            print("SUCCESS: Módulo actualizado correctamente.")
        else:
            print(f"ERROR: Falló actualización (Status {res_update.status_code}): {res_update.text}")
    except Exception as e:
        print(f"Excepción actualizando: {e}")

    # --- 6. ELIMINAR (DELETE) ---
    print_step(f"Fase 6: Eliminando Módulo {module_id}...")
    try:
        res_delete = requests.delete(f"{BASE_URL}/api/rbac/modules/{module_id}", headers=headers)
        if res_delete.status_code in (200, 204):
            print("SUCCESS: Módulo eliminado exitosamente.")
        else:
            print(f"ERROR: Falló eliminación (Status {res_delete.status_code}): {res_delete.text}")
    except Exception as e:
        print(f"Excepción eliminando: {e}")

    print_step("--- TEST API CRUD FINALIZADO ---")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='CloudFly Modules Api CRUD')
    parser.add_argument('--user', default="manager")
    parser.add_argument('--password', default="Password123*")
    args = parser.parse_args()
    test_api_crud(args.user, args.password)
