import argparse
import time
import logging
import os
import sys
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SeleniumDebugger:
    def __init__(self, headless=False):
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--start-maximized')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 20)
        self.screenshot_dir = "c:\\apps\\cloudfly\\debug_reports"
        if not os.path.exists(self.screenshot_dir):
            os.makedirs(self.screenshot_dir)

    def navigate_and_report(self, url):
        logger.info(f"Navegando a: {url}")
        try:
            self.driver.get(url)
            time.sleep(5)  # Tiempo para carga inicial
            self.take_screenshot("navigation_start")
            self.extract_console_logs()
            
            logger.info(f"URL Actual: {self.driver.current_url}")
            logger.info(f"Título: {self.driver.title}")
            
        except Exception as e:
            logger.error(f"Error navegando: {e}")
            self.take_screenshot("navigation_error")

    def take_screenshot(self, name):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        path = os.path.join(self.screenshot_dir, filename)
        self.driver.save_screenshot(path)
        logger.info(f"Screenshot guardado: {path}")
        return path

    def extract_console_logs(self):
        logger.info("--- EXTRAYENDO LOGS DE CONSOLA ---")
        try:
            logs = self.driver.get_log('browser')
            if not logs:
                logger.info("No se encontraron logs en la consola.")
                return
            
            for entry in logs:
                msg = f"[{entry['level']}] {entry['message']}"
                logger.info(msg)
                
            # Guardar logs en archivo
            log_file = os.path.join(self.screenshot_dir, f"console_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            with open(log_file, 'w', encoding='utf-8') as f:
                import json
                json.dump(logs, f, indent=2)
            logger.info(f"Logs guardados en: {log_file}")
            
        except Exception as e:
            logger.error(f"Error al extraer logs: {e}")

    def interactive_login(self, username, password):
        try:
            logger.info(f"Intentando login como: {username}")
            self.driver.get("https://dashboard.cloudfly.com.co/login")
            
            u_input = self.wait.until(EC.presence_of_element_located((By.NAME, "username")))
            u_input.send_keys(username)
            self.driver.find_element(By.NAME, "password").send_keys(password)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            self.wait.until(lambda d: "/home" in d.current_url)
            logger.info("Login exitoso.")
            time.sleep(5)
            
            # Extraer y decodificar JWT
            token = self.driver.execute_script("return localStorage.getItem('jwt')")
            if token:
                logger.info("JWT extraído de localStorage.")
                try:
                    # Decodificación simple base64 para el payload
                    import base64
                    payload = token.split('.')[1]
                    # Padding for base64
                    payload += '=' * (-len(payload) % 4)
                    decoded = base64.b64decode(payload).decode('utf-8')
                    logger.info(f"Payload del JWT: {decoded}")
                except Exception as de:
                    logger.error(f"Error decodificando JWT: {de}")
            else:
                logger.warning("No se encontró JWT en localStorage")

            self.take_screenshot("after_login")
            self.extract_console_logs()
        except Exception as e:
            logger.error(f"Falla en login: {e}")
            self.take_screenshot("login_failure")
            self.extract_console_logs()

    def close(self):
        if self.driver:
            logger.info("Cerrando sesión de debugger.")
            self.driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='CloudFly Selenium Debugger Tool')
    parser.add_argument('--url', default="https://dashboard.cloudfly.com.co", help='URL to inspect')
    parser.add_argument('--login_user', help='Username for auto-login')
    parser.add_argument('--login_pass', help='Password for auto-login')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    
    args = parser.parse_args()
    
    debugger = SeleniumDebugger(headless=args.headless)
    try:
        if args.login_user and args.login_pass:
            debugger.interactive_login(args.login_user, args.login_pass)
            if args.url != "https://dashboard.cloudfly.com.co":
                debugger.navigate_and_report(args.url)
        else:
            debugger.navigate_and_report(args.url)
            
        logger.info("Ejecución de debugger completada. Revisa el directorio debug_reports/")
    finally:
        debugger.close()
