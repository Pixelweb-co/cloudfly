import time
import logging
import os
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

# Configuraciones
FRONTEND_URL = "https://dashboard.cloudfly.com.co"
TEST_USER = "manager"
TEST_PASS = "Password123*"
SCREENSHOT_DIR = "c:\\apps\\cloudfly\\screenshots"

if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

def take_screenshot(driver, name):
    timestamp = datetime.now().strftime("%H%M%S")
    path = os.path.join(SCREENSHOT_DIR, f"{name}_{timestamp}.png")
    driver.save_screenshot(path)
    logger.info(f"Screenshot guardado: {path}")

def print_browser_logs(driver):
    logger.info("--- LOGS DE CONSOLA DEL NAVEGADOR ---")
    try:
        logs = driver.get_log('browser')
        for entry in logs:
            logger.info(f"[{entry['level']}] {entry['message']}")
    except Exception as e:
        logger.error(f"Error obteniendo logs: {e}")

def test_manager_dashboard_v3():
    options = webdriver.ChromeOptions()
    options.add_argument('--start-maximized')
    options.add_argument('--disable-gpu')
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    
    driver = None
    
    try:
        logger.info("Iniciando WebDriver de Chrome...")
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 30)

        # 1. LOGIN
        logger.info(f"--- FASE 1: LOGIN ({TEST_USER}) ---")
        driver.get(f"{FRONTEND_URL}/login")
        time.sleep(2)
        take_screenshot(driver, "1_login_page")
        
        logger.info("Llenando credenciales...")
        username_input = wait.until(EC.presence_of_element_located((By.NAME, "username")))
        username_input.send_keys(TEST_USER)
        driver.find_element(By.NAME, "password").send_keys(TEST_PASS)
        
        take_screenshot(driver, "2_login_filled")
        logger.info("Enviando formulario de login...")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # 2. DASHBOARD
        logger.info("--- FASE 2: VERIFICAR DASHBOARD ---")
        try:
            wait.until(lambda d: "/home" in d.current_url)
            logger.info(f"Login exitoso: {driver.current_url}")
        except TimeoutException:
            logger.error("Timeout: No se redirigió al home.")
            print_browser_logs(driver)
            take_screenshot(driver, "error_login_timeout")
            raise

        time.sleep(8) # Esperar carga completa
        take_screenshot(driver, "3_dashboard_home")
        print_browser_logs(driver)

        # 3. USER DROPDOWN (ROLE)
        logger.info("--- FASE 3: VERIFICAR ROL EN DROPDOWN ---")
        user_dropdown_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".MuiAvatar-root")))
        user_dropdown_btn.click()
        time.sleep(1)
        take_screenshot(driver, "4_user_dropdown")
        
        try:
            # Buscando el rol MANAGER o ADMIN
            role_found = False
            for r in ["MANAGER", "ADMIN", "SUPERADMIN"]:
                try:
                    el = driver.find_element(By.XPATH, f"//*[contains(text(), '{r}')]")
                    logger.info(f"Rol detectado en pantalla: {el.text}")
                    role_found = True
                    break
                except:
                    continue
            
            if not role_found:
                 logger.warning("No se visualizó el rol esperado en el dropdown.")
        except Exception as e:
            logger.error(f"Error verificando rol: {e}")

        # 4. MENÚ DINÁMICO
        logger.info("--- FASE 4: VERIFICAR MENÚ ---")
        menu_items = ["Ventas", "Contabilidad", "Recursos Humanos", "Usuarios y Roles", "Reportes"]
        for item in menu_items:
            try:
                # Ajuste de XPath para ser más específico al menú lateral si es necesario
                wait.until(EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{item}')]")))
                logger.info(f"Elemento del menú '{item}' visible.")
            except TimeoutException:
                logger.warning(f"Elemento del menú '{item}' NO encontrado.")

        take_screenshot(driver, "5_final_state")
        logger.info("--- PRUEBA FINALIZADA ---")

    except Exception as e:
        logger.error(f"Error crítico: {e}")
        if driver:
            take_screenshot(driver, "crash_error")
            print_browser_logs(driver)
    finally:
        if driver:
            time.sleep(2)
            driver.quit()

if __name__ == "__main__":
    test_manager_dashboard_v3()
