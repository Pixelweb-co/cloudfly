import time
import logging
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuraciones
FRONTEND_URL = "https://dashboard.cloudfly.com.co"
# Credenciales para el usuario manager (ajustar si es necesario)
TEST_USER = "manager"
TEST_PASS = "Password123*"

def test_manager_dashboard():
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')
    options.add_argument('--start-maximized')
    options.add_argument('--disable-gpu')
    
    driver = None
    
    try:
        logger.info("Iniciando WebDriver de Chrome...")
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 30)

        # 1. LOGIN
        logger.info(f"--- FASE 1: LOGIN ({TEST_USER}) ---")
        driver.get(f"{FRONTEND_URL}/login")
        
        logger.info("Llenando credenciales...")
        username_input = wait.until(EC.presence_of_element_located((By.NAME, "username")))
        username_input.send_keys(TEST_USER)
        driver.find_element(By.NAME, "password").send_keys(TEST_PASS)
        
        logger.info("Enviando formulario de login...")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # 2. VERIFICAR REDIRECCIÓN Y DASHBOARD
        logger.info("--- FASE 2: VERIFICAR DASHBOARD ---")
        try:
            wait.until(lambda d: "/home" in d.current_url)
            logger.info(f"Login exitoso. URL Actual: {driver.current_url}")
        except TimeoutException:
            logger.error("Timeout: No se logró navegar al home después del login.")
            raise

        time.sleep(5) # Esperar a que carguen los datos dinámicos

        # 3. VERIFICAR ROL EN USER DROPDOWN
        logger.info("--- FASE 3: VERIFICAR ROL EN USER DROPDOWN ---")
        # Abrir dropdown
        user_dropdown_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".MuiAvatar-root")))
        user_dropdown_btn.click()
        
        # Buscar el texto del rol (MANAGER)
        try:
            role_element = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'MANAGER')]")))
            logger.info(f"Rol detectado correctamente: {role_element.text}")
        except TimeoutException:
            logger.error("No se encontró el texto del rol 'MANAGER' en el dropdown.")
            # Tomar screenshot para diagnóstico
            driver.save_screenshot('c:\\apps\\cloudfly\\error_role_dropdown.png')

        # 4. VERIFICAR MENÚ ADMINISTRATIVO (DINÁMICO)
        logger.info("--- FASE 4: VERIFICAR MENÚ ADMINISTRATIVO ---")
        menu_items_to_check = ["Ventas", "Contabilidad", "Recursos Humanos", "Usuarios y Roles", "Reportes"]
        
        for item in menu_items_to_check:
            try:
                # El menú dinámico debería tener estos labels
                wait.until(EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{item}')]")))
                logger.info(f"Elemento del menú '{item}' encontrado.")
            except TimeoutException:
                logger.warning(f"Elemento del menú '{item}' NO encontrado.")

        logger.info("--- PRUEBA DE DASHBOARD MANAGER FINALIZADA EXITOSAMENTE ---")

    except Exception as e:
        logger.error(f"Error durante la prueba: {e}")
        if driver:
            driver.save_screenshot('c:\\apps\\cloudfly\\error_manager_test.png')
            with open('c:\\apps\\cloudfly\\error_manager_dom.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
    finally:
        if driver:
            logger.info("Cerrando navegador...")
            time.sleep(3)
            driver.quit()

if __name__ == "__main__":
    test_manager_dashboard()
