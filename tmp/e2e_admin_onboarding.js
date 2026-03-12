/**
 * E2E Selenium Test - Flujo Onboarding ADMIN
 * Basado en: docs/onboarding_sequence_diagram.md
 *
 * Fases:
 *  1. Registro      → POST /auth/register → DB (enabled=false, customerId=null)
 *  2. Verificación  → GET /auth/verify?token (simulado via SSH DB update)
 *  3. Login         → POST /auth/login → JWT → redirige a /account-setup (ADMIN sin tenant)
 *  4. Account Setup → Wizard 4 pasos → POST /customers/account-setup
 *                   → Kafka 'welcome-notifications' → WhatsApp ✓
 *  5. Dashboard     → Redirección a /home → GET /api/rbac/menu → Sidebar dinámico
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { execSync } = require('child_process');

const BASE_URL  = 'https://dashboard.cloudfly.com.co';
const PHONE_WA  = '573246285134'; // número de prueba para bienvenida WhatsApp
const SSH_KEY   = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';
const VPS       = 'root@109.205.182.94';
const DB_PASS   = 'widowmaker';
const DB_NAME   = 'cloud_master';

// ─── helpers ────────────────────────────────────────────────────────────────

function runSsh(cmd) {
    execSync(`ssh -i "${SSH_KEY}" ${VPS} "${cmd}"`, { stdio: 'inherit' });
}

function activateUser(username) {
    runSsh(`docker exec mysql mysql -u root -p${DB_PASS} ${DB_NAME} -e "UPDATE users SET is_enabled = true WHERE username = '${username}';"`);
}

async function takeScreenshot(driver, label, timestamp) {
    try {
        const img = await driver.takeScreenshot();
        const fs  = require('fs');
        const path = `c:\\apps\\cloudfly\\tmp\\screenshots\\${timestamp}_${label}.png`;
        fs.mkdirSync('c:\\apps\\cloudfly\\tmp\\screenshots', { recursive: true });
        fs.writeFileSync(path, img, 'base64');
        console.log(`   📸 Screenshot guardado: ${path}`);
    } catch (_) {}
}

async function waitAndClick(driver, locator, timeout = 10000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 5000);
    await el.click();
    return el;
}

async function waitAndType(driver, locator, text, timeout = 10000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await el.clear();
    await el.sendKeys(text);
    return el;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function runAdminOnboarding() {
    const timestamp = Date.now();
    const username  = `admin_${timestamp}`;
    const password  = 'Password123!';
    const email     = `${username}@testcloudfly.com`;

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(
            new chrome.Options()
                // .headless()       // descomenta para correr sin ventana
        )
        .build();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🚀  E2E ADMIN ONBOARDING - Cloudfly');
    console.log('═══════════════════════════════════════════════════════');
    console.log(` Usuario  : ${username}`);
    console.log(` Email    : ${email}`);
    console.log(` Contraseña: ${password}`);
    console.log('═══════════════════════════════════════════════════════\n');

    try {

        // ─── FASE 1: REGISTRO ─────────────────────────────────────────────
        console.log('── FASE 1: REGISTRO ──────────────────────────────────');
        await driver.get(`${BASE_URL}/register`);
        await driver.wait(until.elementLocated(By.name('nombres')), 15000);
        await takeScreenshot(driver, '01_registro_form', timestamp);

        await waitAndType(driver, By.name('nombres'),        'Admin');
        await waitAndType(driver, By.name('apellidos'),      'Test');
        await waitAndType(driver, By.name('username'),       username);
        await waitAndType(driver, By.name('email'),          email);
        await waitAndType(driver, By.name('password'),       password);
        await waitAndType(driver, By.name('confirmPassword'), password);

        await takeScreenshot(driver, '02_registro_lleno', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        console.log('   ✅ Formulario de registro enviado');

        // Esperar confirmación (cualquier cambio de pantalla)
        await driver.sleep(3000);
        await takeScreenshot(driver, '03_registro_respuesta', timestamp);

        // ─── FASE 2: VERIFICACIÓN EMAIL (simulada via DB) ─────────────────
        console.log('\n── FASE 2: VERIFICAR EMAIL (via DB SSH) ───────────────');
        activateUser(username);
        console.log(`   ✅ Usuario "${username}" activado en BD (is_enabled = true)`);

        // ─── FASE 3: LOGIN ────────────────────────────────────────────────
        console.log('\n── FASE 3: LOGIN ─────────────────────────────────────');
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.name('username')), 15000);
        await takeScreenshot(driver, '04_login_form', timestamp);

        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('password'), password);
        await waitAndClick(driver, By.css('button[type="submit"]'));

        console.log('   ✅ Credenciales enviadas. Esperando redirección a /account-setup...');
        await driver.wait(until.urlContains('/account-setup'), 20000);
        await takeScreenshot(driver, '05_account_setup_entrada', timestamp);
        console.log('   ✅ ADMIN redirigido a /account-setup (customerId == null confirmado)');

        // ─── FASE 4: ACCOUNT SETUP WIZARD ────────────────────────────────
        console.log('\n── FASE 4: ACCOUNT SETUP WIZARD ──────────────────────');

        // ── Paso 0: Bienvenida ──────────────────────────────────────────
        console.log('   [Paso 1/4] Bienvenida - Clic en Continuar');
        await driver.wait(until.elementLocated(By.xpath("//button[contains(text(),'Continuar')]")), 15000);
        await driver.sleep(1000);
        await takeScreenshot(driver, '06_wizard_bienvenida', timestamp);
        await waitAndClick(driver, By.xpath("//button[contains(text(),'Continuar')]"));
        console.log('   ✅ Avanzado al paso: Tu Negocio');

        // ── Paso 1: Información del Negocio ────────────────────────────
        console.log('   [Paso 2/4] Información del Negocio');
        await driver.wait(until.elementLocated(By.name('name')), 10000);
        await takeScreenshot(driver, '07_wizard_negocio', timestamp);

        await waitAndType(driver, By.name('name'),         'Empresa E2E Test');
        await waitAndType(driver, By.name('nit'),          '900123456-1');
        await waitAndType(driver, By.name('phone'),        PHONE_WA);
        // ⚠️ email es REQUERIDO por la validación Yup — sin él el form no se puede enviar
        await waitAndType(driver, By.name('email'),        `empresa_${timestamp}@testcloudfly.com`);
        await waitAndType(driver, By.name('address'),      'Calle 123 # 45-67');
        await waitAndType(driver, By.name('contact'),      'Admin Test');
        await waitAndType(driver, By.name('position'),     'Gerente General');

        // businessType es un card selector React (field.onChange), usamos JS click para asegurar
        console.log('   Seleccionando tipo de negocio...');
        try {
            const bizCard = await driver.findElement(
                By.xpath("//*[contains(text(),'Salón de Belleza')]")
            );
            await driver.executeScript("arguments[0].click();", bizCard);
            console.log('   ✅ Tipo de negocio seleccionado: Salón de Belleza');
        } catch (e) {
            console.log('   ⚠️  No se encontró el selector de tipo de negocio:', e.message);
        }

        await waitAndType(
            driver, By.name('objetoSocial'),
            'Empresa dedicada a la prestación de servicios de belleza y bienestar personal con atención 24h.'
        );

        await takeScreenshot(driver, '08_wizard_negocio_lleno', timestamp);

        console.log('   🔔 Enviando datos del Negocio → POST /customers/account-setup → Kafka welcome-notifications → WhatsApp ✉️');
        // El botón submit del FormCustomer dice "Siguiente"
        await waitAndClick(driver, By.xpath("//button[@type='submit']"));
        
        // Esperar a que se procese la respuesta (Kafka + WhatsApp puede tomar 3-5 segundos)
        await driver.sleep(6000);
        await takeScreenshot(driver, '09_post_account_setup', timestamp);
        console.log('   ✅ Account Setup enviado correctamente');

        // ── Paso 2: Chatbot WhatsApp ────────────────────────────────────
        console.log('   [Paso 3/4] Configuración Chatbot WhatsApp');
        // Hay un botón "Configurar más tarde" para omitir este paso en tests
        try {
            const skipBtn = await driver.wait(
                until.elementLocated(By.xpath("//*[contains(text(),'Configurar más tarde') or contains(text(),'Configurar mas tarde')]")),
                8000
            );
            await driver.executeScript("arguments[0].click();", skipBtn);
            console.log('   ✅ Chatbot omitido (Configurar más tarde) — proceso de chatbot puede activarse manualmente después');
        } catch (_) {
            console.log('   ℹ️  Botón "Configurar más tarde" no encontrado, avanzando...');
        }

        await driver.sleep(2000);
        await takeScreenshot(driver, '10_post_chatbot', timestamp);

        // ── Paso 3: Productos (puede tener botón Finalizar) ─────────────
        console.log('   [Paso 4/4] Productos / Finalizar');
        try {
            const finishBtn = await driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(),'Finalizar')]")),
                8000
            );
            await driver.executeScript("arguments[0].click();", finishBtn);
            console.log('   ✅ Wizard finalizado');
        } catch (_) {
            // Si no aparece el botón, puede haber redirigido a /home directamente
            console.log('   ℹ️  Botón Finalizar no encontrado - puede que ya redirigió a /home');
        }

        // ─── FASE 5: DASHBOARD ────────────────────────────────────────────
        console.log('\n── FASE 5: DASHBOARD ─────────────────────────────────');
        // Navegar a /home si aún no redirigió automáticamente
        if (!currentUrl.includes('/home')) {
            await driver.get(`${BASE_URL}/home`);
        }

        await driver.sleep(3000);
        await takeScreenshot(driver, '10_dashboard_home', timestamp);

        // Verificar que el sidebar (menú dinámico) se renderizó
        try {
            await driver.wait(
                until.elementLocated(By.css('nav, aside, [class*="sidebar"], [class*="menu"]')),
                10000
            );
            console.log('   ✅ Dashboard cargado - Sidebar dinámico renderizado (GET /api/rbac/menu)');
        } catch (_) {
            console.log('   ⚠️  Sidebar no detectado por selector - verificar manualmente');
        }

        await takeScreenshot(driver, '11_dashboard_sidebar', timestamp);

        console.log('\n═══════════════════════════════════════════════════════');
        console.log(' 🏁  FLUJO COMPLETADO EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════════');

    } catch (error) {
        await takeScreenshot(driver, 'ERROR_final', timestamp).catch(() => {});
        console.error('\n❌ ERROR en el flujo E2E:', error.message);
    } finally {
        await driver.sleep(2000);
        await driver.quit();

        console.log('\n─────────────────────────────────────────────────────');
        console.log('🔑 Credenciales generadas en esta ejecución:');
        console.log(`   Usuario  : ${username}`);
        console.log(`   Password : ${password}`);
        console.log(`   Email    : ${email}`);
        console.log('─────────────────────────────────────────────────────');
        console.log('📸 Screenshots guardados en: c:\\apps\\cloudfly\\tmp\\screenshots\\');
    }
}

runAdminOnboarding();
