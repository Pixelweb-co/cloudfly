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
    // options.addArguments('--headless'); 

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
        
        await driver.findElement(By.xpath("//button[contains(., 'Siguiente')]")).click();
        console.log('✅ Paso 1 guardado.');

        // [6] STEP 2: WHATSAPP (OMITIR)
        console.log('\n📱 [6/7] WIZARD: WHATSAPP (OMITIENDO)');
        await sleep(5000);
        try {
            // Buscamos el label del paso "Chatbot IA" para hacer click (nueva funcionalidad)
            const chatbotStep = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Chatbot IA')]")), 15000);
            await chatbotStep.click();
            console.log('👆 Click en tab "Chatbot IA" exitoso.');
            await sleep(2000);

            // Ahora intentamos avanzar al siguiente paso "Productos"
            const productsStep = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Productos')]")), 15000);
            await productsStep.click();
            console.log('⏩ Paso 2 omitido vía click en tab "Productos".');
        } catch (e) {
             console.warn('⚠️ No se pudo navegar vía tabs. Intentando navegación forzada.');
             await driver.get(`${BASE_URL}/account-setup`); // Recargar para ver si avanza
        }

        // [7] STEP 3: PRODUCTO (REVIEW FIX)
        console.log('\n🎁 [7/7] WIZARD: PRODUCTO Y CATEGORÍA (VALIDANDO FIX)');
        await sleep(5000);
        
        const nameInp = await driver.wait(until.elementLocated(By.xpath("//input[contains(@placeholder, 'Hamb') or @label='Nombre'] | //input[@type='text' and not(@value)]")), 20000);
        await nameInp.clear();
        await nameInp.sendKeys('Pack Marketing Autómata');

        const descInp = await driver.findElement(By.xpath("//textarea[contains(@placeholder, 'Describe')]"));
        await descInp.clear();
        await descInp.sendKeys('Gestión proactiva de redes sociales y leads con IA.');

        const priceInp = await driver.findElement(By.xpath("//input[@type='number']"));
        await priceInp.clear();
        await priceInp.sendKeys('480000');

        await takeScreenshot(driver, 'onboarding_step3_product');
        const finBtn = await driver.findElement(By.xpath("//button[contains(., 'Finalizar')]"));
        await finBtn.click();

        console.log('⏳ Esperando redirección final a Dashboard...');
        await driver.wait(until.urlMatches(/\/(home|dashboard)/), 20000);
        console.log('✅ TEST E2E EXITOSO. SISTEMA COMPROBADO.');

    } catch (error) {
        console.error('\n❌ FALLO EN EL TEST:');
        console.error(error.message);
        await takeScreenshot(driver, 'error_final');
    } finally {
        // [MODIFICADO] No eliminamos el buzón para que el usuario pueda revisarlo
        // await mailHelper.deleteAccount(MAIL_ACC);
        await driver.quit();
    }
}

runTest();
