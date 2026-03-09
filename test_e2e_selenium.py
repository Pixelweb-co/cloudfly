import time
import subprocess
import random
import logging
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from mail_manager import MailManager

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuraciones
FRONTEND_URL = "http://localhost:3000"
BACKEND_HOST = "109.205.182.94"
DB_USER = "root"
DB_PASS = "widowmaker"

# Configuración Mail VPS (HestiaCP)
MAIL_HOST = "cloudfly.com.co"
MAIL_PORT = 10622
MAIL_KEY_PATH = os.path.expanduser("~/.ssh/id_rsa_cloudfly")

def run_e2e_test():
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless') # Descomentar para ejecutar en modo oculto
    options.add_argument('--start-maximized')
    options.add_argument('--disable-gpu')
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL', 'performance': 'ALL'})
    
    driver = None
    mail_manager = MailManager(host=MAIL_HOST, port=MAIL_PORT, key_path=MAIL_KEY_PATH)
    
    # Datos de prueba dinámicos
    timestamp = datetime.now().strftime('%m%d%H%M%S')
    test_user = f"e2e_user_{timestamp}"
    mail_acc = f"e2e_{timestamp}"
    test_email = f"{mail_acc}@cloudfly.com.co"
    test_pass = "Password123*"

    try:
        # 0. PREPARAR CORREO REAL
        logger.info(f"--- FASE 0: PREPARAR CORREO ({test_email}) ---")
        if not mail_manager.create_mail_account("cloudfly.com.co", mail_acc, test_pass):
            raise Exception("No se pudo crear la cuenta de correo en HestiaCP.")

        logger.info("Iniciando WebDriver de Chrome...")
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 30)

        # 1. REGISTRO
        logger.info(f"--- FASE 1: REGISTRO ({test_user}) ---")
        driver.get(f"{FRONTEND_URL}/register")
        time.sleep(5)
        
        logger.info("Llenando formulario de registro...")
        nombres_input = wait.until(EC.visibility_of_element_located((By.NAME, "nombres")))
        nombres_input.clear()
        nombres_input.send_keys("Usuario")
        
        apellidos_input = driver.find_element(By.NAME, "apellidos")
        apellidos_input.clear()
        apellidos_input.send_keys("E2E")
        
        username_input = driver.find_element(By.NAME, "username")
        username_input.clear()
        username_input.send_keys(test_user)
        
        email_input = driver.find_element(By.NAME, "email")
        email_input.clear()
        email_input.send_keys(test_email)
        
        pass_input = driver.find_element(By.NAME, "password")
        pass_input.clear()
        pass_input.send_keys(test_pass)
        
        confirm_input = driver.find_element(By.NAME, "confirmPassword")
        confirm_input.clear()
        confirm_input.send_keys(test_pass)
        
        logger.info("Enviando formulario de registro...")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        try:
            # Esperar la redirección a verify-email
            WebDriverWait(driver, 20).until(EC.url_contains("/verify-email"))
            logger.info("Registro exitoso. Esperando email de activación...")
        except TimeoutException:
            logger.error("Timeout esperando redirección tras registro.")
            raise

        # 2. VERIFICACION POR EMAIL REAL
        logger.info("--- FASE 2: VERIFICACION POR EMAIL ---")
        activation_link = mail_manager.wait_for_activation_link("cloudfly.com.co", mail_acc, timeout=90)
        
        if not activation_link:
            raise Exception("No se recibió el correo de activación a tiempo.")
        
        logger.info(f"Navegando al link de activación: {activation_link}")
        # El link apunta a dashboard.cloudfly.com.co, pero para el test local usamos FRONTEND_URL
        if "dashboard.cloudfly.com.co" in activation_link:
            local_activation_link = activation_link.replace("https://dashboard.cloudfly.com.co", FRONTEND_URL)
            logger.info(f"Ajustando link para entorno local: {local_activation_link}")
            driver.get(local_activation_link)
        else:
            driver.get(activation_link)
            
        time.sleep(5)
        logger.info("Verificación completada.")

        # 3. LOGIN
        logger.info("--- FASE 3: LOGIN ---")
        driver.get(f"{FRONTEND_URL}/login")
        time.sleep(2)
        
        logger.info("Llenando credenciales...")
        wait.until(EC.presence_of_element_located((By.NAME, "username"))).send_keys(test_user)
        driver.find_element(By.NAME, "password").send_keys(test_pass)
        
        logger.info("Enviando formulario de login...")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # 4. ACCOUNT SETUP
        logger.info("--- FASE 4: ACCOUNT SETUP ---")
        try:
            wait.until(EC.url_contains("/account-setup"))
            logger.info("Login exitoso. Redirigido a Account Setup (Onboarding).")
            
            # Verificamos que se renderice el wizard
            setup_title = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Bienvenido a CloudFly!')]")))
            logger.info(f"Setup Wizard detectado: '{setup_title.text}'")
            
            # Clicar en Siguiente (Continuar)
            logger.info("Avanzando al paso 'Tu Negocio' en el Setup...")
            continuar_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continuar')]")))
            continuar_btn.click()
            time.sleep(2)
            
            # Verificar paso 2
            business_title = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Información de tu Negocio')]")))
            logger.info("Paso 2 detectado exitosamente.")
            
            logger.info("--- PRUEBA E2E COMPLETADA CON EXITO (FULL OK) ---")
            
        except TimeoutException:
            logger.error("Timeout: No se logró llegar a /account-setup después del login.")
            logger.error(f"URL Actual: {driver.current_url}")
            raise

    except Exception as e:
        logger.error(f"Error durante la prueba E2E: {e}")
        if driver:
            try:
                # Extraer logs de la consola del navegador
                browser_logs = driver.get_log('browser')
                if browser_logs:
                    logger.error("--- LOGS DE LA CONSOLA DEL NAVEGADOR ---")
                    for log in browser_logs:
                        logger.error(f"Navegador: [{log['level']}] {log['message']}")
                else:
                    logger.info("No hay logs en la consola del navegador.")
            except Exception as log_e:
                logger.error(f"Error extrayendo logs del navegador: {log_e}")
                
            try:
                # Captura para diagnóstico
                path_img = 'c:\\apps\\cloudfly\\error_e2e.png'
                path_html = 'c:\\apps\\cloudfly\\error_dom.html'
                driver.save_screenshot(path_img)
                with open(path_html, 'w', encoding='utf-8') as f:
                    f.write(driver.page_source)
                logger.info(f"Screenshot guardado en {path_img}")
                logger.info(f"DOM guardado en {path_html}")
            except Exception as inner_e:
                logger.error(f"Error al guardar captura: {inner_e}")
    finally:
        # LIMPIEZA
        logger.info("--- FASE 5: LIMPIEZA ---")
        try:
            mail_manager.delete_mail_account("cloudfly.com.co", mail_acc)
            logger.info(f"Cuenta de correo {test_email} eliminada.")
        except Exception as clean_e:
            logger.error(f"Error durante la limpieza de correo: {clean_e}")
            
        if driver:
            logger.info("Cerrando navegador en 5 segundos...")
            time.sleep(5)
            driver.quit()

if __name__ == "__main__":
    run_e2e_test()
