const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const mailHelper = require('./mail_helper');

/**
 * Selenium E2E Test: Admin Marketing Onboarding (FULL FLOW) - DEV ENVIRONMENT
 * 
 * Flujo validado por Diagrama de Secuencia:
 * 1. Registro con cuenta real @cloudfly.com.co.
 * 2. Activación vía Email (IMAP Link).
 * 3. Login.
 * 4. Wizard Step 0: Bienvenida.
 * 5. Wizard Step 1: Form Business (Empresa).
 * 6. Wizard Step 2: WhatsApp (SALTAR/OMITIR).
 * 7. Wizard Step 3: Producto y Categoría (Review Fix tenantId).
 */

const BASE_URL = 'https://devdashboard.cloudfly.com.co';
const UNIQUE_ID = Date.now();
const MAIL_ACC = `mkt_dev_${UNIQUE_ID}`;
const MAIL_PASS = 'TestPass2026*';
const NEW_USER_EMAIL = `${MAIL_ACC}@cloudfly.com.co`;
const NEW_USER_NAME = `onboarding_dev_${UNIQUE_ID}`;
const NEW_USER_PASSWORD = 'Password123!';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function takeScreenshot(driver, name) {
    const dir = 'tests/logs/screenshots_dev';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const screenshot = await driver.takeScreenshot();
    const filePath = path.join(dir, `${name}_${Date.now()}.png`);
    fs.writeFileSync(filePath, screenshot, 'base64');
    console.log(`📸 [DEV] Screenshot: ${filePath}`);
}

async function runTest() {
    console.log('\n--- INICIANDO TEST E2E ONBOARDING MARKETING (DEV) ---');
    console.log(`🌐 Target URL: ${BASE_URL}`);
    
    // Paso 0: Preparar buzón
    if (!(await mailHelper.createAccount(MAIL_ACC, MAIL_PASS))) {
        console.error('❌ No se pudo preparar el buzón de prueba.');
        process.exit(1);
    }

    const options = new chrome.Options();
    options.addArguments('--window-size=1440,900', '--no-sandbox', '--disable-dev-shm-usage');
    options.addArguments('--headless'); 

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        // [1] REGISTRO
        console.log(`\n🚀 [1/7] REGISTRANDO: ${NEW_USER_NAME} | ${NEW_USER_EMAIL}`);
        await driver.get(`${BASE_URL}/register`);
        await driver.wait(until.elementLocated(By.name('nombres')), 30000).sendKeys('Admin');
        await driver.findElement(By.name('apellidos')).sendKeys('Dev');
        await driver.findElement(By.name('username')).sendKeys(NEW_USER_NAME);
        await driver.findElement(By.name('email')).sendKeys(NEW_USER_EMAIL);
        await driver.findElement(By.name('password')).sendKeys(NEW_USER_PASSWORD);
        await driver.findElement(By.name('confirmPassword')).sendKeys(NEW_USER_PASSWORD);
        
        const checkbox = await driver.findElement(By.xpath("//input[@type='checkbox']"));
        await driver.executeScript("arguments[0].click();", checkbox);

        await driver.findElement(By.xpath("//button[@type='submit']")).click();
        
        // In dev environment, wait for success alert instead of URL change (JIT compilation delays routing)
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'registrado exitosamente')]")), 60000);
        console.log('✅ Registro enviado. Esperando email de activación...');
        
        // Give the redirect time to happen
        await sleep(5000);

        // [2] ACTIVACIÓN
        const activationLink = await mailHelper.getActivationLink(MAIL_ACC, MAIL_PASS);
        if (!activationLink) throw new Error('No se recibió el link de activación');
        
        // Reemplazar host del link si viene con el de producción pero estamos en dev
        const devActivationLink = activationLink.replace('dashboard.cloudfly.com.co', 'devdashboard.cloudfly.com.co');
        console.log(`🔗 Link de activación (ajustado para DEV): ${devActivationLink}`);
        
        await driver.get(devActivationLink);
        await sleep(5000);
        await takeScreenshot(driver, 'account_activated_dev');
        
        const accederBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Acceder')]")), 40000);
        await accederBtn.click();
        console.log('✅ Cuenta activada exitosamente.');

        // [3] LOGIN
        console.log('\n🔑 [3/7] INICIANDO SESIÓN...');
        await driver.wait(until.urlContains('/login'), 40000);
        await driver.findElement(By.name('username')).sendKeys(NEW_USER_NAME);
        await driver.findElement(By.name('password')).sendKeys(NEW_USER_PASSWORD);
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        await driver.wait(until.urlContains('/account-setup'), 90000);
        console.log('✅ Login exitoso. Entrando al Wizard.');

        // [4] STEP 0: BIENVENIDA
        console.log('\n🌟 [4/7] WIZARD: BIENVENIDA');
        const contBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Continuar')]")), 40000);
        await contBtn.click();

        // [5] STEP 1: EMPRESA
        console.log('\n🏢 [5/7] WIZARD: DATOS DE NEGOCIO');
        await driver.wait(until.elementLocated(By.name('name')), 20000).sendKeys('Dev Shop IA');
        await driver.findElement(By.name('nit')).sendKeys('800.111.222-3');
        await driver.findElement(By.name('phone')).sendKeys('3101112233');
        await driver.findElement(By.name('email')).sendKeys(NEW_USER_EMAIL);
        await driver.findElement(By.name('address')).sendKeys('Sector Dev Medellín');
        await driver.findElement(By.name('objetoSocial')).sendKeys('Pruebas automatizadas de entornos de desarrollo.');
        await driver.findElement(By.name('contact')).sendKeys('Dev Tester');
        await driver.findElement(By.name('position')).sendKeys('Lead QA');

        const card = await driver.findElement(By.xpath("//*[contains(text(), 'Software / SaaS')]"));
        await card.click();
        
        await driver.findElement(By.xpath("//button[contains(., 'Siguiente')]")).click();
        console.log('✅ Paso 1 guardado.');

        // [6] STEP 2: WHATSAPP (OMITIR)
        try {
            console.log('🔗 Intentando omitir vía "Configurar más tarde"...');
            const skipBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Configurar más tarde')] | //*[contains(@class, 'omit-chatbot-step')]")), 20000);
            await driver.executeScript("arguments[0].click();", skipBtn);
            console.log('✅ Paso 2 omitido.');
            await sleep(3000);
        } catch (e) {
             console.warn('⚠️ No se encontró botón de omitir. Intentando click en tab.');
             const productsTab = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Productos')]")), 15000);
             await productsTab.click();
        }

        // [7] STEP 3: PRODUCTO (REVIEW FIX)
        console.log('\n🎁 [7/7] WIZARD: PRODUCTO Y CATEGORÍA (VALIDANDO FIX)');
        await sleep(5000);
        
        const nameInp = await driver.wait(until.elementLocated(By.xpath("//input[contains(@placeholder, 'Hamb') or @label='Nombre'] | //input[@type='text' and not(@value)]")), 20000);
        await nameInp.clear();
        await nameInp.sendKeys('Producto Dev 001');

        const descInp = await driver.findElement(By.xpath("//textarea[contains(@placeholder, 'Describe')]"));
        await descInp.clear();
        await descInp.sendKeys('Descripción de prueba en ambiente de desarrollo.');

        const priceInp = await driver.findElement(By.xpath("//input[@type='number']"));
        await priceInp.click();
        await priceInp.sendKeys(Key.CONTROL, 'a');
        await priceInp.sendKeys(Key.BACK_SPACE);
        await priceInp.sendKeys('12500');

        await takeScreenshot(driver, 'onboarding_step3_product_dev');
        const finBtn = await driver.findElement(By.xpath("//button[contains(., 'Finalizar')]"));
        await finBtn.click();

        console.log('⏳ Esperando redirección final a Dashboard...');
        await driver.wait(until.urlMatches(/\/(home|dashboard)/), 60000);
        console.log('✅ Redirección a Dashboard detectada.');

        // [8] VALIDAR PERSISTENCIA
        console.log('\n🔄 [8/9] VALIDANDO PERSISTENCIA: LOGOUT Y RE-LOGIN...');
        const stateBefore = await driver.executeScript("return { userData: localStorage.getItem('userData'), jwt: localStorage.getItem('jwt') };");
        console.log('📊 State before logout:', JSON.stringify(stateBefore, null, 2));

        await driver.get(`${BASE_URL}/api/auth/signout`);
        await sleep(2000);
        const signoutBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Sign out')] | //button[@type='submit']")), 15000);
        await signoutBtn.click();
        await sleep(3000);
        await driver.wait(until.urlContains('/login'), 40000);
        
        console.log(`🔑 Re-ingresando con: ${NEW_USER_NAME}`);
        await driver.findElement(By.name('username')).sendKeys(NEW_USER_NAME);
        await driver.findElement(By.name('password')).sendKeys(NEW_USER_PASSWORD);
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        await sleep(5000);
        const currentUrl = await driver.getCurrentUrl();
        console.log(`📍 URL actual: ${currentUrl}`);

        if (currentUrl.includes('account-setup')) {
            console.error('❌ ERROR: Redirigido al wizard en ambiente DEV.');
        } else {
            console.log('✅ Re-login exitoso: Acceso directo al Dashboard.');
        }

        // [9] PRODUCT LIST
        console.log('\n📦 [9/9] VALIDACIÓN: CONSULTANDO LISTA DE PRODUCTOS...');
        await driver.get(`${BASE_URL}/ventas/productos/list`);
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Producto Dev 001')]")), 20000);
        console.log('✅ Producto encontrado en la lista (DEV).');
        await takeScreenshot(driver, 'product_list_verified_dev');

        console.log('\n✅ TEST E2E DEV EXITOSO.');

    } catch (error) {
        console.error('\n❌ FALLO EN EL TEST (DEV):');
        console.error(error.message);
        
        try {
            const logs = await driver.manage().logs().get(logging.Type.BROWSER);
            console.log('\n📋 LOGS DEL FRONTEND (ERROR DEV):');
            logs.slice(-10).forEach(log => console.log(`[${log.level.name}] ${log.message}`));
        } catch (e) {}

        await takeScreenshot(driver, 'error_final_dev');
    } finally {
        await driver.quit();
    }
}

runTest();
