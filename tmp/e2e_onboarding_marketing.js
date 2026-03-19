/**
 * 🚀 E2E ONBOARDING & MARKETING - Cloudfly (v6 - Final Unified)
 * 
 * Basado en: e2e_admin_onboarding.js (Proven OK structure)
 * Mezclado con: e2e_test.js (Real Mailer flow)
 * Objetivo: Validar Onboarding + Marketing Defaults (Pipeline, Campaña, Canal, ChatbotType)
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logging = require('selenium-webdriver/lib/logging');

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
const BASE_URL  = 'https://dashboard.cloudfly.com.co';
const SSH_KEY   = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';

// Mail Server (Hestia)
const MAIL_HOST = '89.117.147.134';
const MAIL_PORT = 10622;
const MAIL_USER = 'root';
const MAIL_DOMAIN = 'cloudfly.com.co';

// API Server (VPS)
const API_VPS   = 'root@109.205.182.94';
const DB_PASS   = 'widowmaker';
const DB_NAME   = 'cloud_master';

const SCREENSHOTS_DIR = 'C:\\apps\\cloudfly\\tmp\\screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ─── HELPERS ────────────────────────────────────────────────────────────────

function runSsh(cmd, target = API_VPS, port = 22) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const portFlag = port !== 22 ? `-p ${port}` : '';
    return execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${portFlag} ${target} "${escapedCmd}"`, { encoding: 'utf8' });
}

function runSshSql(sql) {
    // Usamos piping para evitar problemas de comillas complejas en SQL
    const remoteCmd = `docker exec -i mysql mysql -u root -p${DB_PASS} ${DB_NAME} -N -s 2>/dev/null`;
    const localCmd  = `echo ${JSON.stringify(sql)} | ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${API_VPS} "${remoteCmd}"`;
    try {
        return execSync(localCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
        return '';
    }
}

function createMailAccount(account, password) {
    console.log(`   📧 Creando cuenta de correo: ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-add-mail-account cloudfly ${MAIL_DOMAIN} ${account} '${password}'`;
    try { runSsh(cmd, `${MAIL_USER}@${MAIL_HOST}`, MAIL_PORT); } catch(e) {}
}

function deleteMailAccount(account) {
    console.log(`   🧹 Eliminando cuenta de correo: ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-delete-mail-account cloudfly ${MAIL_DOMAIN} ${account}`;
    try { runSsh(cmd, `${MAIL_USER}@${MAIL_HOST}`, MAIL_PORT); } catch(e) {}
}

async function getActivationLink(user, pass, timeoutMs = 120000) {
    console.log(`   📬 Esperando email de activación para ${user}...`);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        let client = new ImapFlow({
            host: MAIL_HOST, port: 993, secure: true,
            auth: { user: `${user}@${MAIL_DOMAIN}`, pass: pass },
            tls: { rejectUnauthorized: false }, logger: false
        });
        try {
            await client.connect();
            let mailbox = await client.status('INBOX', { messages: true });
            if (mailbox.messages > 0) {
                let lock = await client.getMailboxLock('INBOX');
                try {
                    for await (let msg of client.fetch(`${mailbox.messages}:*`, { source: true })) {
                        let parsed = await simpleParser(msg.source);
                        let text = parsed.text || parsed.html || "";
                        const linkMatch = text.match(/https?:\/\/dashboard\.cloudfly\.com\.co\/verificate\/[a-zA-Z0-9-]+/);
                        if (linkMatch) return linkMatch[0];
                    }
                } finally { lock.release(); }
            }
            await client.logout();
        } catch (e) { try { await client.logout(); } catch(err) {} }
        await new Promise(r => setTimeout(r, 8000));
    }
    throw new Error("Timeout esperando el email de activación");
}

async function takeScreenshot(driver, label, timestamp) {
    const data = await driver.takeScreenshot();
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${timestamp}_${label}.png`), data, 'base64');
    console.log(`   📸 Screenshot: ${label}`);
}

async function waitAndClick(driver, locator, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", el);
    await driver.sleep(1000);
    // Usamos JS click siempre para los botones del wizard que a veces están tapados
    await driver.executeScript("arguments[0].click();", el);
}

async function waitAndType(driver, locator, text, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    await el.clear();
    await el.sendKeys(text);
}

async function printBrowserLogs(driver) {
    try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        logs.forEach(log => {
            console.log(`   🌐 [BROWSER] ${log.level.name}: ${log.message}`);
        });
    } catch (e) {
        // console.warn('No se pudieron obtener los logs del navegador');
    }
}

// ─── FLOW ───────────────────────────────────────────────────────────────────

async function runTest() {
    const ts = Date.now();
    const user = `marketing_${ts}`;
    const email = `${user}@${MAIL_DOMAIN}`;
    const pass = 'Cloudfly2025*';
    
    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(` 🚀  E2E ONBOARDING & MARKETING - Cloudfly v6`);
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(` Usuario   : ${user}`);
    console.log(` Email     : ${email}`);
    
    let chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--start-maximized', '--no-sandbox', '--disable-dev-shm-usage');
    
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
    chromeOptions.setLoggingPrefs(prefs);

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    try {
        // [1/6] REGISTRO
        console.log('\n── FASE 1: REGISTRO ──────────────────────────────────');
        createMailAccount(user, pass);
        await driver.get(`${BASE_URL}/register`);
        
        await waitAndType(driver, By.name('nombres'), 'Marketing');
        await waitAndType(driver, By.name('apellidos'), 'Test');
        await waitAndType(driver, By.name('username'), user);
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('password'), pass);
        await waitAndType(driver, By.name('confirmPassword'), pass);
        
        await takeScreenshot(driver, '01_registro_lleno', ts);
        
        // El botón en register es "Iniciar prueba" o "Registrarse" o Submit
        await waitAndClick(driver, By.xpath("//button[@type='submit'] | //button[contains(.,'Iniciar prueba')]"));
        console.log('   ✅ Formulario enviado.');
        await printBrowserLogs(driver);

        // [2/6] ACTIVACIÓN
        console.log('\n── FASE 2: ACTIVACIÓN REAL (Email) ──────────────────');
        const link = await getActivationLink(user, pass);
        console.log(`   ✅ Link de activación obtenido.`);
        await driver.get(link);
        await driver.sleep(5000);
        await takeScreenshot(driver, '02_verificado', ts);

        // [3/6] LOGIN
        console.log('\n── FASE 3: LOGIN ─────────────────────────────────────');
        await driver.get(`${BASE_URL}/login`);
        await waitAndType(driver, By.name('username'), user);
        await waitAndType(driver, By.name('password'), pass);
        await takeScreenshot(driver, '03_login_form', ts);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        
        console.log('   ⏳ Esperando redirección a /account-setup...');
        await driver.wait(until.urlContains('/account-setup'), 25000);
        console.log('   ✅ Login exitoso, redirigido a /account-setup');
        await printBrowserLogs(driver);
        await takeScreenshot(driver, '04_account_setup_inicio', ts);

        // [4/6] WIZARD
        console.log('\n── FASE 4: ACCOUNT SETUP WIZARD ──────────────────────');
        
        // Paso 0: Bienvenida
        console.log('   [1/4] Bienvenida');
        try {
            // Intentamos varios selectores comunes en los tests previos
            await waitAndClick(driver, By.xpath("//button[contains(text(),'Continuar')] | //button[contains(@class,'next-wizard-step')]"), 10000);
        } catch (e) {
            console.log('   ℹ️ Fallback click en Continuar/Next');
            const btn = await driver.findElement(By.xpath("//button[contains(.,'Continuar')]"));
            await driver.executeScript("arguments[0].click();", btn);
        }
        await driver.sleep(2000);

        // Paso 1: Datos de Negocio
        console.log('   [2/4] Información del Negocio');
        const nit = '900' + ts.toString().slice(-6);
        await waitAndType(driver, By.name('nit'),          nit);
        await waitAndType(driver, By.name('phone'), '573246285134');
        await waitAndType(driver, By.name('email'), 'mkt@test.com');
        await waitAndType(driver, By.name('address'), 'Sede E2E');
        await waitAndType(driver, By.name('contact'), 'Admin Mkt');
        await waitAndType(driver, By.name('position'), 'Manager');
        
        const bizCard = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
        await driver.executeScript("arguments[0].click();", bizCard);
        
        await waitAndType(driver, By.name('objetoSocial'), 'Marketing automation activation test.');
        await takeScreenshot(driver, '05_wizard_negocio_lleno', ts);
        
        console.log('   🔔 Enviando datos del Negocio → Activación Campaña Marketing...');
        // El botón en este paso dice "Siguiente" o es el submit del form
        await waitAndClick(driver, By.xpath("//button[@type='submit'] | //button[contains(text(),'Siguiente')]"));
        await printBrowserLogs(driver);
        await driver.sleep(8000);

        // Paso 2: Chatbot (QR) - Omitimos si es posible para testear infra base
        console.log('   [3/4] WhatsApp Setup');
        try {
            const skipBtn = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Configurar más tarde')]")), 10000);
            await driver.executeScript("arguments[0].click();", skipBtn);
            console.log('   ✅ Paso WhatsApp omitido.');
        } catch (e) {
            console.log('   ℹ️ Omitir no encontrado, buscando Siguiente...');
            try { await waitAndClick(driver, By.xpath("//button[contains(text(),'Siguiente')]"), 8000); } catch(err) {}
        }

        // Paso 3: Productos / Finalizar
        console.log('   [4/4] Productos / Finalizar');
        try {
            await waitAndClick(driver, By.xpath("//button[contains(@class,'final-wizard-step')] | //button[contains(text(),'Finalizar')]"), 15000);
        } catch (e) {
            console.log('   ℹ️ Finalizar no encontrado, intentando click por texto...');
            const finish = await driver.findElement(By.xpath("//button[contains(.,'Finalizar')]"));
            await driver.executeScript("arguments[0].click();", finish);
        }
        console.log('   ✅ Wizard completado.');
        await printBrowserLogs(driver);

        // [5/6] DASHBOARD
        console.log('\n── FASE 5: DASHBOARD ─────────────────────────────────');
        await driver.wait(until.urlContains('/home'), 40000);
        await driver.sleep(5000);
        await takeScreenshot(driver, '06_home', ts);
        await printBrowserLogs(driver);

        // [6/6] VERIFICACIÓN DE MARKETING (DB)
        console.log('\n── FASE 6: VERIFICACIÓN COMPONENTES MARKETING ────────');
        const tenantId = runSshSql(`SELECT id FROM clientes WHERE nombre_cliente LIKE '%Empresa Mkt ${ts}%' LIMIT 1`);
        if (!tenantId) throw new Error("No se pudo obtener el Tenant ID");
        
        const pipeline = runSshSql(`SELECT name FROM pipelines WHERE tenant_id = ${tenantId} AND name = 'Atención a Clientes' LIMIT 1`);
        const campaign = runSshSql(`SELECT name FROM marketing_campaigns WHERE tenant_id = ${tenantId} AND name = 'Atención Clientes' LIMIT 1`);
        const channel  = runSshSql(`SELECT name FROM channels WHERE tenant_id = ${tenantId} AND name = 'WhatsApp Principal' LIMIT 1`);
        const chatbot  = runSshSql(`SELECT channel_type FROM channel_configs WHERE tenant_id = ${tenantId} LIMIT 1`);

        console.log(`   📊 Resultados para Tenant ${tenantId}:`);
        console.log(`   - Pipeline   : ${pipeline ? '✅ ' + pipeline : '❌ FALTANTE'}`);
        console.log(`   - Campaña    : ${campaign ? '✅ ' + campaign : '❌ FALTANTE'}`);
        console.log(`   - Canal      : ${channel ? '✅ ' + channel : '❌ FALTANTE'}`);
        console.log(`   - ChatbotType: ${chatbot ? '✅ ' + chatbot : '❌ FALTANTE'}`);

        if (pipeline && campaign && channel && chatbot) {
            console.log('\n🚀 TEST E2E EXITOSO: Todos los componentes de marketing fueron creados automáticamente.');
        } else {
            console.error('\n⚠️ TEST FALLIDO: Faltan componentes en la base de datos.');
            process.exit(1);
        }

    } catch (e) {
        console.error(`\n❌ ERROR FATAL: ${e.message}`);
        await takeScreenshot(driver, 'ERROR_FINAL', ts);
        process.exit(1);
    } finally {
        await driver.quit();
        deleteMailAccount(user);
    }
}

runTest();
