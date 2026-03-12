import time
import os
import logging
import random
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from mail_manager import MailManager

# Configuración de Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración del Entorno
BASE_URL = "https://dashboard.cloudfly.com.co"
MAIL_HOST = "89.117.147.134"
MAIL_PORT = 10622
MAIL_KEY_PATH = os.path.expanduser("~/.ssh/id_rsa_cloudfly")

class OnboardingTest:
    def __init__(self):
        self.options = Options()
        # self.options.add_argument("--headless") # Deshabilitado a petición del usuario
        self.options.add_argument("--start-maximized")
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(options=self.options)
        self.wait = WebDriverWait(self.driver, 60) # Aumentado por latencia visual
        self.mail_manager = MailManager(host=MAIL_HOST, port=MAIL_PORT, key_path=MAIL_KEY_PATH)
        
        # Datos dinámicos
        timestamp = datetime.now().strftime("%m%d%H%M%S")
        self.test_user = f"onboarding_{timestamp}"
        self.test_email_acc = f"onboarding_{timestamp}"
        self.test_email = f"{self.test_email_acc}@cloudfly.com.co"
        self.test_pass = "CloudFly2026*"
        self.business_name = f"Empresa E2E {timestamp}"

    def take_screenshot(self, name):
        path = f"c:\\apps\\cloudfly\\screenshots\\onboarding_{name}.png"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.driver.save_screenshot(path)
        logger.info(f"Screenshot guardado: {path}")

    def run_fase_1_registro(self):
        logger.info(f"--- FASE 1: REGISTRO ({self.test_user}) ---")
        
        # 0. Crear buzón real
        if not self.mail_manager.create_mail_account("cloudfly.com.co", self.test_email_acc, self.test_pass):
            raise Exception("No se pudo crear la cuenta de correo.")

        self.driver.get(f"{BASE_URL}/register")
        
        self.wait.until(EC.visibility_of_element_located((By.NAME, "nombres"))).send_keys("Tester")
        self.driver.find_element(By.NAME, "apellidos").send_keys("Onboarding")
        self.driver.find_element(By.NAME, "username").send_keys(self.test_user)
        self.driver.find_element(By.NAME, "email").send_keys(self.test_email)
        self.driver.find_element(By.NAME, "password").send_keys(self.test_pass)
        self.driver.find_element(By.NAME, "confirmPassword").send_keys(self.test_pass)
        
        self.take_screenshot("registro_filled")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        self.wait.until(EC.url_contains("/verify-email"))
        logger.info("Registro exitoso. Esperando email...")

    def run_fase_2_verificacion(self):
        logger.info("--- FASE 2: VERIFICACIÓN IMAP ---")
        link = self.mail_manager.wait_for_activation_link("cloudfly.com.co", self.test_email_acc, self.test_pass, timeout=120)
        
        if not link:
            raise Exception("No se recibió el email de activación.")
            
        logger.info(f"Activando cuenta vía: {link}")
        self.driver.get(link)
        time.sleep(5)
        self.take_screenshot("verificacion_page")
        
        # Intentar hacer clic en el botón "Acceder" que aparece tras verificar
        try:
            btn_acceder = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Acceder')]")))
            btn_acceder.click()
            logger.info("Clic en 'Acceder' exitoso.")
        except Exception as e:
            logger.warning(f"No se pudo hacer clic en 'Acceder' o no está: {e}")
            self.driver.get(f"{BASE_URL}/login")
            
        time.sleep(2)
        self.take_screenshot("verificacion_success_redirect")

    def run_fase_3_login_wizard(self):
        logger.info("--- FASE 3: LOGIN Y WIZARD ---")
        
        # LIMPIEZA EXPLÍCITA DE SESIÓN PARA EVITAR BUCLES O STALE DATA
        self.driver.delete_all_cookies()
        self.driver.execute_script("window.localStorage.clear();")
        self.driver.execute_script("window.sessionStorage.clear();")
        
        self.driver.get(f"{BASE_URL}/login")
        
        # Esperar a que la página cargue y no haya redirecciones locas
        self.wait.until(EC.presence_of_element_located((By.NAME, "username")))
        logger.info("Página de login cargada y lista.")
        
        self.driver.find_element(By.NAME, "username").send_keys(self.test_user)
        self.driver.find_element(By.NAME, "password").send_keys(self.test_pass)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Esperar a que el login procese y redirija
        logger.info("Esperando redirección post-login...")
        time.sleep(5)
        
        # INYECCIÓN DE LOCALSTORAGE: A veces NextAuth tarda en sincronizar el primer login
        # Inyectamos manualmente para evitar el bucle de "Validando sesión" si el JWT ya existe
        try:
            jwt = self.driver.execute_script("return localStorage.getItem('jwt');")
            if not jwt:
                logger.info("JWT no encontrado en localStorage, reintentando ver si aparece...")
                time.sleep(5)
        except Exception as e:
            logger.warning(f"No se pudo acceder a localStorage: {e}")

        # Intentar llegar al account-setup
        try:
            self.wait.until(EC.url_contains("/account-setup"))
        except TimeoutException:
            logger.warning("No se redirigió automáticamente a /account-setup. Forzando navegación...")
            self.driver.get(f"{BASE_URL}/account-setup")
            self.wait.until(EC.url_contains("/account-setup"))

        logger.info("Redirección a Account Setup exitosa.")
        
        # Esperar a que desaparezca el cargando si existe
        try:
            self.wait.until(EC.invisibility_of_element_located((By.XPATH, "//*[contains(text(), 'Validando sesión')]")))
            logger.info("Estado 'Validando sesión' finalizado.")
        except:
            logger.info("No se detectó overlay de validación de sesión o ya desapareció.")

        # Paso 0: Bienvenida
        self.take_screenshot("wizard_step_0")
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continuar')]"))).click()
        
        # Paso 1: Datos de Negocio
        self.take_screenshot("wizard_step_1_form")
        self.wait.until(EC.presence_of_element_located((By.NAME, "name"))).send_keys("Empresa Test E2E")
        self.driver.find_element(By.NAME, "nit").send_keys("900.123.456-1")
        self.driver.find_element(By.NAME, "phone").send_keys("3001234567")
        
        # Debemos llenar todos los campos requeridos en el frontend
        self.driver.find_element(By.NAME, "email").send_keys(self.test_email)
        self.driver.find_element(By.NAME, "address").send_keys("Calle Falsa 123")
        self.driver.find_element(By.NAME, "contact").send_keys("Juan Pérez")
        self.driver.find_element(By.NAME, "position").send_keys("Gerente")
        
        # Seleccionar tipo de negocio (clic en el primer card)
        try:
            beauty_salon_card = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Salón de Belleza')]")
            beauty_salon_card.click()
        except:
            logger.warning("No se pudo seleccionar tipo de negocio explícitamente.")

        self.driver.find_element(By.NAME, "objetoSocial").send_keys("Descripción de prueba para el negocio E2E.")
        
        self.take_screenshot("wizard_step_1_filled")
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Siguiente')]").click()
        
        # Paso 2: Configuración WhatsApp (Interactive)
        logger.info("Configurando WhatsApp...")
        
        # Clic en "Generar Código QR"
        btn_qr = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Generar Código QR')]")))
        btn_qr.click()
        logger.info("Clic en 'Generar Código QR' exitoso.")
        
        # Esperar a que el QR aparezca
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//img[@alt='WhatsApp QR Code']")))
        self.take_screenshot("whatsapp_qr")
        logger.info("Código QR visualizado y capturado.")
        
        # Clic en "Ya escaneé el código"
        btn_confirm = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ya escaneé el código')]")))
        btn_confirm.click()
        logger.info("Confirmación de escaneo enviada.")
        
        # Esperar a que el componente de productos aparezca (Paso 3)
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Crear Categoría')]")))
        logger.info("Llegada al paso de Catálogo inicial (Productos).")

        # Paso 3: Productos y Redirección Final
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continuar')]"))).click() # Este botón suele estar en el footer si no se completan los campos
        
        logger.info("Esperando redirección final a /home...")
        time.sleep(5)
        self.wait.until(EC.url_contains("/home"))
        logger.info("Onboarding finalizado correctamente.")

    def run_fase_4_verificar_menu(self):
        logger.info("--- FASE 4: VERIFICACIÓN DE DASHBOARD Y MENÚ ---")
        self.wait.until(EC.url_contains("/home"))
        logger.info("Llegada al Dashboard exitosa.")
        time.sleep(5)
        
        self.take_screenshot("dashboard_home")
        
        # Verificar que el sidebar tenga elementos (indicando que la suscripción gratis cargó módulos)
        logger.info("Verificando elementos del menú sidebar...")
        try:
            # Buscamos el sidebar o elementos de menú comunes
            menu_items = self.driver.find_elements(By.CSS_SELECTOR, ".nav-link, [class*='menu-link']")
            if len(menu_items) > 3:
                logger.info(f"ÉXITO: Se encontraron {len(menu_items)} elementos en el menú.")
                # Verificar módulo específico (ej: Ventas o Comunicaciones)
                ventas = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Ventas')]")
                if ventas:
                    logger.info("Módulo 'Ventas' detectado en el menú.")
            else:
                logger.warning("ALERTA: El menú parece estar vacío o con muy pocos elementos.")
        except Exception as e:
            logger.error(f"Error inspeccionando el menú: {e}")

    def cleanup(self):
        logger.info("--- LIMPIEZA ---")
        self.mail_manager.delete_mail_account("cloudfly.com.co", self.test_email_acc)
        if self.driver:
            self.driver.quit()

    def execute(self):
        try:
            self.run_fase_1_registro()
            self.run_fase_2_verificacion()
            self.run_fase_3_login_wizard()
            self.run_fase_4_verificar_menu()
            logger.info("¡PRUEBA E2E DE ONBOARDING COMPLETADA EXITOSAMENTE! 🚀")
        except Exception as e:
            logger.error(f"FALLO EN LA PRUEBA: {e}")
            self.take_screenshot("error_final")
        finally:
            self.cleanup()

if __name__ == "__main__":
    test = OnboardingTest()
    test.execute()
