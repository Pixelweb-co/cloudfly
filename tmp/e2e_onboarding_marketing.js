/**
 * 🚀 E2E ONBOARDING & MARKETING - Cloudfly v8 (Perfect Mirror of Admin Flow)
 * 
 * Objetivo: Validar Onboarding + Marketing Defaults (Pipeline, Campaña, Canal)
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logging = require('selenium-webdriver/lib/logging');

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
const BASE_URL  = 'https://dashboard.cloudfly.com.co';
const SSH_KEY   = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';
const VPS       = 'root@109.205.182.94';
const DB_PASS   = 'widowmaker';
const DB_NAME   = 'cloud_master';

const SCREENSHOTS_DIR = 'C:\\apps\\cloudfly\\tmp\\screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ─── HELPERS ────────────────────────────────────────────────────────────────

function runSsh(cmd) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${VPS} "${escapedCmd}"`, { stdio: 'inherit' });
}

function runSshSql(sql) {
    const remoteCmd = `docker exec -i mysql mysql -u root -p${DB_PASS} ${DB_NAME} -N -s 2>/dev/null`;
    const localCmd  = `echo ${JSON.stringify(sql)} | ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${VPS} "${remoteCmd}"`;
    try {
        return execSync(localCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) { return ''; }
}

function activateUser(username) {
    console.log(`   ✅ Activando usuario "${username}" via DB SSH...`);
    runSsh(`docker exec mysql mysql -u root -p${DB_PASS} ${DB_NAME} -e "UPDATE users SET is_enabled = true WHERE username = '${username}';"`);
}

async function takeScreenshot(driver, label, timestamp) {
    try {
        const data = await driver.takeScreenshot();
        fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${timestamp}_${label}.png`), data, 'base64');
        console.log(`   📸 Screenshot: ${label}`);
    } catch(e) {}
}

async function waitAndClick(driver, locator, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    await el.click();
}

async function waitAndType(driver, locator, text, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await el.clear();
    await el.sendKeys(text);
}

async function printBrowserLogs(driver) {
    try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        logs.forEach(log => {
            console.log(`   🌐 [BROWSER] ${log.level.name}: ${log.message}`);
        });
    } catch (e) {}
}

// ─── FLOW ───────────────────────────────────────────────────────────────────

async function runTest() {
    const ts = Date.now();
    const user = `mkt_${ts}`;
    const email = `${user}@testcloudfly.com`;
    const pass = 'Password123!'; // Usamos el de admin por si acaso hay reglas de complejidad
    
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

        // [2] ACTIVACIÓN (Simulada DB)
        console.log('\n── FASE 2: ACTIVACIÓN ────────────────────────────────');
        activateUser(user);
        await driver.sleep(2000);

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
        await waitAndType(driver, By.name('name'),   `Empresa Marketing ${ts}`); 
        await waitAndType(driver, By.name('nit'),    nit);
        await waitAndType(driver, By.name('phone'), '573246285134');
        await waitAndType(driver, By.name('email'), 'mkt@test.com');
        await waitAndType(driver, By.name('address'), 'Calle Mkt');
        await waitAndType(driver, By.name('contact'), 'Admin Mkt');
        await waitAndType(driver, By.name('position'), 'Manager');
        
        try {
            const bizCard = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
            await driver.executeScript("arguments[0].click();", bizCard);
        } catch(e) {}
        
        await waitAndType(driver, By.name('objetoSocial'), 'Orchestration test.');
        await waitAndClick(driver, By.xpath("//button[@type='submit']"));
        console.log('   🔔 Account Setup enviado.');
        await driver.sleep(8000);

        // Paso 2: WhatsApp
        console.log('   [3/4] WhatsApp Setup');
        try {
            const skipBtn = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Configurar más tarde')]")), 10000);
            await driver.executeScript("arguments[0].click();", skipBtn);
            console.log('   ✅ WhatsApp omitido.');
        } catch (e) {
            try { await waitAndClick(driver, By.xpath("//button[contains(text(),'Siguiente')]"), 8000); } catch(err) {}
        }

        // Paso 3: Productos ("Casi Listos") - click Finalizar Configuración
        console.log('   [4/4] Paso Productos - Finalizando');
        await driver.sleep(3000);
        try {
            // Buscar el botón por tipo submit (el único botón de tipo submit en este paso)
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
            // Fallback: buscar cualquier botón que contenga Finalizar
            try {
                const btns = await driver.findElements(By.xpath("//button[contains(., 'Finalizar')]"));
                if (btns.length > 0) {
                    await driver.executeScript("arguments[0].click();", btns[0]);
                    console.log('   ✅ Finalizar (fallback) clickeado');
                } else {
                    console.log('   ℹ️ Asumiendo redirección automática');
                }
            } catch(err) {
                console.log('   ℹ️ Asumiendo redirección automática');
            }
        }

        // [5] DASHBOARD
        console.log('\n── FASE 5: DASHBOARD ─────────────────────────────────');
        await driver.wait(until.urlContains('/home'), 40000);
        await driver.sleep(3000);
        await takeScreenshot(driver, 'DASHBOARD_FINAL', ts);

        // [6] VERIFICACIÓN (DB)
        console.log('\n── FASE 6: VERIFICACIÓN DB CORE ──────────────────────');
        const tenantId = runSshSql(`SELECT id FROM clientes WHERE identificacion_cliente = '${nit}' LIMIT 1`);
        
        if (!tenantId) {
            console.error('❌ ERROR: El Tenant no se creó en DB.');
            await printBrowserLogs(driver);
            process.exit(1);
        }
        console.log(`   ✅ Tenant ID: ${tenantId}`);

        const pipeline = runSshSql(`SELECT name FROM pipelines WHERE tenant_id = ${tenantId} AND name = 'Atención a Clientes' LIMIT 1`);
        const campaign = runSshSql(`SELECT name FROM marketing_campaigns WHERE tenant_id = ${tenantId} AND name = 'Atención Clientes' LIMIT 1`);
        const channel  = runSshSql(`SELECT name FROM channels WHERE tenant_id = ${tenantId} AND name = 'WhatsApp Principal' LIMIT 1`);

        console.log(`   - Pipeline: ${pipeline ? '✅ ' + pipeline : '❌ FALTANTE'}`);
        console.log(`   - Campaña:  ${campaign ? '✅ ' + campaign : '❌ FALTANTE'}`);
        console.log(`   - Canal:    ${channel ? '✅ ' + channel : '❌ FALTANTE'}`);

        if (pipeline && campaign && channel) {
            console.log('\n🚀 TEST E2E EXITOSO: MARKETING ORCHESTRATION OK.');
        } else {
            console.error('\n⚠️ TEST FALLIDO: Faltan componentes.');
            process.exit(1);
        }

    } catch (e) {
        console.error(`\n❌ ERROR FATAL: ${e.message}`);
        await printBrowserLogs(driver);
        await takeScreenshot(driver, 'ERROR_V8', ts);
        process.exit(1);
    } finally {
        await driver.quit();
    }
}

runTest();
