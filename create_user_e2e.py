import time
import argparse
import logging
import os
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from mail_manager import MailManager

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuraciones
FRONTEND_URL = "https://dashboard.cloudfly.com.co"
MAIL_HOST = "89.117.147.134"
MAIL_PORT = 10622
MAIL_KEY_PATH = os.path.expanduser("~/.ssh/id_rsa_cloudfly")

def create_user(username, password, email):
    options = webdriver.ChromeOptions()
    options.add_argument('--headless') # Ejecución silenciosa
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = None
    mail_manager = MailManager(host=MAIL_HOST, port=MAIL_PORT, key_path=MAIL_KEY_PATH)
    mail_acc = email.split('@')[0]
    
    try:
        # 1. Crear cuenta de correo
        logger.info(f"Creando cuenta de correo {email}...")
        if not mail_manager.create_mail_account("cloudfly.com.co", mail_acc, password):
            logger.error("Error creando cuenta de correo.")
            return False

        # 2. Registro vía Selenium
        logger.info(f"Iniciando registro para {username}...")
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 30)
        
        driver.get(f"{FRONTEND_URL}/register")
        
        wait.until(EC.visibility_of_element_located((By.NAME, "nombres"))).send_keys("User")
        driver.find_element(By.NAME, "apellidos").send_keys("E2E")
        driver.find_element(By.NAME, "username").send_keys(username)
        driver.find_element(By.NAME, "email").send_keys(email)
        driver.find_element(By.NAME, "password").send_keys(password)
        driver.find_element(By.NAME, "confirmPassword").send_keys(password)
        
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        wait.until(EC.url_contains("/verify-email"))
        logger.info("Registro completado. Esperando email...")

        # 3. Verificación IMAP
        activation_link = mail_manager.wait_for_activation_link("cloudfly.com.co", mail_acc, password, timeout=60)
        if not activation_link:
            logger.error("No se recibió el link de activación.")
            return False
            
        logger.info(f"Verificando cuenta vía: {activation_link}")
        driver.get(activation_link)
        time.sleep(3)
        
        logger.info(f"Usuario {username} creado y verificado con éxito.")
        return True

    except Exception as e:
        logger.error(f"Error en creación de usuario: {e}")
        return False
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Crear usuario CloudFly vía E2E flow.')
    parser.add_argument('--username', required=True)
    parser.add_argument('--password', required=True)
    parser.add_argument('--email', required=True)
    
    args = parser.parse_args()
    
    success = create_user(args.username, args.password, args.email)
    if success:
        print("TRUE")
        sys.exit(0)
    else:
        print("FALSE")
        sys.exit(1)
