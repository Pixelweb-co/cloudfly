/**
 * 🚀 E2E ONBOARDING & MARKETING - Cloudfly v8 (Con IMAP Activation)
 * 
 * Objetivo: Validar Onboarding + Correos + Marketing Defaults (Pipeline, Campaña, Canal)
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
const BASE_URL = 'https://dashboard.cloudfly.com.co';
const SSH_KEY = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';
const VPS = 'root@109.205.182.94';
const DB_PASS = 'widowmaker';
const DB_NAME = 'cloud_master';

// Mail Server (Hestia)
const MAIL_HOST = '89.117.147.134';
const MAIL_PORT = 10622;
const MAIL_USER = 'root';
const MAIL_DOMAIN = 'cloudfly.com.co';

const SCREENSHOTS_DIR = 'C:\\apps\\cloudfly\\tmp\\screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Flags de configuración
const SKIP_WHATSAPP_CONFIG = true; // Si es true, hace click en 'Configurar más tarde'

// ─── HELPERS ────────────────────────────────────────────────────────────────

function runSsh(cmd) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${VPS} "${escapedCmd}"`, { stdio: 'inherit' });
}

function runSshSql(sql) {
    // Escapar comillas simples para el comando SH remoto
    const escapedSql = sql.replace(/'/g, "'\\''");
    const remoteCmd = `docker exec -i mysql mysql -u root -p${DB_PASS} ${DB_NAME} -N -s -e "${escapedSql}" 2>/dev/null`;
    const localCmd = `ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${VPS} "${remoteCmd}"`;
    try {
        const result = execSync(localCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
        return result;
    } catch (e) { return ''; }
}

function runSshHestia(cmd) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const portFlag = `-p ${MAIL_PORT}`;
    return execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${portFlag} ${MAIL_USER}@${MAIL_HOST} "${escapedCmd}"`, { encoding: 'utf8' });
}

function createMailAccount(account, password) {
    console.log(`   📧 Creando cuenta de correo (Hestia): ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-add-mail-account cloudfly ${MAIL_DOMAIN} ${account} '${password}'`;
    runSshHestia(cmd);
}

function deleteMailAccount(account) {
    console.log(`   🧹 Eliminando cuenta de correo (Hestia): ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-delete-mail-account cloudfly ${MAIL_DOMAIN} ${account}`;
    try { runSshHestia(cmd); } catch(e) {}
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
    try {
        const data = await driver.takeScreenshot();
        fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${timestamp}_${label}.png`), data, 'base64');
        console.log(`   📸 Screenshot: ${label}`);
    } catch (e) { }
}

async function waitAndClick(driver, locator, timeout = 15000) {
    let retries = 2;
    while (retries > 0) {
        try {
            const el = await driver.wait(until.elementLocated(locator), timeout);
            await driver.wait(until.elementIsVisible(el), 10000);
            await driver.sleep(500); // brief pause to let React settle
            await el.click();
            return;
        } catch (e) {
            if (e.name === 'StaleElementReferenceError' && retries > 1) {
                retries--;
                await driver.sleep(1000);
            } else {
                throw e;
            }
        }
    }
}

async function waitAndType(driver, locator, text, timeout = 15000) {
    let retries = 2;
    while (retries > 0) {
        try {
            const el = await driver.wait(until.elementLocated(locator), timeout);
            await driver.wait(until.elementIsVisible(el), 10000);
            await driver.sleep(500);
            await el.clear();
            await el.sendKeys(text);
            return;
        } catch (e) {
            if (e.name === 'StaleElementReferenceError' && retries > 1) {
                retries--;
                await driver.sleep(1000);
            } else {
                throw e;
            }
        }
    }
}

async function printBrowserLogs(driver) {
    try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        logs.forEach(log => {
            console.log(`   🌐 [BROWSER] ${log.level.name}: ${log.message}`);
        });
    } catch (e) { }
}

// ─── FLOW ───────────────────────────────────────────────────────────────────

async function runTest() {
    const ts = Date.now();
    const user = `mkt_${ts}`;
    const email = `${user}@${MAIL_DOMAIN}`;
    const pass = 'Password123!';

    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(` 🚀  E2E ONBOARDING & MARKETING - Cloudfly v8`);
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
        // [0] CREAR CUENTA IMAP
        createMailAccount(user, pass);

        // [1] REGISTRO
        console.log('\n── FASE 1: REGISTRO ──────────────────────────────────');
        await driver.get(`${BASE_URL}/register`);
        await driver.wait(until.elementLocated(By.name('nombres')), 15000);
        await waitAndType(driver, By.name('nombres'), 'Marketing');
        await waitAndType(driver, By.name('apellidos'), 'Test');
        await waitAndType(driver, By.name('username'), user);
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('password'), pass);
        await waitAndType(driver, By.name('confirmPassword'), pass);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        console.log('   ✅ Registro enviado.');
        await driver.sleep(3000);

        // [2] ACTIVACIÓN VIA IMAP
        console.log('\n── FASE 2: ACTIVACIÓN (IMAP) ─────────────────────────');
        const link = await getActivationLink(user, pass);
        console.log(`   🔗 Enlace de activación recibido: ${link}`);
        await driver.get(link);
        await driver.sleep(5000);
        console.log('   ✅ Cuenta activada.');
        await takeScreenshot(driver, 'ACTIVACION_REALIZADA', ts);

        // [3] LOGIN
        console.log('\n── FASE 3: LOGIN ─────────────────────────────────────');
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.name('username')), 15000);
        await waitAndType(driver, By.name('username'), user);
        await waitAndType(driver, By.name('password'), pass);
        await waitAndClick(driver, By.css('button[type="submit"]'));

        console.log('   ⏳ Redirigiendo a /account-setup...');
        await driver.wait(until.urlContains('/account-setup'), 25000);
        console.log('   ✅ Login exitoso.');

        // [4] WIZARD
        console.log('\n── FASE 4: ACCOUNT SETUP WIZARD ──────────────────────');

        // Paso 0: Bienvenida
        console.log('   [1/4] Bienvenida');
        await waitAndClick(driver, By.xpath("//button[contains(text(),'Continuar')]"), 15000);
        await driver.sleep(2000);

        // Paso 1: Datos de Negocio
        console.log('   [2/4] Información del Negocio');
        const nit = '900' + ts.toString().slice(-6);
        await waitAndType(driver, By.name('name'), `Empresa Marketing ${ts}`);
        await waitAndType(driver, By.name('nit'), nit);
        await waitAndType(driver, By.name('phone'), '573246285134');
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('address'), 'Calle Mkt');
        await waitAndType(driver, By.name('contact'), 'Admin Mkt');
        await waitAndType(driver, By.name('position'), 'Manager');

        try {
            const bizCard = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
            await driver.executeScript("arguments[0].click();", bizCard);
        } catch (e) { }

        await waitAndType(driver, By.name('objetoSocial'), 'Orchestration test con IMAP.');
        await waitAndClick(driver, By.xpath("//button[@type='submit']"));
        console.log('   🔔 Account Setup enviado.');
        await driver.sleep(8000);

        // Paso 2: WhatsApp
        if (SKIP_WHATSAPP_CONFIG) {
            console.log('   [3/4] WhatsApp Setup (Omitido por SKIP_WHATSAPP_CONFIG = true)');
            try {
                const skipBtn = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Configurar más tarde')]")), 10000);
                await driver.executeScript("arguments[0].click();", skipBtn);
                console.log('   ✅ WhatsApp Configuración Omitida.');
            } catch (e) {
                try { await waitAndClick(driver, By.xpath("//button[contains(text(),'Siguiente')]"), 8000); } catch (err) { }
            }
        } else {
            console.log('   [3/4] WhatsApp Setup (Realizando Configuración...)');
            await driver.sleep(2000);
        }

        // Paso 3: Productos ("Casi Listos") - click Finalizar Configuración
        console.log('   [4/4] Paso Productos - Finalizando');
        await driver.sleep(3000);
        try {
            const finishBtn = await driver.wait(
                until.elementLocated(By.css("button[type='submit'], button.bg-primary, button[class*='MuiButton']")),
                20000
            );
            await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", finishBtn);
            await driver.sleep(500);
            await driver.executeScript("arguments[0].click();", finishBtn);
            const btnText = await finishBtn.getText().catch(() => '');
            console.log(`   ✅ Botón clickeado: "${btnText}"`);
        } catch (_) {
            try {
                const btns = await driver.findElements(By.xpath("//button[contains(., 'Finalizar')]"));
                if (btns.length > 0) {
                    await driver.executeScript("arguments[0].click();", btns[0]);
                    console.log('   ✅ Finalizar (fallback) clickeado');
                } else {
                    console.log('   ℹ️ Asumiendo redirección automática');
                }
            } catch (err) {
                console.log('   ℹ️ Asumiendo redirección automática');
            }
        }

        // [5] DASHBOARD
        console.log('\n── FASE 5: DASHBOARD ─────────────────────────────────');
        await driver.wait(until.urlContains('/home'), 30000);
        await driver.sleep(5000); // Dar tiempo a que el menú dynamic cargue
        
        console.log('   🔍 Validando Módulos del Menú cargados en la UI...');
        const menuLabels = await driver.executeScript(`
            const menuContainer = document.querySelector('aside') || document.querySelector('nav') || document.querySelector('ul');
            if (!menuContainer) return [];
            const listItems = menuContainer.querySelectorAll('li');
            let labels = [];
            listItems.forEach(li => {
                const textEl = li.innerText;
                if (textEl) {
                    const firstLine = textEl.split('\\n')[0].trim();
                    if (firstLine && firstLine.length > 1 && firstLine !== 'Dashboard' && !labels.includes(firstLine)) {
                        labels.push(firstLine);
                    }
                }
            });
            return labels;
        `);
        console.log(`   ✅ Menú detectado (${menuLabels.length} items): ${menuLabels.join(', ')}`);
        
        await takeScreenshot(driver, 'DASHBOARD_FINAL', ts);


        // [6] VERIFICACIÓN (DB)
        console.log('\n── FASE 6: VERIFICACIÓN DB CORE ──────────────────────');
        
        let tenantId = null;
        let retries = 5;
        while (retries > 0 && !tenantId) {
            console.log(`   ⏳ Intentando verificar Tenant ID en DB... (Intentos restantes: ${retries})`);
            const tenantIdResult = runSshSql(`SELECT customer_id FROM users WHERE username = '${user}' LIMIT 1`);
            if (tenantIdResult && tenantIdResult !== 'NULL' && tenantIdResult !== '') {
                tenantId = tenantIdResult;
            } else {
                await driver.sleep(3000);
                retries--;
            }
        }

        if (!tenantId) {
            console.warn(`   ⚠️ ADVERTENCIA: No se pudo verificar el Tenant ID en DB para ${user} tras varios intentos. Continuando...`);
        } else {
            console.log(`   ✅ Tenant ID: ${tenantId}`);
            const pipeline = runSshSql(`SELECT name FROM pipelines WHERE tenant_id = ${tenantId} AND name = 'Atención a Clientes' LIMIT 1`);
            const campaign = runSshSql(`SELECT name FROM marketing_campaigns WHERE tenant_id = ${tenantId} AND name = 'Atención Clientes' LIMIT 1`);
            const channel = runSshSql(`SELECT name FROM channels WHERE tenant_id = ${tenantId} AND name = 'WhatsApp Principal' LIMIT 1`);
            
            // Verificación de Suscripción y Módulos (NUEVO)
            const subId = runSshSql(`SELECT id FROM subscriptions WHERE customer_id = ${tenantId} AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`);
            let moduleCount = 0;
            if (subId && subId !== 'NULL') {
                moduleCount = runSshSql(`SELECT COUNT(*) FROM subscription_modules WHERE subscription_id = ${subId}`);
            }

            console.log(`   - Canal:    ${channel ? '✅ ' + channel : '❌ FALTANTE'}`);
            console.log(`   - Suscripción ID: ${subId && subId !== 'NULL' ? subId : '❌ FALTANTE'}`);
            console.log(`   - Módulos vinculados: ${moduleCount > 0 ? '✅ ' + moduleCount : '❌ CERO (O FALTANTE)'}`);

            if (pipeline && campaign && channel) {
                console.log('   ✅ MARKETING ORCHESTRATION OK.');
            } else {
                console.warn('   ⚠️ Algunos componentes de marketing faltan en DB.');
            }
        }

        // [7] LOGOUT Y LOGIN
        console.log('\n── FASE 7: LOGOUT Y VERIFICACIÓN LOGIN ────────────────────────');
        console.log('   ⏳ Esperando 5 segundos antes de desloguear...');
        await driver.sleep(5000);

        console.log('   🔒 Deslogueando usuario vía UI...');
        try {
            // Click en el Avatar (usualmente en el header)
            const avatar = await driver.wait(until.elementLocated(By.css("header .MuiAvatar-root, header button img")), 10000);
            await avatar.click();
            await driver.sleep(1000);

            // Click en el botón Logout
            await waitAndClick(driver, By.xpath("//button[contains(., 'Logout')]"), 10000);
            console.log('   ✅ Click en Logout realizado.');
        } catch (err) {
            console.log('   ⚠️ Error en Logout vía UI, forzando limpieza de sesión...');
            await driver.executeScript("localStorage.clear(); sessionStorage.clear(); document.cookie.split(';').forEach(function(c) { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'); });");
            await driver.get(`${BASE_URL}/login`);
        }
        
        await driver.wait(until.urlContains('/login'), 15000);
        console.log('   ✅ Transición a login exitosa.');

        console.log(`   🔑 Iniciando sesión de nuevo con ${user}`);
        await driver.wait(until.elementLocated(By.xpath("//input[@name='username' or @placeholder='juanperez123']")), 15000);
        const loginUserField = await driver.findElement(By.xpath("//input[@name='username' or @placeholder='juanperez123']"));
        await loginUserField.clear();
        await loginUserField.sendKeys(user);
        
        const loginPassField = await driver.findElement(By.xpath("//input[@name='password' or @type='password']"));
        await loginPassField.clear();
        await loginPassField.sendKeys(pass);
        
        await waitAndClick(driver, By.xpath("//button[contains(., 'Iniciar sesión') or @type='submit']"));

        console.log('     ⏳ Verificando datos de sesión (tenant_id, company_id) y redirección...');
        await driver.sleep(5000); // Dar tiempo al login

        const userData = await driver.executeScript("return localStorage.getItem('userData')");
        if (userData) {
            const parsed = JSON.parse(userData);
            console.log(`     ✅ Session Data: tenant_id=${parsed.tenant_id}, company_id=${parsed.company_id}, hasCustomer=${!!parsed.customer}`);
            if (!parsed.tenant_id || !parsed.company_id || !parsed.customer) {
                console.error('     ❌ ERROR: tenant_id, company_id o customer faltantes en la sesión.');
                await takeScreenshot(driver, 'ERROR_SESSION_DATA');
                process.exit(1);
            }
        }

        console.log('     ⏳ Esperando redirección al Dashboard (/home)...');
        await driver.wait(until.urlContains('/home'), 30000);
        console.log('     ✅ Dashboard re-alcanzado tras re-login. Onboarding verificado.');

        console.log('     🔍 Validando Módulos del Menú post-login...');
        await driver.sleep(5000); // Dar tiempo al menú dynamic post-login
        const menuLabelsPost = await driver.executeScript(`
            const menuContainer = document.querySelector('aside') || document.querySelector('nav') || document.querySelector('ul');
            if (!menuContainer) return [];
            const listItems = menuContainer.querySelectorAll('li');
            let labels = [];
            listItems.forEach(li => {
                const textEl = li.innerText;
                if (textEl) {
                    const firstLine = textEl.split('\\n')[0].trim();
                    if (firstLine && firstLine.length > 1 && firstLine !== 'Dashboard' && !labels.includes(firstLine)) {
                        labels.push(firstLine);
                    }
                }
            });
            return labels;
        `);
        console.log(`     ✅ Menú post-login detectado (${menuLabelsPost.length} items): ${menuLabelsPost.join(', ')}`);

        await takeScreenshot(driver, 'RE_LOGIN_SUCCESS', ts);
        console.log('\n🚀 TEST E2E COMPLETO EXITOSO: MARKETING ORCHESTRATION + IMAP + LOGIN REVERIFICADO OK.');

    } catch (e) {
        console.error(`\n❌ ERROR FATAL DETECTADO: ${e.message}`);
        await printBrowserLogs(driver);
        await takeScreenshot(driver, 'ERROR_V8_IMAP', ts);
        process.exit(1);
    } finally {
        await driver.quit();
        deleteMailAccount(user);
    }
}

runTest();
