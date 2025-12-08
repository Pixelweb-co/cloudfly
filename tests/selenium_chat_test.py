"""
Selenium Test Suite para Chat Omnicanal Cloudfly
Permite ejecutar tests automatizados de la interfaz
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
import time
import json

class ChatTester:
    def __init__(self, base_url="http://localhost:3000", headless=False):
        self.base_url = base_url
        self.driver = None
        self.headless = headless
        
    def setup(self):
        """Inicializar el driver de Chrome"""
        options = Options()
        if self.headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(10)
        
    def teardown(self):
        """Cerrar el navegador"""
        if self.driver:
            self.driver.quit()
            
    def login(self, email="admin@cloudfly.com", password="admin123"):
        """Realizar login"""
        print("🔐 Realizando login...")
        
        self.driver.get(f"{self.base_url}/login")
        
        # Esperar campos de login
        email_field = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        password_field = self.driver.find_element(By.NAME, "password")
        
        # Llenar formulario
        email_field.clear()
        email_field.send_keys(email)
        password_field.clear()
        password_field.send_keys(password)
        
        # Click en submit
        submit_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_button.click()
        
        # Esperar redirección
        time.sleep(2)
        
        # Verificar que estamos logueados
        try:
            WebDriverWait(self.driver, 10).until(
                lambda d: "/login" not in d.current_url
            )
            print("✅ Login exitoso")
            return True
        except TimeoutException:
            print("❌ Login falló")
            return False
            
    def navigate_to_conversations(self):
        """Navegar a la página de conversaciones"""
        print("📱 Navegando a Conversaciones...")
        
        self.driver.get(f"{self.base_url}/comunicaciones/conversaciones")
        
        # Esperar que cargue el Kanban
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h6[contains(text(), 'Leads') or contains(text(), 'LEAD')]"))
            )
            print("✅ Página de conversaciones cargada")
            return True
        except TimeoutException:
            print("❌ No se pudo cargar conversaciones")
            self.driver.save_screenshot("error_conversations.png")
            return False
            
    def verify_kanban_columns(self):
        """Verificar que las 3 columnas del Kanban existan"""
        print("📊 Verificando columnas del Kanban...")
        
        try:
            # Buscar las 3 columnas
            leads_col = self.driver.find_element(By.XPATH, "//h6[contains(text(), 'Leads') or contains(text(), 'LEAD')]")
            potential_col = self.driver.find_element(By.XPATH, "//h6[contains(text(), 'Potencial') or contains(text(), 'POTENTIAL')]")
            client_col = self.driver.find_element(By.XPATH, "//h6[contains(text(), 'Cliente') or contains(text(), 'CLIENT')]")
            
            print("✅ Las 3 columnas están presentes")
            return True
        except Exception as e:
            print(f"❌ Error verificando columnas: {e}")
            return False
            
    def click_first_contact(self):
        """Click en el primer contacto disponible"""
        print("👤 Buscando primer contacto...")
        
        try:
            # Buscar primera card de contacto
            contact_cards = self.driver.find_elements(By.CSS_SELECTOR, ".MuiCard-root")
            
            if len(contact_cards) == 0:
                print("⚠️ No hay contactos disponibles")
                return False
                
            # Click en el primer contacto
            contact_cards[0].click()
            
            # Esperar que abra el drawer
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".MuiDrawer-root"))
            )
            
            print("✅ Chat window abierto")
            return True
        except Exception as e:
            print(f"❌ Error al abrir chat: {e}")
            self.driver.save_screenshot("error_open_chat.png")
            return False
            
    def send_message(self, text="Mensaje de prueba automatizado"):
        """Enviar un mensaje en el chat"""
        print(f"💬 Enviando mensaje: '{text}'")
        
        try:
            # Buscar input de mensaje
            message_input = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "textarea[placeholder*='Escribe']"))
            )
            
            # Escribir mensaje
            message_input.clear()
            message_input.send_keys(text)
            
            time.sleep(0.5)
            
            # Click en botón de enviar
            send_button = self.driver.find_element(By.XPATH, "//button[contains(@class, 'MuiIconButton-root')]//i[contains(@class, 'tabler-send')]/parent::button")
            send_button.click()
            
            # Esperar un momento para que se envíe
            time.sleep(1)
            
            print("✅ Mensaje enviado")
            return True
        except Exception as e:
            print(f"❌ Error enviando mensaje: {e}")
            self.driver.save_screenshot("error_send_message.png")
            return False
            
    def verify_connection_status(self):
        """Verificar el indicador de conexión Socket.IO"""
        print("🔌 Verificando estado de conexión...")
        
        try:
            # Buscar indicador de conexión (círculo verde/rojo)
            status = self.driver.find_element(By.XPATH, "//p[contains(text(), 'Conectado') or contains(text(), 'Desconectado')]")
            status_text = status.text
            
            if "Conectado" in status_text:
                print("✅ Socket.IO conectado")
                return True
            else:
                print("⚠️ Socket.IO desconectado")
                return False
        except Exception as e:
            print(f"❌ Error verificando conexión: {e}")
            return False
            
    def take_screenshot(self, filename="screenshot.png"):
        """Tomar screenshot"""
        self.driver.save_screenshot(filename)
        print(f"📸 Screenshot guardado: {filename}")
        
    def run_full_test(self):
        """Ejecutar suite completa de tests"""
        print("\n" + "="*60)
        print("🚀 INICIANDO TESTS DE CHAT OMNICANAL")
        print("="*60 + "\n")
        
        results = {
            "setup": False,
            "login": False,
            "navigate_conversations": False,
            "verify_kanban": False,
            "verify_connection": False,
            "open_chat": False,
            "send_message": False
        }
        
        try:
            # Setup
            self.setup()
            results["setup"] = True
            
            # Login
            results["login"] = self.login()
            if not results["login"]:
                return results
                
            # Navegar a conversaciones
            results["navigate_conversations"] = self.navigate_to_conversations()
            if not results["navigate_conversations"]:
                return results
                
            # Verificar Kanban
            results["verify_kanban"] = self.verify_kanban_columns()
            
            # Verificar conexión
            results["verify_connection"] = self.verify_connection_status()
            
            # Abrir chat
            results["open_chat"] = self.click_first_contact()
            if not results["open_chat"]:
                return results
                
            # Enviar mensaje
            results["send_message"] = self.send_message()
            
            # Screenshot final
            self.take_screenshot("test_final_success.png")
            
        except Exception as e:
            print(f"\n❌ ERROR CRÍTICO: {e}")
            self.take_screenshot("test_critical_error.png")
        finally:
            self.teardown()
            
        # Reporte final
        print("\n" + "="*60)
        print("📊 RESULTADOS DE LOS TESTS")
        print("="*60)
        
        total_tests = len(results)
        passed_tests = sum(1 for v in results.values() if v)
        
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} - {test_name}")
            
        print(f"\nTotal: {passed_tests}/{total_tests} tests pasaron")
        print("="*60 + "\n")
        
        return results

# Función para ejecutar desde terminal
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Chat Omnicanal')
    parser.add_argument('--url', default='http://localhost:3000', help='Base URL')
    parser.add_argument('--email', default='admin@cloudfly.com', help='Email para login')
    parser.add_argument('--password', default='admin123', help='Password para login')
    parser.add_argument('--headless', action='store_true', help='Ejecutar en modo headless')
    
    args = parser.parse_args()
    
    tester = ChatTester(base_url=args.url, headless=args.headless)
    results = tester.run_full_test()
    
    # Exit code según resultados
    exit(0 if all(results.values()) else 1)
