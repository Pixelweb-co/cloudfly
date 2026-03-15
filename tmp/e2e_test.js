/**
 * E2E Selenium Test - Flujo Onboarding ADMIN Completo (FIXED)
 */

const { Builder, By, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL  = 'https://dashboard.cloudfly.com.co';
const PHONE_WA  = '573246285134'; 
const SSH_KEY_P = 'C:/Users/Edwin/.ssh/id_rsa_cloudfly';
const VPS       = 'root@109.205.182.94';

// Mail Server (Hestia)
const MAIL_HOST = '89.117.147.134';
const MAIL_PORT = 10622;
const MAIL_USER = 'root';
const MAIL_DOMAIN = 'cloudfly.com.co';

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ─── Helpers ────────────────────────────────────────────────────────────────

function runSsh(cmd, target = VPS, port = 22) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const portFlag = port !== 22 ? `-p ${port}` : '';
    return execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_P}" ${portFlag} ${target} "${escapedCmd}"`, { encoding: 'utf8' });
}

function createMailAccount(account, password) {
    console.log(`   📧 Creando cuenta de correo: ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-add-mail-account cloudfly ${MAIL_DOMAIN} ${account} '${password}'`;
    runSsh(cmd, `${MAIL_USER}@${MAIL_HOST}`, MAIL_PORT);
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
    const dir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const img = await driver.takeScreenshot();
    fs.writeFileSync(path.join(dir, `${timestamp}_${label}.png`), img, 'base64');
    console.log(`   📸 Screenshot: ${label}`);
}

async function waitAndClick(driver, locator, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", el);
    await driver.sleep(1000);
    try { await el.click(); } catch (e) { await driver.executeScript("arguments[0].click();", el); }
}

async function waitAndType(driver, locator, text, timeout = 15000) {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);
    await el.clear();
    await el.sendKeys(text);
}

// ─── Main Flow ───────────────────────────────────────────────────────────────

async function runE2E() {
    const timestamp = Date.now();
    const username  = `admin_${timestamp}`;
    const password  = 'Cloudfly2025*';
    const email     = `${username}@${MAIL_DOMAIN}`;

    let chromeOptions = new chrome.Options();
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
    await driver.manage().window().setRect({ width: 1440, height: 900 });

    try {
        console.log('\n[1/5] REGISTRO');
        createMailAccount(username, password);
        await driver.get(`${BASE_URL}/register`);
        await waitAndType(driver, By.name('nombres'), 'Admin');
        await waitAndType(driver, By.name('apellidos'), 'E2E');
        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('password'), password);
        await waitAndType(driver, By.name('confirmPassword'), password);
        await takeScreenshot(driver, '01_registro', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));

        console.log('\n[2/5] ACTIVACIÓN');
        const link = await getActivationLink(username, password);
        await driver.get(link);
        await driver.sleep(4000);
        await takeScreenshot(driver, '01b_activado', timestamp);

        console.log('\n[3/5] LOGIN');
        await driver.get(`${BASE_URL}/login`);
        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('password'), password);
        await takeScreenshot(driver, '02_login', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        await driver.wait(until.urlContains('/account-setup'), 20000);

        console.log('\n[4/5] WIZARD');
        // Paso 0
        await waitAndClick(driver, By.className('next-wizard-step'));
        await driver.sleep(2000);
        // Paso 1
        await waitAndType(driver, By.name('name'), 'Empresa ' + timestamp);
        await waitAndType(driver, By.name('nit'), '900123456-1');
        await waitAndType(driver, By.name('phone'), PHONE_WA);
        await waitAndType(driver, By.name('email'), 'contacto@empresa.com');
        await waitAndType(driver, By.name('address'), 'Calle 123 # 45-67, Ciudad');
        await waitAndType(driver, By.name('contact'), 'Admin E2E');
        await waitAndType(driver, By.name('position'), 'Manager');
        
        const bizCard = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
        await driver.executeScript("arguments[0].click();", bizCard);
        await waitAndType(driver, By.name('objetoSocial'), 'Test de chatbot IA.');
        await takeScreenshot(driver, '04_wizard_negocio', timestamp);
        await waitAndClick(driver, By.xpath("//button[@type='submit']"));
        await driver.sleep(6000);

        // Paso 2: Chatbot (QR)
        console.log('   ▶ Pasó 2: Chatbot (QR)');
        console.log('   📍 URL Actual:', await driver.getCurrentUrl());
        
        try {
            const qrBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Generar Código QR')]")), 20000);
            await driver.executeScript("arguments[0].scrollIntoView();", qrBtn);
            await driver.sleep(1000);
            await qrBtn.click();
            console.log('   ✅ Botón QR clickeado');
            
            // Esperar QR
            await driver.wait(until.elementLocated(By.css("img[alt='WhatsApp QR Code']")), 60000);
            console.log('   📸 QR visible. ESPERANDO 120 SEGUNDOS PARA ESCANEO MANUAL...');
            await driver.sleep(5000); // Dar tiempo a renderizar
            
            const qrImg = await driver.takeScreenshot();
            fs.writeFileSync(path.join(SCREENSHOT_DIR, `${timestamp}_06_wizard_qr.png`), qrImg, 'base64');
            
            // Pausa larga para el usuario
            await driver.sleep(120000); 
            console.log('   ⏰ Tiempo de escaneo finalizado.');
            await takeScreenshot(driver, '06b_post_escaneo', timestamp);

            // Intentar continuar (Siguiente) - El botón debería estar habilitado tras la vinculación
            try {
                const nextBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Siguiente')]")), 15000);
                await nextBtn.click();
                console.log('   ✅ Botón Siguiente clickeado tras escaneo');
            } catch (errStep) {
                console.log('   ⚠️ No se encontró botón Siguiente, intentando omitir para continuar el wizard...');
                const skipBtn = await driver.wait(until.elementLocated(By.className('omit-chatbot-step')), 10000);
                await skipBtn.click();
            }
        } catch (err) {
            console.log('   ⚠️ Error en paso QR:', err.message);
            console.log('   📍 URL en momento de error:', await driver.getCurrentUrl());
            const logs = await driver.manage().logs().get('browser');
            console.log('   📜 Browser Logs:', JSON.stringify(logs.slice(-10), null, 2));
            
            await driver.takeScreenshot().then(image => fs.writeFileSync(`${SCREENSHOT_DIR}/${timestamp}_ERROR_qr.png`, image, 'base64'));
            throw err;
        }

        // Paso 3: Productos
        console.log('   ▶ Pasó 3: Productos');
        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Mi Primer Producto')]")), 20000);
        await takeScreenshot(driver, '07_productos', timestamp);
        await waitAndClick(driver, By.className('final-wizard-step'));

        console.log('\n[5/5] DASHBOARD');
        await driver.wait(until.urlContains('/home'), 30000);
        await takeScreenshot(driver, '08_final', timestamp);
        console.log('\n✅ TEST COMPLETADO');

    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
        await takeScreenshot(driver, '99_FATAL', timestamp);
    } finally {
        await driver.quit();
        deleteMailAccount(username);
    }
}

runE2E();
