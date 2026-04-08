const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Selenium CRUD Test for Users (frontend_new)
 *
 * Login: Admin (edwing2022)
 * URL: https://dashboard.cloudfly.com.co
 *
 * Flujo implementado actual:
 * 1. Login como ADMIN
 * 2. Navegar a /accounts/user/list y verificar READ
 * 3. Crear Usuario en /accounts/user/form (que usa RegisterV3)
 * 4. Verificar que el usuario aparece en la tabla de listado (READ posterior a CREATE)
 * Nota: El Update y Delete no están conectados en el frontend aún,
 * por lo que el test cubre Create y Read actualmente.
 *
 * Usage:
 *   node tests/user_crud_test.js
 */

const BASE_URL = 'https://dashboard.cloudfly.com.co';
const LOGIN_USERNAME = 'mkt_1774026546054';
const LOGIN_PASSWORD = 'Password123!';
const NEW_USER_EMAIL = `testuser_${Date.now()}@example.com`;
const NEW_USER_NAME = `testuser_${Date.now()}`;
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

async function runUserCrudTest() {
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    const options = new chrome.Options();
    options.addArguments('--window-size=1440,900');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs(prefs);
    // options.addArguments('--headless'); // Descomentar para headless

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // ──────────────────────────────────────────
        // 1. LOGIN COMO MANAGER
        // ──────────────────────────────────────────
        console.log('\n🚀 [1/4] LOGIN COMO MANAGER...');
        await driver.get(`${BASE_URL}/login`);

        const usernameInput = await driver.wait(
            until.elementLocated(By.xpath("//input[@placeholder='juanperez123' or @name='username']")),
            15000,
            'No se encontró el campo de usuario en Login'
        );
        await usernameInput.clear();
        await usernameInput.sendKeys(LOGIN_USERNAME);

        const passwordInput = await driver.findElement(By.xpath("//input[@type='password' or @name='password']"));
        await passwordInput.sendKeys(LOGIN_PASSWORD);

        const loginBtn = await driver.findElement(By.xpath("//button[contains(., 'Iniciar sesión') or @type='submit']"));
        await loginBtn.click();

        await driver.wait(
            until.urlMatches(/\/(home|dashboard)/),
            20000,
            'No se redirigió al dashboard tras login'
        );

        console.log('✅ Login exitoso');
        await checkBrowserLogs(driver, 'POST-LOGIN');

        // ──────────────────────────────────────────
        // 2. NAVEGAR AL LISTADO DE USUARIOS
        // ──────────────────────────────────────────
        console.log('\n📂 [2/4] NAVEGANDO AL LISTADO DE USUARIOS...');
        await driver.get(`${BASE_URL}/accounts/user/list`);

        await sleep(3000); // Give the page some time to render
        const addBtn = await driver.wait(
            until.elementLocated(By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'agregar usuario')]")),
            20000,
            'No se encontró el botón o enlace de crear usuario'
        );
        console.log(`✅ Listado de usuarios cargado correctamente`);

        // ──────────────────────────────────────────
        // 3. CREAR USUARIO (CREATE)
        // ──────────────────────────────────────────
        console.log(`\n➕ [3/4] CREANDO USUARIO: "${NEW_USER_NAME}"...`);
        await addBtn.click();

        // Esperar que cargue el form (RegisterV3 dentro del form/page)
        const newUsernameInput = await driver.wait(
            until.elementLocated(By.xpath("//input[@name='username']")),
            15000,
            'No se cargó el formulario de usuario'
        );
        await newUsernameInput.sendKeys(NEW_USER_NAME);

        const newEmailInput = await driver.findElement(By.xpath("//input[@name='email']"));
        await newEmailInput.sendKeys(NEW_USER_EMAIL);

        const newPasswordInput = await driver.findElement(By.xpath("//input[@name='password']"));
        await newPasswordInput.sendKeys(NEW_USER_PASSWORD);

        const newConfirmPasswordInput = await driver.findElement(By.xpath("//input[@name='confirmPassword']"));
        await newConfirmPasswordInput.sendKeys(NEW_USER_PASSWORD);

        // Aceptar términos/checkbox si existe
        try {
            const checkbox = await driver.findElement(By.xpath("//input[@type='checkbox']"));
            await driver.executeScript("arguments[0].click();", checkbox);
        } catch (e) {
            console.log('  ℹ️ No se encontró un checkbox obligatorio o ya estaba checkeado.');
        }

        const submitBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Registrarse')]"));
        await submitBtn.click();

        // Esperar a que se guarden los datos. Actualmente RegisterV3 hace router.push('/home')
        console.log('⏳ Esperando redirección tras crear usuario...');
        await driver.wait(
            until.urlMatches(/\/(home)/),
            15000,
            'No se redirigió al home tras la creación del usuario'
        );
        console.log(`✅ Usuario creado y redirigido`);
        await checkBrowserLogs(driver, 'POST-CREATE');

        // ──────────────────────────────────────────
        // 4. VERIFICAR CREACIÓN EN LISTADO (READ)
        // ──────────────────────────────────────────
        console.log(`\n🔍 [4/4] VERIFICANDO USUARIO EN LA LISTA...`);
        await driver.get(`${BASE_URL}/accounts/user/list`);

        // Escribimos en el buscador
        const searchInput = await driver.wait(
            until.elementLocated(By.xpath("//input[@placeholder='Buscar']")),
            15000,
            'No se encontró el input de búsqueda'
        );
        await searchInput.sendKeys(NEW_USER_NAME);

        // Esperar a que el usuario aparezca filtrado en la tabla
        await driver.wait(
            until.elementLocated(By.xpath(`//td[contains(., '${NEW_USER_NAME}')] | //*[contains(text(),'${NEW_USER_NAME}')]`)),
            10000,
            `El usuario ${NEW_USER_NAME} no apareció en el listado`
        );
        console.log(`✅ El usuario ${NEW_USER_NAME} existe en el listado (Test de READ exitoso)`);
        
        await checkBrowserLogs(driver, 'POST-READ');

        // ──────────────────────────────────────────
        // RESULTADO FINAL
        // ──────────────────────────────────────────
        console.log('\n');
        console.log('╔══════════════════════════════════════╗');
        console.log('║ ✨ CRUD TEST USER: ÉXITO PARCIAL ✨  ║');
        console.log('╚══════════════════════════════════════╝');
        console.log(`  ✅ CREATE: Usuario "${NEW_USER_NAME}" (${NEW_USER_EMAIL}) añadido.`);
        console.log(`  ✅ READ: Confirmado desde listado principal.`);
        console.log(`  ℹ️ UPDATE / DELETE: Omitidos porque su flujo requiere integración extra en frontend_new.`);

    } catch (error) {
        console.error('\n❌ ERROR EN EL TEST CRUD DE USUARIOS:');
        console.error(error.message || error);
        await checkBrowserLogs(driver, 'ERROR');

        try {
            const screenshot = await driver.takeScreenshot();
            const fs = require('fs');
            const ts = Date.now();
            const path = `tests/logs/user_crud_error_${ts}.png`;
            fs.mkdirSync('tests/logs', { recursive: true });
            fs.writeFileSync(path, screenshot, 'base64');
            console.log(`📸 Screenshot guardado en: ${path}`);
        } catch (screenshotErr) {
            console.warn('⚠️ No se pudo tomar captura:', screenshotErr.message);
        }
    } finally {
        await driver.quit();
    }
}

runUserCrudTest();
