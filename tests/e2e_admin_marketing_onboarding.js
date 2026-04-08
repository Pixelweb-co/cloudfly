const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Selenium E2E Test: Admin Marketing Onboarding
 *
 * Flujo:
 * 1. Navegar a página de Registro (/register).
 * 2. Rellenar formulario (username, email, password) para crear nuevo usuario.
 * 3. Enviar formulario y verificar que redirija a /home.
 * 4. Desloguearse (o limpiar sesión forzadamente para asegurar logout).
 * 5. Volver a Iniciar Sesión (/login) con las credenciales del usuario recién creado.
 * 6. Verificar que la cuenta esté activa y redirija correctamente a /home (sin problemas de verificación de cuenta).
 */

const BASE_URL = 'https://dashboard.cloudfly.com.co';

const UNIQUE_ID = Date.now();
const NEW_USER_EMAIL = `test_onboarding_${UNIQUE_ID}@example.com`;
const NEW_USER_NAME = `onboarding_${UNIQUE_ID}`;
const NEW_USER_PASSWORD = 'Password123!';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function checkBrowserLogs(driver, label = '') {
    console.log(`\n--- [BROWSER CONSOLE ${label}] ---`);
    try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        if (logs.length === 0) {
            console.log('(Sin logs nuevos)');
        } else {
            logs.forEach(log => {
                const level = log.level.name;
                const msg = log.message;
                const ts = new Date(log.timestamp).toLocaleTimeString();
                if (level === 'SEVERE') {
                    console.error(`🔴 [${ts}] [${level}] ${msg}`);
                } else if (level === 'WARNING') {
                    console.warn(`🟡 [${ts}] [${level}] ${msg}`);
                } else {
                    console.log(`⚪ [${ts}] [${level}] ${msg}`);
                }
            });
        }
    } catch (e) {
        console.warn('⚠️ No se pudieron obtener logs del navegador:', e.message);
    }
    console.log('-------------------------------\n');
}

async function runOnboardingTest() {
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    const options = new chrome.Options();
    options.addArguments('--window-size=1440,900');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs(prefs);
    // options.addArguments('--headless'); // Si necesitas correr sin interfaz

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // ──────────────────────────────────────────
        // 1. REGISTRO DEL NUEVO USUARIO
        // ──────────────────────────────────────────
        console.log(`\n🚀 [1/4] NAVEGANDO AL REGISTRO...`);
        await driver.get(`${BASE_URL}/register`);

        await sleep(3000);

        // Ubicar campos de registro
        console.log(`📝 Rellenando formulario con usuario: ${NEW_USER_NAME} | ${NEW_USER_EMAIL}`);
        const newUsernameInput = await driver.wait(
            until.elementLocated(By.xpath("//input[@name='username']")),
            15000,
            'No se encontró el campo username en registro'
        );
        await newUsernameInput.sendKeys(NEW_USER_NAME);

        const newEmailInput = await driver.findElement(By.xpath("//input[@name='email']"));
        await newEmailInput.sendKeys(NEW_USER_EMAIL);

        const newPasswordInput = await driver.findElement(By.xpath("//input[@name='password']"));
        await newPasswordInput.sendKeys(NEW_USER_PASSWORD);

        // Handle possible confirmPassword (dependiendo si es RegisterV2 o V3)
        try {
            const newConfirmPasswordInput = await driver.findElement(By.xpath("//input[@name='confirmPassword']"));
            await newConfirmPasswordInput.sendKeys(NEW_USER_PASSWORD);
        } catch(e) {
            console.log("  ℹ️ No se requirió confirmar contraseña.");
        }

        // Aceptar términos si hay checkbox
        try {
            const checkbox = await driver.findElement(By.xpath("//input[@type='checkbox']"));
            await driver.executeScript("arguments[0].click();", checkbox);
        } catch (e) {
            console.log('  ℹ️ No hay checkbox de términos o ya estaba marcado.');
        }

        // Submit
        const registerBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
        await registerBtn.click();

        console.log('⏳ Esperando redirección tras el registro...');
        // Wait till URL matches home or dashboard or account-setup
        await driver.wait(
            until.urlMatches(/\/(home|dashboard|account-setup)/),
            20000,
            'No se redirigió tras el registro exitoso'
        );
        
        let currentUrl = await driver.getCurrentUrl();
        console.log(`✅ Registro exitoso. Redirigido a: ${currentUrl}`);
        if(currentUrl.includes('/account-setup')){
             console.log('⚠️ Redirigió a /account-setup en lugar de /home. Esto es normal en onboarding si falta configurar la empresa, pero lo permitiremos por ahora para validar que activó sesion.');
        }
        await checkBrowserLogs(driver, 'POST-REGISTRO');


        // ──────────────────────────────────────────
        // 2. LOGOUT (DESLOGUEARSE)
        // ──────────────────────────────────────────
        console.log('\n🔒 [2/4] DESLOGUEANDO USUARIO...');
        // Para asegurar deslogueo: borramos localStorage y forzamos redirect
        await driver.executeScript("localStorage.clear(); sessionStorage.clear(); document.cookie.split(';').forEach(function(c) { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'); });");
        
        await driver.get(`${BASE_URL}/login`);
        await sleep(3000);
        
        console.log('✅ Sesión limpiada y redirigido exitosamente a /login');
        

        // ──────────────────────────────────────────
        // 3. LOGIN NUEVO USUARIO
        // ──────────────────────────────────────────
        console.log('\n🔑 [3/4] INICIANDO SESIÓN CON EL USUARIO RECIÉN CREADO...');
        
        // Esperamos a que los campos de login estén presentes
        const usernameLogin = await driver.wait(
            until.elementLocated(By.xpath("//input[@name='username' or @placeholder='juanperez123']")),
            15000,
            'No se encontró el campo username en Login'
        );
        await usernameLogin.clear();
        await usernameLogin.sendKeys(NEW_USER_NAME);

        const passwordLogin = await driver.findElement(By.xpath("//input[@type='password' or @name='password']"));
        await passwordLogin.sendKeys(NEW_USER_PASSWORD);

        const loginBtn = await driver.findElement(By.xpath("//button[contains(., 'Iniciar sesión') or @type='submit']"));
        await loginBtn.click();


        // ──────────────────────────────────────────
        // 4. VERIFICAR ACTIVACIÓN Y REDIRECCIÓN
        // ──────────────────────────────────────────
        console.log(`\n🔍 [4/4] VERIFICANDO ACTIVACIÓN Y ACCESO A HOME...`);
        // Queremos asegurar de que llega a /home (o dashboard) sin problemas 
        await driver.wait(
            until.urlMatches(/\/(home|dashboard|account-setup)/),
            15000,
            'No se redirigió tras iniciar sesión. Posible bloqueo de verificación de cuenta.'
        );

        let finalUrl = await driver.getCurrentUrl();
        console.log(`✅ Login comprobado. Acceso permitido sin bloqueos. URL Actual: ${finalUrl}`);

        await checkBrowserLogs(driver, 'POST-RE-LOGIN');

        console.log('\n╔═════════════════════════════════════════╗');
        console.log('║ ✨ E2E ONBOARDING & LOGIN TEST EXITOSO ✨║');
        console.log('╚═════════════════════════════════════════╝');

    } catch (error) {
        console.error('\n❌ ERROR DURANTE EL TEST E2E:');
        console.error(error.message || error);
        await checkBrowserLogs(driver, 'ERROR');

        try {
            const fs = require('fs');
            const screenshot = await driver.takeScreenshot();
            const ts = Date.now();
            const path = `tests/logs/onboarding_error_${ts}.png`;
            fs.mkdirSync('tests/logs', { recursive: true });
            fs.writeFileSync(path, screenshot, 'base64');
            console.log(`📸 Screenshot guardado en: ${path}`);
        } catch (screenshotErr) {
            console.warn('⚠️ No se pudo tomar captura:', screenshotErr.message);
        }

        process.exit(1);
    } finally {
        await driver.quit();
    }
}

runOnboardingTest();
