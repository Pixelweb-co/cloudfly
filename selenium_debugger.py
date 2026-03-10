import argparse
import time
import logging
import os
import sys
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CloudFlyDebugger:
    def __init__(self, user_data_dir=None, headless=False):
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--start-maximized')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        if user_data_dir:
            if not os.path.exists(user_data_dir):
                os.makedirs(user_data_dir)
            options.add_argument(f'--user-data-dir={user_data_dir}')
            logger.info(f"Usando directorio de datos de usuario: {user_data_dir}")

        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.wait = WebDriverWait(self.driver, 15)
            logger.info("WebDriver iniciado correctamente.")
        except Exception as e:
            logger.error(f"Error al iniciar WebDriver: {e}")
            sys.exit(1)

        self.report_dir = "c:\\apps\\cloudfly\\debug_reports"
        if not os.path.exists(self.report_dir):
            os.makedirs(self.report_dir)

    def execute_action(self, action, **kwargs):
        logger.info(f"Ejecutando acción: {action}")
        try:
            if action == 'navigate':
                self.navigate(kwargs.get('url'))
            elif action == 'login':
                self.login(kwargs.get('user'), kwargs.get('password'))
            elif action == 'login_and_check':
                self.login(kwargs.get('user'), kwargs.get('password'))
                self.check_modules_list()
            elif action == 'dump_dom':
                self.dump_dom(kwargs.get('name', 'dom_dump'))
            elif action == 'check_modules':
                self.check_modules_list()
            elif action == 'screenshot':
                self.take_screenshot(kwargs.get('name', 'manual_shot'))
            elif action == 'get_logs':
                self.extract_logs()
            else:
                logger.error(f"Acción desconocida: {action}")
        except Exception as e:
            logger.error(f"Falla en acción {action}: {e}")
            self.take_screenshot(f"error_{action}")
            self.dump_dom(f"error_{action}")

    def navigate(self, url):
        logger.info(f"Navegando a {url}...")
        self.driver.get(url)
        time.sleep(3)
        logger.info(f"URL actual: {self.driver.current_url}")

    def login(self, user, password):
        self.driver.get("https://dashboard.cloudfly.com.co/login")
        try:
            u_input = self.wait.until(EC.presence_of_element_located((By.NAME, "username")))
            u_input.clear()
            u_input.send_keys(user)
            p_input = self.driver.find_element(By.NAME, "password")
            p_input.clear()
            p_input.send_keys(password)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            # Esperar a home o dashboard
            self.wait.until(lambda d: "/home" in d.current_url or "/dashboard" in d.current_url or "/dash" in d.current_url)
            logger.info("Login exitoso (URL cambiada). Esperando escritura de token...")
            time.sleep(5)
        except TimeoutException:
            logger.warning("Timeout esperando redirección. ¿Ya estabas logueado?")
            if "/login" not in self.driver.current_url:
                logger.info("Parece que ya hay una sesión activa.")
            else:
                raise

    def check_modules_list(self):
        self.driver.get("https://dashboard.cloudfly.com.co/administracion/modules")
        time.sleep(5)
        self.extract_logs()
        
        # Verificar si hay error 500 visible o spinner infinito
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        if "500" in body_text or "Error" in body_text:
            logger.error("Error detectado en la UI al cargar módulos.")
        
        self.take_screenshot("view_modules")
        self.dump_dom("view_modules")

    def take_screenshot(self, name):
        timestamp = datetime.now().strftime("%H%M%S")
        path = os.path.join(self.report_dir, f"{name}_{timestamp}.png")
        self.driver.save_screenshot(path)
        logger.info(f"Screenshot: {path}")

    def dump_dom(self, name):
        timestamp = datetime.now().strftime("%H%M%S")
        path = os.path.join(self.report_dir, f"{name}_{timestamp}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.driver.page_source)
        logger.info(f"DOM Dump: {path}")

    def extract_logs(self):
        try:
            logs = self.driver.get_log('browser')
            logger.info(f"--- BROWSER LOGS ({len(logs)}) ---")
            for entry in logs:
                level = entry['level']
                msg = entry['message']
                if level == 'SEVERE':
                    print(f"\033[91m[{level}] {msg}\033[0m")
                else:
                    print(f"[{level}] {msg}")
            
            log_file = os.path.join(self.report_dir, f"logs_{datetime.now().strftime('%H%M%S')}.json")
            with open(log_file, "w") as f:
                json.dump(logs, f)
        except Exception as e:
            logger.warning(f"No se pudieron extraer logs: {e}")

    def close(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', required=True, choices=['navigate', 'login', 'login_and_check', 'check_modules', 'dump_dom', 'screenshot', 'get_logs'])
    parser.add_argument('--url', help='URL para navigate')
    parser.add_argument('--user', default="manager", help='Usuario para login')
    parser.add_argument('--password', default="Password123*", help='Password para login')
    parser.add_argument('--session_dir', default="c:\\apps\\cloudfly\\selenium_session", help='Directorio para sesión persistente')
    parser.add_argument('--no_close', action='store_true', help='No cerrar el navegador al terminar')
    
    args = parser.parse_args()
    logger.info(f"Argumentos recibidos: {args}")
    
    debugger = CloudFlyDebugger(user_data_dir=args.session_dir)
    try:
        kwargs = vars(args)
        debugger.execute_action(**kwargs)
        
        if args.no_close:
            logger.info("Navegador abierto. Presiona Ctrl+C para cerrar.")
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        if not args.no_close:
            debugger.close()
