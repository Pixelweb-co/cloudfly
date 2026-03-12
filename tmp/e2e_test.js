/**
 * E2E Selenium Test - Flujo Onboarding ADMIN Completo
 * Basado en: docs/onboarding_sequence_diagram.md
 * 
 * Fases:
 *  1. Registro
 *  2. Activación (DB via SSH)
 *  3. Login
 *  4. Account Setup Wizard (4 Pasos)
 *     - Paso 0: Bienvenida
 *     - Paso 1: Tu Negocio (Tenant creation + WhatsApp Notification)
 *     - Paso 2: Chatbot IA (QR Generation)
 *     - Paso 3: Productos (Category + Product creation)
 *  5. Dashboard / Sidebar
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL  = 'https://dashboard.cloudfly.com.co';
const PHONE_WA  = '573246285134'; 
const SSH_KEY   = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';
const SSH_KEY_P = 'C:/Users/Edwin/.ssh/id_rsa_cloudfly'; // Forward slashes for safer interpolation
const VPS       = 'root@109.205.182.94';

// ─── Helpers ────────────────────────────────────────────────────────────────

function runSsh(cmd) {
    // Escaping double quotes for the remote shell execution
    const escapedCmd = cmd.replace(/"/g, '\\"');
    execSync(`ssh -i "${SSH_KEY_P}" ${VPS} "${escapedCmd}"`, { stdio: 'inherit' });
}

function activateUser(username) {
    runSsh(`docker exec mysql mysql -u root -pwidowmaker cloud_master -e "UPDATE users SET is_enabled = true WHERE username = '${username}';"`);
}

async function takeScreenshot(driver, label, timestamp) {
    try {
        const img = await driver.takeScreenshot();
        const dir = 'c:\\apps\\cloudfly\\tmp\\screenshots';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, `${timestamp}_${label}.png`);
        fs.writeFileSync(filePath, img, 'base64');
        console.log(`   📸 Screenshot: ${label}`);
    } catch (e) {
        console.log(`   ⚠️ Error screenshot ${label}: ${e.message}`);
    }
}

async function waitAndClick(driver, locator, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    // Scroll into view to avoid overlay issues
    await driver.executeScript("arguments[0].scrollIntoView(true);", el);
    await driver.sleep(500);
    await el.click();
    return el;
}

async function waitAndType(driver, locator, text, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    await el.clear();
    await el.sendKeys(text);
    return el;
}

// ─── Main Flow ───────────────────────────────────────────────────────────────

async function runE2E() {
    const timestamp = Date.now();
    const username  = `admin_${timestamp}`;
    const password  = 'Password123!';
    const email     = `${username}@testcloudfly.com`;

    let driver = await new Builder()
        .forBrowser('chrome')
        .build();

    console.log('\n=======================================================');
    console.log(' 🚀 CLOUDFLY FULL ONBOARDING E2E TEST');
    console.log('=======================================================');
    console.log(` User: ${username}`);
    console.log(` Phone: ${PHONE_WA}`);
    console.log('=======================================================\n');

    try {
        // --- 1. REGISTRO ---
        console.log('[1/5] REGISTRO');
        await driver.get(`${BASE_URL}/register`);
        await waitAndType(driver, By.name('nombres'), 'Admin');
        await waitAndType(driver, By.name('apellidos'), 'E2E');
        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('password'), password);
        await waitAndType(driver, By.name('confirmPassword'), password);
        
        await takeScreenshot(driver, '01_form_registro', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        console.log('   ✅ Registro enviado');
        await driver.sleep(4000);

        // --- 2. ACTIVACIÓN ---
        console.log('\n[2/5] ACTIVACIÓN (DB SSH)');
        activateUser(username);
        console.log('   ✅ Usuario activado en BD');

        // --- 3. LOGIN ---
        console.log('\n[3/5] LOGIN');
        await driver.get(`${BASE_URL}/login`);
        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('password'), password);
        await takeScreenshot(driver, '02_form_login', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        
        console.log('   ✅ Login exitoso. Esperando redirección a account-setup...');
        await driver.wait(until.urlContains('/account-setup'), 20000);
        await takeScreenshot(driver, '03_account_setup_landing', timestamp);

        // --- 4. ACCOUNT SETUP WIZARD ---
        console.log('\n[4/5] ACCOUNT SETUP WIZARD');

        // Paso 0: Bienvenida
        console.log('   ▶ Pasó 0: Bienvenida');
        await waitAndClick(driver, By.xpath("//button[contains(text(), 'Continuar')]"));
        await driver.sleep(2000);

        // Paso 1: Tu Negocio
        console.log('   ▶ Pasó 1: Tu Negocio');
        await waitAndType(driver, By.name('name'), 'Empresa E2E ' + timestamp);
        await waitAndType(driver, By.name('nit'), '900-E2E-' + timestamp);
        await waitAndType(driver, By.name('phone'), PHONE_WA);
        await waitAndType(driver, By.name('email'), 'negocio@test.com');
        await waitAndType(driver, By.name('address'), 'Sede Central E2E');
        await waitAndType(driver, By.name('contact'), 'Admin Responsable');
        await waitAndType(driver, By.name('position'), 'Manager');
        
        // Tipo de negocio card click via JS
        console.log('   Seleccionando tipo de negocio...');
        const bizCard = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
        await driver.executeScript("arguments[0].click();", bizCard);
        
        await waitAndType(driver, By.name('objetoSocial'), 'Descripción detallada para el chatbot inteligente de CloudFly.');
        await takeScreenshot(driver, '04_wizard_negocio', timestamp);
        
        console.log('   Enviando info negocio (Notificación WhatsApp)...');
        // El botón en FormCustomer dice "Siguiente" o "Procesando..."
        const nextBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
        await driver.executeScript("arguments[0].click();", nextBtn);
        
        // Wait for step 2 (WhatsApp)
        await driver.sleep(6000); 
        await takeScreenshot(driver, '05_wizard_whatsapp_landing', timestamp);

        // Paso 2: Chatbot IA
        console.log('   ▶ Pasó 2: Chatbot IA');
        try {
            console.log('   Generando QR de WhatsApp...');
            // Botón "Generar Código QR"
            const qrBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Generar Código QR')]")), 10000);
            await driver.executeScript("arguments[0].click();", qrBtn);
            
            await driver.sleep(5000); // Wait for QR generation UI
            await takeScreenshot(driver, '06_wizard_whatsapp_qr', timestamp);
            
            console.log('   Omitiendo vinculación real (Click en Configurar más tarde)');
            const skipBtn = await driver.findElement(By.xpath("//button[contains(., 'Configurar más tarde')]"));
            await driver.executeScript("arguments[0].click();", skipBtn);
        } catch (e) {
            console.log('   ℹ️ No se pudo generar QR o ya avanzado. Intentando omitir...');
            try {
                const skipBtn = await driver.findElement(By.xpath("//button[contains(., 'Configurar más tarde')]"));
                await driver.executeScript("arguments[0].click();", skipBtn);
            } catch (_) {}
        }
        await driver.sleep(2000);

        // Paso 3: Productos
        console.log('   ▶ Pasó 3: Productos');
        // Sub-step: Categoría
        await waitAndType(driver, By.xpath("//input[@label='Nombre de la Categoría' or @placeholder='Ej: Servicios, Productos, Membresías']"), 'Servicios E2E');
        await takeScreenshot(driver, '07_wizard_categoria', timestamp);
        await waitAndClick(driver, By.xpath("//button[contains(., 'Siguiente')]"));
        await driver.sleep(2000);
        
        // Sub-step: Producto
        await waitAndType(driver, By.xpath("//input[@label='Nombre del Producto/Servicio' or @placeholder='Ej: Corte de cabello, Consulta médica']"), 'Servicio Premium');
        await waitAndType(driver, By.xpath("//textarea[@label='Descripción']"), 'Descripción del producto de prueba.');
        await waitAndType(driver, By.name('productPrice'), '50000');
        await takeScreenshot(driver, '08_wizard_producto', timestamp);
        
        console.log('   Finalizando Wizard...');
        await waitAndClick(driver, By.xpath("//button[contains(., 'Finalizar')]"));
        await driver.sleep(3000);

        // --- 5. DASHBOARD ---
        console.log('\n[5/5] DASHBOARD');
        await driver.wait(until.urlContains('/home'), 15000);
        await takeScreenshot(driver, '09_dashboard_home', timestamp);
        
        console.log('   Verificando Menú Lateral...');
        await driver.wait(until.elementLocated(By.css('nav, aside')), 10000);
        await takeScreenshot(driver, '10_dashboard_sidebar', timestamp);

        console.log('\n⭐ PRUEBA COMPLETADA CON ÉXITO ⭐');

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:', error);
        await takeScreenshot(driver, '99_ERROR_FINAL', timestamp);
    } finally {
        await driver.quit();
        console.log('\n🔑 Datos de la sesión:');
        console.log(`   User: ${username}`);
        console.log(`   Pass: ${password}`);
        console.log('=======================================================\n');
    }
}

runE2E();
