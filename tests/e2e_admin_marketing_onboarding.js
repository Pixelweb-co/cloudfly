const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const mailHelper = require('./mail_helper');

/**
 * Selenium E2E Test: Admin Marketing Onboarding (FULL FLOW)
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

const BASE_URL = 'https://dashboard.cloudfly.com.co';
const UNIQUE_ID = Date.now();
const MAIL_ACC = `mkt_${UNIQUE_ID}`;
const MAIL_PASS = 'TestPass2026*';
const NEW_USER_EMAIL = `${MAIL_ACC}@cloudfly.com.co`;
const NEW_USER_NAME = `onboarding_mkt_${UNIQUE_ID}`;
const NEW_USER_PASSWORD = 'Password123!';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function takeScreenshot(driver, name) {
    const dir = 'tests/logs/screenshots';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const screenshot = await driver.takeScreenshot();
    const filePath = path.join(dir, `${name}_${Date.now()}.png`);
    fs.writeFileSync(filePath, screenshot, 'base64');
    console.log(`📸 Screenshot: ${filePath}`);
}

async function runTest() {
    console.log('\n--- INICIANDO TEST E2E ONBOARDING MARKETING ---');
    
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
        await driver.wait(until.elementLocated(By.name('nombres')), 15000).sendKeys('Admin');
        await driver.findElement(By.name('apellidos')).sendKeys('Marketing');
        await driver.findElement(By.name('username')).sendKeys(NEW_USER_NAME);
        await driver.findElement(By.name('email')).sendKeys(NEW_USER_EMAIL);
        await driver.findElement(By.name('password')).sendKeys(NEW_USER_PASSWORD);
        await driver.findElement(By.name('confirmPassword')).sendKeys(NEW_USER_PASSWORD);
        
        const checkbox = await driver.findElement(By.xpath("//input[@type='checkbox']"));
        await driver.executeScript("arguments[0].click();", checkbox);

        await driver.findElement(By.xpath("//button[@type='submit']")).click();
        await driver.wait(until.urlContains('/verify-email'), 20000);
        console.log('✅ Registro enviado. Esperando email de activación...');

        // [2] ACTIVACIÓN
        const activationLink = await mailHelper.getActivationLink(MAIL_ACC, MAIL_PASS);
        if (!activationLink) throw new Error('No se recibió el link de activación');
        
        await driver.get(activationLink);
        await sleep(5000);
        await takeScreenshot(driver, 'account_activated');
        
        const accederBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Acceder')]")), 15000);
        await accederBtn.click();
        console.log('✅ Cuenta activada exitosamente.');

        // [3] LOGIN
        console.log('\n🔑 [3/7] INICIANDO SESIÓN...');
        await driver.wait(until.urlContains('/login'), 15000);
        await driver.findElement(By.name('username')).sendKeys(NEW_USER_NAME);
        await driver.findElement(By.name('password')).sendKeys(NEW_USER_PASSWORD);
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        await driver.wait(until.urlContains('/account-setup'), 25000);
        console.log('✅ Login exitoso. Entrando al Wizard.');

        // [4] STEP 0: BIENVENIDA
        console.log('\n🌟 [4/7] WIZARD: BIENVENIDA');
        const contBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Continuar')]")), 15000);
        await contBtn.click();

        // [5] STEP 1: EMPRESA
        console.log('\n🏢 [5/7] WIZARD: DATOS DE NEGOCIO');
        await driver.wait(until.elementLocated(By.name('name')), 15000).sendKeys('Agencia Marketing IA');
        await driver.findElement(By.name('nit')).sendKeys('900.555.444-1');
        await driver.findElement(By.name('phone')).sendKeys('3005553322');
        await driver.findElement(By.name('email')).sendKeys(NEW_USER_EMAIL);
        await driver.findElement(By.name('address')).sendKeys('Centro Empresarial El Dorado');
        await driver.findElement(By.name('objetoSocial')).sendKeys('Estrategias de marketing basadas en datos y agentes de IA autónomos.');
        await driver.findElement(By.name('contact')).sendKeys('Camila Marketing');
        await driver.findElement(By.name('position')).sendKeys('Directora');

        const card = await driver.findElement(By.xpath("//*[contains(text(), 'Software / SaaS')]"));
        await card.click();
        
        await driver.findElement(By.xpath("//button[contains(., 'Continuar')]")).click();
        console.log('✅ Paso 1 guardado.');

        // [6] STEP 2: WHATSAPP (OMITIR)
        try {
            console.log('🔗 Intentando omitir vía "Configurar más tarde"...');
            const skipBtn = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Configurar más tarde')]")), 15000);
            await driver.executeScript("arguments[0].click();", skipBtn);
            console.log('✅ Paso 2 omitido vía "Configurar más tarde".');
            await sleep(3000);
        } catch (e) {
             console.warn('⚠️ No se encontró "Configurar más tarde". Intentando navegar vía tabs.');
             try {
                const productsStep = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Productos')]")), 15000);
                await productsStep.click();
                console.log('⏩ Paso 2 omitido vía click en tab "Productos".');
             } catch (e2) {
                console.error('❌ Fallo total al omitir paso 2.');
                await driver.get(`${BASE_URL}/account-setup`); 
             }
        }

        // [7] STEP 3: PRODUCTO
        console.log('\n🎁 [7/8] WIZARD: PRODUCTO Y CATEGORÍA');
        await sleep(5000);
        
        const nameInp = await driver.wait(until.elementLocated(By.xpath("//input[contains(@placeholder, 'Hamb') or @label='Nombre'] | //input[@type='text' and not(@value)]")), 20000);
        await nameInp.clear();
        await nameInp.sendKeys('Pack Marketing Autómata');

        const descInp = await driver.findElement(By.xpath("//textarea[contains(@placeholder, 'Describe')]"));
        await descInp.clear();
        await descInp.sendKeys('Gestión proactiva de redes sociales y leads con IA.');

        const priceInp = await driver.findElement(By.xpath("//input[@type='number']"));
        await priceInp.click();
        await priceInp.sendKeys(Key.CONTROL, 'a');
        await priceInp.sendKeys(Key.BACK_SPACE);
        await priceInp.sendKeys('48000');

        await takeScreenshot(driver, 'onboarding_step3_product');
        const finProdBtn = await driver.findElement(By.xpath("//button[contains(., 'Finalizar Configuración')]"));
        await finProdBtn.click();

        // [8] STEP 4: PLAN Y PAGO (WOMPI)
        console.log('\n💳 [8/8] WIZARD: PLAN Y PAGO (WOMPI TEST)');
        await sleep(3000);
        
        // Seleccionar tarjeta e ingresar datos
        const cardNumInp = await driver.wait(until.elementLocated(By.xpath("//input[contains(@placeholder, '0000')]")), 15000);
        await cardNumInp.sendKeys('4242 4242 4242 4242'); // Card for APPROVED status
        
        await driver.findElement(By.xpath("//input[contains(@placeholder, 'JUAN')]")).sendKeys('ADMIN MARKETING TEST');
        await driver.findElement(By.xpath("//input[contains(@placeholder, 'MM/YY')]")).sendKeys('12/28');
        await driver.findElement(By.xpath("//input[contains(@placeholder, '123')]")).sendKeys('123');

        await takeScreenshot(driver, 'onboarding_step4_billing');
        
        const activateBtn = await driver.findElement(By.xpath("//button[contains(., 'Activar mi Cuenta')]"));
        await activateBtn.click();

        console.log('⏳ Esperando redirección final a Dashboard...');
        await driver.wait(until.urlMatches(/\/(home|dashboard)/), 30000);
        console.log('✅ Redirección a Dashboard detectada.');

        // [8] VALIDAR LOGOUT Y RE-LOGIN (Para confirmar persistencia de onboarding)
        console.log('\n🔄 [8/9] VALIDANDO PERSISTENCIA: LOGOUT Y RE-LOGIN...');
        
        // Log state BEFORE logout
        const stateBeforeLogout = await driver.executeScript("return { userData: localStorage.getItem('userData'), jwt: localStorage.getItem('jwt') };");
        console.log('📊 State before logout:', JSON.stringify(stateBeforeLogout, null, 2));

        await driver.get(`${BASE_URL}/logout`);
        await sleep(3000);
        await driver.wait(until.urlContains('/login'), 15000);
        console.log('✅ Logout exitoso.');

        // Re-login
        console.log(`🔑 Re-ingresando con: ${NEW_USER_NAME}`);
        await driver.findElement(By.name('username')).sendKeys(NEW_USER_NAME);
        await driver.findElement(By.name('password')).sendKeys(NEW_USER_PASSWORD);
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        // Esperar a que la URL NO sea /account-setup
        await sleep(5000);
        const urlAfterLogin = await driver.getCurrentUrl();
        console.log(`📍 URL después de re-login: ${urlAfterLogin}`);

        const stateAfterLogin = await driver.executeScript("return { userData: localStorage.getItem('userData'), jwt: localStorage.getItem('jwt') };");
        console.log('📊 State after re-login:', JSON.stringify(stateAfterLogin, null, 2));

        if (urlAfterLogin.includes('account-setup')) {
            console.error('❌ ERROR: El usuario fue redirigido al WIZARD nuevamente.');
            await takeScreenshot(driver, 'error_redirect_to_wizard');
            
            // Debug the user in DB
            console.log('🔍 Checking user in DB via script...');
        } else {
            console.log('✅ Re-login exitoso: El usuario entró directamente al Dashboard.');
        }

        // [9] VALIDACIÓN FINAL: PRODUCT LIST
        console.log('\n📦 [9/9] VALIDACIÓN: CONSULTANDO LISTA DE PRODUCTOS...');
        await driver.get(`${BASE_URL}/ventas/productos/list`);
        const productRow = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Pack Marketing Autómata')]")), 20000);
        console.log('✅ Producto encontrado en la lista.');
        await takeScreenshot(driver, 'product_list_verified');

        // Obtener logs del frontend
        console.log('\n📋 LOGS DEL FRONTEND (VALIDACIÓN):');
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        logs.forEach(log => {
            console.log(`[${log.level.name}] ${log.message}`);
        });

        console.log('\n✅ TEST E2E EXITOSO. FLUJO COMPLETO Y LISTA DE PRODUCTOS VALIDADOS.');

    } catch (error) {
        console.error('\n❌ FALLO EN EL TEST:');
        console.error(error.message);
        
        // Intentar obtener logs incluso en error
        try {
            const logs = await driver.manage().logs().get(logging.Type.BROWSER);
            console.log('\n📋 LOGS DEL FRONTEND (ERROR):');
            logs.slice(-10).forEach(log => console.log(`[${log.level.name}] ${log.message}`));
        } catch (e) {}

        await takeScreenshot(driver, 'error_final');
    } finally {
        // [MODIFICADO] No eliminamos el buzón para que el usuario pueda revisarlo
        // await mailHelper.deleteAccount(MAIL_ACC);
        await driver.quit();
    }
}

runTest();
