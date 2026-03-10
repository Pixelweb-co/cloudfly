import time
import logging
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# Configurar logging
log_file = "c:\\apps\\cloudfly\\modules_crud_final.log"
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='w', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuraciones
FRONTEND_URL = "https://dashboard.cloudfly.com.co"
TEST_USER = "manager"
TEST_PASS = "Password123*"
SCREENSHOT_DIR = "c:\\apps\\cloudfly\\screenshots_modules_final"

if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

def take_screenshot(driver, name):
    timestamp = datetime.now().strftime("%H%M%S")
    path = os.path.join(SCREENSHOT_DIR, f"{name}_{timestamp}.png")
    driver.save_screenshot(path)
    logger.info(f"Screenshot guardado: {path}")

def report_browser_logs(driver, stage):
    logger.info(f"---------- LOGS DE CONSOLA [{stage}] ----------")
    try:
        logs = driver.get_log('browser')
        if not logs:
            logger.info("No hay nuevos logs.")
        for entry in logs:
            logger.info(f"[{entry['level']}] {entry['message']}")
    except Exception as e:
        logger.error(f"Error obteniendo logs: {e}")
    logger.info("---------------------------------------------------")

def test_modules_crud():
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
        logger.info("--- FASE 1: LOGIN ---")
        driver.get(f"{FRONTEND_URL}/login")
        wait.until(EC.presence_of_element_located((By.NAME, "username"))).send_keys(TEST_USER)
        driver.find_element(By.NAME, "password").send_keys(TEST_PASS)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Redirección
        time.sleep(5)
        if "login" in driver.current_url or "404" in driver.title:
             driver.get(f"{FRONTEND_URL}/home")
        
        # 2. NAVIGATE TO MODULES
        logger.info("--- FASE 2: LISTAR MODULOS ---")
        driver.get(f"{FRONTEND_URL}/administracion/modules")
        time.sleep(5)
        take_screenshot(driver, "1_list_initial")
        report_browser_logs(driver, "INITIAL")

        # 3. CREATE
        logger.info("--- FASE 3: CREAR MODULO ---")
        wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nuevo Módulo')]"))).click()
        
        module_name = f"Selenium_{datetime.now().strftime('%H%M%S')}"
        module_code = f"SEL{datetime.now().strftime('%M%S')}"
        module_desc = f"Descripción automática para {module_name}"
        
        logger.info(f"Creando: {module_name} con código {module_code}")
        
        # Nombre
        wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Ej. Gestión de Ventas']"))).send_keys(module_name)
        
        # Código
        driver.find_element(By.XPATH, "//input[@placeholder='VENTAS']").send_keys(module_code)
        
        # Descripción
        driver.find_element(By.XPATH, "//textarea[contains(@placeholder, 'Describe')]").send_keys(module_desc)
        
        # Icono (Selecciona el segundo para variar)
        icons = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".MuiGrid-item button")))
        if len(icons) > 1:
            icons[1].click()
            logger.info("Icono alternativo seleccionado.")
            
        # Selección de Menú Padre (si aplica)
        # Esto depende de cómo esté implementado en Cloudfly (Select o Autocomplete)
        # Por ahora lo saltamos si no es reuqerido, pero nos aseguramos que Guardar esté visible.
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        # Click Guardar
        logger.info("Intentando click en Guardar...")
        btn_save = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Guardar') or contains(., 'Crear')]")))
        btn_save.click()
            
        # Esperar la confirmación Toast (Snackbar) de éxito o error
        logger.info("Esperando notificación Toast...")
        try:
            toast = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".MuiSnackbar-root, .go3958317564"))) # go* = react-hot-toast, MuiSnackbar = MUI
            logger.info(f"Notificación recibida: {toast.text}")
        except TimeoutException:
            logger.warning("No apareció Toast notification tras guardar.")
            
        # Esperar que el modal se cierre (o redirect)
        wait.until(EC.invisibility_of_element_located((By.XPATH, "//h2[contains(., 'Crear Módulo') or contains(., 'Nuevo')]")))
        take_screenshot(driver, "3_after_save_success")
        report_browser_logs(driver, "AFTER_SAVE")

        # 4. BUSCAR
        logger.info("--- FASE 4: VERIFICAR ---")
        driver.get(f"{FRONTEND_URL}/administracion/modules") # Forzar recarga si es necesario
        time.sleep(5)
        search = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Buscar módulo...']")))
        search.send_keys(module_name)
        time.sleep(5) # Esperar al debouncer de React
        
        try:
            # Búsqueda más flexible en la tabla
            row_xpath = f"//tr[contains(., '{module_name}')]"
            row = wait.until(EC.presence_of_element_located((By.XPATH, row_xpath)))
            logger.info("¡Modulo encontrado exitosamente!")
            take_screenshot(driver, "4_search_success")
        except TimeoutException:
            logger.warning("No se encontró el módulo tras la espera. Intentando ver si aparece en el DOM...")
            take_screenshot(driver, "4_search_failed")
            raise

        # 5. ACTUALIZAR y VERIFICAR DATOS CARGADOS
        logger.info("--- FASE 5: VERIFICAR Y ACTUALIZAR ---")
        # Selector más agresivo para el botón de editar (usualmente es el primer botón con icono en la fila)
        try:
            edit_btn = row.find_element(By.XPATH, ".//button[.//svg] | .//button[contains(@class, 'MuiButton')] | .//a[contains(@href, 'editar')]")
        except:
            edit_btn = row.find_elements(By.TAG_NAME, "button")[0] # El primero suele ser editar
            
        logger.info(f"Click en botón editar: {edit_btn.text or 'Icono'}")
        try:
            edit_btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", edit_btn)
            
        time.sleep(5) # Buffer para transición de página/modal
            
        # Esperar que carguen los datos
        name_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Ej. Gestión de Ventas']")))
        loaded_code = driver.find_element(By.XPATH, "//input[@placeholder='VENTAS']").get_attribute('value')
        loaded_desc = driver.find_element(By.XPATH, "//textarea[contains(@placeholder, 'Describe')]").get_attribute('value')
        
        logger.info(f"Datos cargados en UI: Nombre='{loaded_name}', Codigo='{loaded_code}', Descripcion='{loaded_desc}'")
        
        if loaded_name != module_name or loaded_code != module_code or loaded_desc != module_desc:
            take_screenshot(driver, "5_loaded_data_mismatch")
            logger.error("¡LOS DATOS GUARDADOS NO COINCIDEN CON LOS CARGADOS!")
        else:
            logger.info("Los datos cargaron perfectamente en la vista de edición.")
            
        # Modificar descripción para el Update
        desc_input = driver.find_element(By.XPATH, "//textarea[contains(@placeholder, 'Describe')]")
        desc_input.clear()
        desc_input.send_keys(f"{module_desc} (Editado)")
        
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        driver.find_element(By.XPATH, "//button[contains(., 'Guardar') or contains(., 'Actualizar')]").click()
        
        try:
            toast = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".MuiSnackbar-root, .go3958317564")))
            logger.info(f"Toast Update: {toast.text}")
        except TimeoutException:
            pass
            
        # Esperar retorno al listado
        wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Buscar módulo...']")))
        
        module_name = f"{module_name} MOD"
        logger.info("Módulo actualizado.")
        report_browser_logs(driver, "AFTER_UPDATE")

        # 6. ELIMINAR
        logger.info("--- FASE 6: ELIMINAR ---")
        search = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Buscar módulo...']")))
        search.clear()
        search.send_keys(module_name)
        time.sleep(2)
        
        row = wait.until(EC.presence_of_element_located((By.XPATH, f"//tr[contains(., '{module_name}')]")))
        row.find_element(By.XPATH, ".//button[contains(@class, 'delete') or .//*[local-name()='svg']]").click()
        time.sleep(2)
        
        wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Eliminar') or contains(., 'Sí')]"))).click()
        time.sleep(5)
        
        logger.info("Módulo eliminado satisfactoriamente.")
        take_screenshot(driver, "5_final_delete")
        report_browser_logs(driver, "FINAL")

        logger.info("--- PRUEBA COMPLETADA EXITOSAMENTE ---")

    except Exception as e:
        logger.error(f"FALLO EN LA PRUEBA: {e}")
        if driver:
            take_screenshot(driver, "crash_final")
            report_browser_logs(driver, "CRASH")
            with open("c:\\apps\\cloudfly\\debug_dom.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
    finally:
        if driver:
            time.sleep(2)
            driver.quit()

if __name__ == "__main__":
    test_modules_crud()
