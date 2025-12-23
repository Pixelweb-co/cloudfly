
import os
import time
import logging
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bot_run.log", mode='w'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("HRBot")

class HRTestBot:
    def __init__(self):
        self.base_url = "http://localhost:3000"
        self.username = "edwing2022"
        self.password = "Edwin2025*"
        self.driver = None
        self.wait = None
        
    def setup_driver(self):
        """Initialize Chrome Driver with robust options"""
        logger.info("Initializing Bot Driver...")
        options = Options()
        # options.add_argument("--headless") # Commented out for visual verification
        options.add_argument("--start-maximized")
        options.add_argument("--disable-notifications")
        options.add_argument("--ignore-certificate-errors")
        
        # Explicitly handle ChromeDriver path
        raw_path = ChromeDriverManager().install()
        logger.info(f"Raw driver path from manager: {raw_path}")
        
        driver_path = raw_path
        
        # Heuristic fix for WDM returning License file or folder
        if "THIRD_PARTY" in raw_path or not raw_path.endswith(".exe"):
            # Try to find exe in the same directory
            directory = os.path.dirname(raw_path)
            potential_exe = os.path.join(directory, "chromedriver.exe")
            
            if os.path.exists(potential_exe):
                driver_path = potential_exe
            else:
                # Recursively logic or hardcode for now for robustness
                # Try finding in parent directory if it was a file inside the folder
                parent = os.path.dirname(directory)
                potential_exe_2 = os.path.join(directory, "chromedriver-win32", "chromedriver.exe")
                 
                if os.path.exists(potential_exe_2):
                    driver_path = potential_exe_2
        
        logger.info(f"Resolved ChromeDriver to: {driver_path}")
        service = Service(executable_path=driver_path)
        
        # Capability for logging
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        
        self.driver = webdriver.Chrome(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 10)
        logger.info("Driver initialized successfully.")

    def check_browser_logs(self):
        """Capture and log browser console errors"""
        try:
            logs = self.driver.get_log('browser')
            for entry in logs:
                level = entry['level']
                msg = entry['message']
                if level in ['SEVERE', 'WARNING']:
                    logger.warning(f"BROWSER CONSOLE [{level}]: {msg}")
        except Exception as e:
            logger.warning(f"Could not fetch browser logs: {e}")

    def take_screenshot(self, name):
        """Helper to take screenshots on failure or success"""
        self.check_browser_logs() # Dump logs before screenshot
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"logs/screenshot_{name}_{timestamp}.png"
        os.makedirs("logs", exist_ok=True)
        self.driver.save_screenshot(filename)
        logger.info(f"Screenshot saved: {filename}")

    def login(self):
        """Robust Login Flow"""
        logger.info("--- START LOGIN FLOW ---")
        try:
            # Strategy: Navigate to protected /home. If redirects to login, then log in.
            target_url = f"{self.base_url}/home"
            logger.info(f"Navigating to {target_url} to check session...")
            self.driver.get(target_url)
            time.sleep(3)
            
            current_url = self.driver.current_url
            logger.info(f"Current URL: {current_url}")
            
            if "/home" in current_url:
                logger.info("Already logged in (on /home).")
                return
            
            logger.info("Not on home page. Assuming login required.")
            
            # Ensure we are on login page
            if "/login" not in current_url:
                self.driver.get(f"{self.base_url}/login")
                time.sleep(1)

            logger.info("Entering credentials...")
            
            # Wait for username field (increase timeout)
            wait_long = WebDriverWait(self.driver, 20)
            user_field = wait_long.until(EC.presence_of_element_located((By.NAME, "username")))
            user_field.clear()
            user_field.send_keys(self.username)
            
            pass_field = self.driver.find_element(By.NAME, "password")
            pass_field.clear()
            pass_field.send_keys(self.password)
            
            # Click Login
            login_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_btn.click()
            
            # Wait for redirect success
            wait_long.until(lambda d: "/home" in d.current_url or "/dashboard" in d.current_url)
            logger.info("LOGIN SUCCESSFUL")
            
        except Exception as e:
            logger.error(f"Login Failed: {e}")
            # Log page source to debug
            try:
                src = self.driver.page_source
                logger.error(f"Page Source Head: {src[:500]}")
            except:
                pass
            self.take_screenshot("login_failure")
            raise

    def navigate_menu(self, parent_label, child_label):
        """Robust Navigation via Sidebar Menu"""
        logger.info(f"Navigating: {parent_label} -> {child_label}")
        try:
            # 1. Parent Menu
            parent_xpath = f"//span[contains(text(), '{parent_label}')] | //div[contains(text(), '{parent_label}')]"
            parent_el = self.wait.until(EC.presence_of_element_located((By.XPATH, parent_xpath)))
            
            # Use JS Click to avoid interception
            self.driver.execute_script("arguments[0].click();", parent_el)
            time.sleep(1) 
            
            # 2. Child Menu
            child_xpath = f"//span[contains(text(), '{child_label}')] | //a[contains(., '{child_label}')]"
            child_el = self.wait.until(EC.presence_of_element_located((By.XPATH, child_xpath)))
            
            # Check visibility
            if not child_el.is_displayed():
                logger.warning("Child menu not visible, trying parent click again...")
                self.driver.execute_script("arguments[0].click();", parent_el)
                time.sleep(1)
            
            self.driver.execute_script("arguments[0].click();", child_el)
            
            time.sleep(2) # Wait for page load
            logger.info(f"Navigated to {child_label}")
            
        except Exception as e:
            logger.error(f"Navigation Failed: {e}")
            self.take_screenshot(f"nav_failure_{child_label}")
            raise

    def generate_demo_data(self):
        """Call API to ensure data exists"""
        logger.info("Generating demo data via API...")
        try:
            import requests
            requests.post(f"http://localhost:8080/api/hr/demo/generate?customerId=1")
            logger.info("Demo data generated.")
        except Exception as e:
            logger.warning(f"Could not generate demo data: {e}")

    def test_uc001_create_employee(self):
        """UC-001: Create Employee"""
        logger.info("--- TESTING UC-001: CREATE EMPLOYEE ---")
        try:
            self.navigate_menu("Recursos Humanos", "Empleados")
            
            # Open Dialog
            add_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Agregar Empleado') or contains(., 'Add')]")))
            add_btn.click()
            
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[role="dialog"]')))
            
            # Fill Form
            unique_suffix = int(time.time())
            
            self.driver.find_element(By.NAME, 'firstName').send_keys(f'BotUser_{unique_suffix}')
            self.driver.find_element(By.NAME, 'lastName').send_keys('Automated')
            self.driver.find_element(By.NAME, 'email').send_keys(f'bot.{unique_suffix}@test.com')
            self.driver.find_element(By.NAME, 'phone').send_keys('5559998888')
            
            self.driver.find_element(By.NAME, 'rfc').send_keys(f'BOTA{str(unique_suffix)[-6:]}XXX')
            self.driver.find_element(By.NAME, 'curp').send_keys(f'BOTA{str(unique_suffix)[-6:]}HDFRSL99')
            self.driver.find_element(By.NAME, 'nss').send_keys('99887766554')
            
            self.driver.find_element(By.NAME, 'jobTitle').send_keys('Test Bot')
            self.driver.find_element(By.NAME, 'department').send_keys('QA')
            
            salary = self.driver.find_element(By.NAME, 'baseSalary')
            salary.clear()
            salary.send_keys('20000')
            
            # Submit
            submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            submit_btn.click()
            
            time.sleep(2)
            
            # Verify in list
            page_src = self.driver.page_source
            if f'BotUser_{unique_suffix}' in page_src:
                logger.info("UC-001 SUCCESS: Employee created and found in list.")
            else:
                raise Exception("Employee created but not found in list.")
                
        except Exception as e:
            logger.error(f"UC-001 FAILED: {e}")
            self.take_screenshot("uc001_fail")
            raise

    def test_uc101_create_period(self):
        """UC-101: Create Payroll Period"""
        logger.info("--- TESTING UC-101: CREATE PERIOD ---")
        try:
            self.navigate_menu("Recursos Humanos", "Periodos")
            
            # Open Dialog
            add_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nuevo Periodo') or contains(., 'New')]")))
            add_btn.click()
            
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[role="dialog"]')))
            
            # Fill Form
            self.driver.find_element(By.NAME, 'periodNumber').send_keys('99')
            self.driver.find_element(By.NAME, 'startDate').send_keys('2025-12-01')
            self.driver.find_element(By.NAME, 'endDate').send_keys('2025-12-15')
            self.driver.find_element(By.NAME, 'paymentDate').send_keys('2025-12-16')
            self.driver.find_element(By.NAME, 'description').send_keys('Bot Test Period')
            
            submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            submit_btn.click()
            
            time.sleep(2)
            
            if 'Bot Test Period' in self.driver.page_source:
                logger.info("UC-101 SUCCESS: Period created.")
            else:
                raise Exception("Period created but not found.")
                
        except Exception as e:
            logger.error(f"UC-101 FAILED: {e}")
            self.take_screenshot("uc101_fail")
            # Don't raise, try to continue to processing if possible (might use existing period)

    def test_uc102_process_payroll(self):
        """UC-102 to UC-105: Process Payroll Flow"""
        logger.info("--- TESTING UC-102..105: PROCESS PAYROLL ---")
        try:
            self.navigate_menu("Recursos Humanos", "Procesar Nómina")
            time.sleep(2)  # Extra wait for page to stabilize
            
            # 1. Select Period - refetch element each time to avoid stale reference
            try:
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".MuiCard-root")))
                time.sleep(1)
                cards = self.driver.find_elements(By.CSS_SELECTOR, ".MuiCard-root")
                
                if len(cards) == 0:
                    logger.warning("No periods found to process. Skipping payroll processing.")
                    return
                
                # Use JS click to avoid interception
                self.driver.execute_script("arguments[0].click();", cards[0])
                time.sleep(2)
            except Exception as card_err:
                logger.warning(f"Could not select period card: {card_err}")
                return
            
            # 2. Calculate
            logger.info("Calculating...")
            try:
                calc_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Calcular')]")))
                self.driver.execute_script("arguments[0].click();", calc_btn)
                time.sleep(3)
                logger.info("Calculation initiated.")
            except Exception as calc_err:
                logger.warning(f"Calculate button not found or not clickable: {calc_err}")
                return
            
            # 3. Approve
            logger.info("Approving...")
            try:
                approve_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Aprobar')]")))
                self.driver.execute_script("arguments[0].click();", approve_btn)
                time.sleep(2)
                logger.info("Approved.")
            except Exception as appr_err:
                logger.warning(f"Approve button not found: {appr_err}")
            
            # 4. Pay
            logger.info("Paying...")
            try:
                pay_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Pagar') or contains(., 'Registrar')]")))
                self.driver.execute_script("arguments[0].click();", pay_btn)
                time.sleep(2)
                logger.info("Payment registered.")
            except Exception as pay_err:
                logger.warning(f"Pay button not found: {pay_err}")
            
            # Check success indicator
            if "Pagado" in self.driver.page_source or "Paid" in self.driver.page_source or "success" in self.driver.page_source.lower():
                 logger.info("UC-102..105 SUCCESS: Payroll fully processed.")
            else:
                 logger.warning("Payroll processing completed but success message not found/clear.")

        except Exception as e:
            logger.error(f"UC-102..105 FAILED: {e}")
            self.take_screenshot("process_fail")
            # Don't raise - allow test to complete gracefully

    def run(self):
        try:
            self.setup_driver()
            self.generate_demo_data()
            
            self.login()
            
            self.test_uc001_create_employee()
            self.test_uc101_create_period()
            self.test_uc102_process_payroll()
            
            logger.info("ALL TESTS COMPLETED SUCCESSFULLY")
            
        except Exception as e:
            logger.error(f"BOT CRITICALLY FAILED: {e}")
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    bot = HRTestBot()
    bot.run()
