import requests
import os
import json
import sys

from database.connection import get_base_path

CONFIG_FILE = os.path.join(get_base_path(), "config.json")
TOKEN_FILE = os.path.join(get_base_path(), "token.txt")
DEFAULT_BASE_URL = "https://api.cloudfly.com.co"

def load_config():
    """Carga api_url, tenant_id y company_id desde el archivo config.json o variables de entorno."""
    api_url = os.getenv("CLOUDFLY_API_URL", DEFAULT_BASE_URL)
    tenant_id = 1
    company_id = 1
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
                api_url = config.get("api_url", api_url)
                tenant_id = config.get("tenant_id", tenant_id)
                company_id = config.get("company_id", company_id)
        except Exception as e:
            print(f"Error al leer config.json: {e}")
            
    return api_url, tenant_id, company_id

class APIClient:
    def __init__(self, base_url=None, tenant_id=None, company_id=None):
        cfg_url, cfg_tenant, cfg_company = load_config()
        self.base_url = base_url if base_url is not None else cfg_url
        self.tenant_id = tenant_id if tenant_id is not None else cfg_tenant
        self.company_id = company_id if company_id is not None else cfg_company
        self.token = self.load_token()

    def load_token(self):
        """Intenta cargar el token JWT localmente."""
        if os.path.exists(TOKEN_FILE):
            try:
                with open(TOKEN_FILE, "r") as f:
                    return f.read().strip()
            except:
                pass
        return None

    def save_token(self, token):
        """Guarda el token JWT localmente."""
        self.token = token
        try:
            with open(TOKEN_FILE, "w") as f:
                f.write(token)
        except Exception as e:
            print(f"Error guardando token: {e}")

    def clear_token(self):
        """Borra el token local."""
        self.token = None
        if os.path.exists(TOKEN_FILE):
            try:
                os.remove(TOKEN_FILE)
            except:
                pass

    def get_headers(self):
        """Retorna las cabeceras comunes con el token de autorización."""
        headers = {
            "Content-Type": "application/json"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def check_health(self):
        """Verifica la conectividad con el backend (simula un ping al health del backend)."""
        try:
            # Dado que el backend podría no tener /health expuesto públicamente sin auth,
            # intentamos llamar al listado de productos de tenant.
            response = requests.get(f"{self.base_url}/api/v1/products/tenant/{self.tenant_id}", timeout=3, headers=self.get_headers())
            return response.status_code != 404
        except Exception:
            return False

    def get_user_info(self):
        """Decodifica el JWT para obtener el nombre de usuario y rol."""
        if not self.token:
            return None
        try:
            import base64
            import json
            parts = self.token.split('.')
            if len(parts) != 3:
                return None
            payload = parts[1]
            payload += '=' * ((4 - len(payload) % 4) % 4)
            decoded = base64.b64decode(payload).decode('utf-8')
            data = json.loads(decoded)
            
            username = data.get("sub", "Usuario")
            authorities = data.get("authorities", "")
            
            # Determinar el rol legible
            role = "Cajero"
            if "ROLE_ADMIN" in authorities or "ADMIN" in authorities:
                role = "Administrador"
            elif "ROLE_MANAGER" in authorities or "MANAGER" in authorities:
                role = "Gerente"
            elif "ROLE_CASHIER" in authorities or "CASHIER" in authorities:
                role = "Cajero"
            
            return {
                "username": username,
                "role": role
            }
        except Exception as e:
            print(f"Error parseando JWT: {e}")
            return None

    def login(self, username, password):
        """Autentica con el backend y obtiene el token JWT."""
        url = f"{self.base_url}/auth/login"
        payload = {
            "username": username,
            "password": password
        }
        try:
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
            if response.status_code == 200:
                data = response.json()
                # Extraer token. A menudo viene en "token", "accessToken" o directamente.
                token = data.get("token") or data.get("accessToken") or data.get("jwt")
                if token:
                    self.save_token(token)
                    return True, "Login exitoso"
                else:
                    return False, "Token no encontrado en la respuesta"
            elif response.status_code == 401:
                return False, "Credenciales incorrectas"
            else:
                return False, f"Error del servidor: {response.status_code}"
        except Exception as e:
            return False, f"No se pudo conectar al servidor: {str(e)}"

    def fetch_products(self):
        """Descarga todos los productos del tenant desde el backend."""
        url = f"{self.base_url}/api/v1/products/tenant/{self.tenant_id}"
        try:
            response = requests.get(url, headers=self.get_headers(), timeout=5)
            if response.status_code == 200:
                return response.json(), None
            elif response.status_code == 401:
                return None, "Unauthorized"
            else:
                return None, f"Error {response.status_code}"
        except Exception as e:
            return None, str(e)

    def fetch_contacts(self):
        """Descarga todos los contactos/clientes del tenant desde el backend."""
        url = f"{self.base_url}/api/v1/contacts"
        try:
            response = requests.get(url, headers=self.get_headers(), timeout=5)
            if response.status_code == 200:
                return response.json(), None
            elif response.status_code == 401:
                return None, "Unauthorized"
            else:
                return None, f"Error {response.status_code}"
        except Exception as e:
            return None, str(e)

    def create_order(self, order_data):
        """Sube una orden al backend."""
        url = f"{self.base_url}/orders"
        try:
            # Formatear el payload para que coincida exactamente con lo esperado en Spring Boot
            # Spring Boot espera: tenantId, customerId, items, paymentMethod, tax, discount, createdBy
            # Se usan customer_backend_id y product_backend_id para apuntar correctamente al backend
            payload = {
                "tenantId": int(self.tenant_id),
                "companyId": int(self.company_id),
                "customerId": int(order_data['customer_backend_id']) if order_data.get('customer_backend_id') else None,
                "customerName": order_data.get('customer_name') or "Cliente Desconocido",
                "subtotal": float(order_data.get('subtotal', 0)),
                "tax": float(order_data.get('tax', 0)),
                "discount": float(order_data.get('discount', 0)),
                "total": float(order_data.get('total', 0)),
                "items": [
                    {
                        "productId": int(item['product_backend_id']) if item.get('product_backend_id') else int(item['product_id']),
                        "productName": item.get('product_name') or "Producto",
                        "quantity": int(item['quantity']),
                        "unitPrice": float(item.get('price', 0)),
                        "discount": float(item.get('discount', 0)),
                        "subtotal": float(item.get('total', 0))
                    } for item in order_data['items']
                ],
                "paymentMethod": order_data['payment_method'],
                "createdBy": 1
            }
            
            response = requests.post(url, json=payload, headers=self.get_headers(), timeout=5)
            if response.status_code in (200, 201):
                return response.json(), None
            elif response.status_code == 401:
                return None, "Unauthorized"
            else:
                try:
                    err_msg = response.json().get("message", f"Error {response.status_code}")
                except:
                    err_msg = f"Error {response.status_code}"
                return None, err_msg
        except Exception as e:
            return None, str(e)

    def create_invoice_from_order(self, order_id):
        """Genera una factura en la nube a partir de un ID de pedido."""
        url = f"{self.base_url}/invoices/from-order/{order_id}"
        try:
            response = requests.post(url, headers=self.get_headers(), timeout=5)
            if response.status_code in (200, 201):
                return response.json(), None
            elif response.status_code == 401:
                return None, "Unauthorized"
            else:
                try:
                    err_msg = response.json().get("message", f"Error {response.status_code}")
                except:
                    err_msg = f"Error {response.status_code}"
                return None, err_msg
        except Exception as e:
            return None, str(e)
