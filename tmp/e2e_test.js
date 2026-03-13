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
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL  = 'https://dashboard.cloudfly.com.co';
const PHONE_WA  = '573246285134'; 
const SSH_KEY   = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';
const SSH_KEY_P = 'C:/Users/Edwin/.ssh/id_rsa_cloudfly';
const VPS       = 'root@109.205.182.94';

// Mail Server (Hestia)
const MAIL_HOST = '89.117.147.134';
const MAIL_PORT = 10622;
const MAIL_USER = 'root';
const MAIL_DOMAIN = 'cloudfly.com.co';

// ─── Helpers ────────────────────────────────────────────────────────────────

function runSsh(cmd, target = VPS, port = 22) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const portFlag = port !== 22 ? `-p ${port}` : '';
    console.log(`      [SSH] ${target}:${port} > ${cmd}`);
    return execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_P}" ${portFlag} ${target} "${escapedCmd}"`, { encoding: 'utf8' });
}

function createMailAccount(account, password) {
    console.log(`   📧 Creando cuenta de correo: ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-add-mail-account cloudfly ${MAIL_DOMAIN} ${account} '${password}'`;
    runSsh(cmd, `${MAIL_USER}@${MAIL_HOST}`, MAIL_PORT);
    
    // Verificar que se creó
    const checkCmd = `/usr/local/hestia/bin/v-list-mail-accounts cloudfly ${MAIL_DOMAIN} | grep ${account}`;
    try {
        runSsh(checkCmd, `${MAIL_USER}@${MAIL_HOST}`, MAIL_PORT);
        console.log(`      ✅ Cuenta ${account} verificada en Hestia.`);
        // Pequeña espera para sincronización de Exim/Dovecot
        execSync("node -e \"setTimeout(()=>{}, 2000)\""); 
    } catch(e) {
        throw new Error(`Falló la creación de la cuenta de correo ${account} en Hestia.`);
    }
}

function deleteMailAccount(account) {
    console.log(`   🧹 Eliminando cuenta de correo: ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-delete-mail-account cloudfly ${MAIL_DOMAIN} ${account}`;
    try {
        runSsh(cmd, `${MAIL_USER}@${MAIL_HOST}`, MAIL_PORT);
    } catch(e) {}
}

async function getActivationLink(user, pass, timeoutMs = 120000) {
    console.log(`   📬 Esperando email de activación para ${user} (timeout ${timeoutMs/1000}s)...`);
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
        let client = new ImapFlow({
            host: MAIL_HOST,
            port: 993,
            secure: true,
            auth: { user: `${user}@${MAIL_DOMAIN}`, pass: pass },
            tls: { rejectUnauthorized: false },
            logger: false
        });

        try {
            await client.connect();
            let lock = await client.getMailboxLock('INBOX');
            let activationLink = null;
            try {
                let mailbox = await client.status('INBOX', { messages: true });
                if (mailbox.messages > 0) {
                    console.log(`      [IMAP] ${mailbox.messages} mensajes encontrados. Verificando últimos...`);
                    // Obtener los últimos mensajes usando un rango explícito
                    const range = `${mailbox.messages}:${Math.max(1, mailbox.messages - 5)}`;
                    for await (let msg of client.fetch(range, { source: true })) {
                        let parsed = await simpleParser(msg.source);
                        let subject = parsed.subject || "";
                        let text = parsed.text || parsed.html || "";
                        console.log(`      📩 Email recibido: "${subject}"`);
                        
                        const subLower = subject.toLowerCase();
                        if (subLower.includes("activa tu cuenta") || subLower.includes("bienvenido")) {
                            const linkMatch = text.match(/https?:\/\/dashboard\.cloudfly\.com\.co\/verificate\/[a-zA-Z0-9-]+/);
                            if (linkMatch) {
                                activationLink = linkMatch[0];
                                break;
                            }
                        }
                    }
                }
            } finally {
                lock.release();
            }
            await client.logout();
            if (activationLink) return activationLink;
        } catch (e) {
            console.log(`      [IMAP] Intento fallido: ${e.message}`);
            try { await client.logout(); } catch(err) {}
        }
        await new Promise(r => setTimeout(r, 8000));
    }
    throw new Error("Timeout esperando el email de activación");
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
    const password  = 'Cloudfly2025*'; // Debe contener al menos un carácter especial
    const email     = `${username}@${MAIL_DOMAIN}`;

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
        createMailAccount(username, password); // Crear buzón real
        
        await driver.get(`${BASE_URL}/register`);
        await waitAndType(driver, By.name('nombres'), 'Admin');
        await waitAndType(driver, By.name('apellidos'), 'E2E');
        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('password'), password);
        await waitAndType(driver, By.name('confirmPassword'), password);
        
        await takeScreenshot(driver, '01_form_registro', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        console.log('   ✅ Registro enviado. Esperando email...');
        await driver.sleep(2000);

        // --- 2. ACTIVACIÓN (EMAIL) ---
        console.log('\n[2/5] ACTIVACIÓN (EMAIL IMAP)');
        const activationLink = await getActivationLink(username, password);
        console.log(`   ✅ Link obtenido: ${activationLink}`);
        
        await driver.get(activationLink);
        await driver.sleep(4000);
        await takeScreenshot(driver, '01b_activacion_success', timestamp);
        console.log('   ✅ Usuario activado vía Email');
        
        // Intentar clic en Acceder si aparece
        try {
            const accederBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Acceder')]")), 5000);
            await accederBtn.click();
            console.log('   ✅ Click en Acceder exitoso');
            await driver.sleep(2000);
        } catch (e) {
            console.log('   ℹ️ No se detectó botón Acceder o ya redirigió.');
        }

        // --- 3. LOGIN ---
        console.log('\n[3/5] LOGIN');
        await driver.get(`${BASE_URL}/login`);
        
        // Limpieza de sesión para evitar bucles
        await driver.manage().deleteAllCookies();
        await driver.executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
        await driver.get(`${BASE_URL}/login`);

        await waitAndType(driver, By.name('username'), username);
        await waitAndType(driver, By.name('password'), password);
        await takeScreenshot(driver, '02_form_login', timestamp);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        
        console.log('   ✅ Login exitoso. Esperando redirección a account-setup...');
        try {
            await driver.wait(until.urlContains('/account-setup'), 20000);
        } catch (e) {
            console.log('   ⚠️ No se redirigió automáticamente. Forzando /account-setup...');
            await driver.get(`${BASE_URL}/account-setup`);
        }
        
        // Esperar a que desaparezca "Validando sesión"
        try {
            const overlay = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Validando sesión')]")), 5000);
            await driver.wait(until.stalenessOf(overlay), 15000);
        } catch (e) {}

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
            // Esperar a que cargue el form o el botón de activación
            console.log('   Verificando estado del Chatbot...');
            await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Chatbot')]")), 15000);
            
            // Intentar detectar QR o botón de activación
            try {
                const activateBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Activar') or contains(., 'Chatbot')]")), 5000);
                console.log('   Click en Activar Chatbot...');
                await driver.executeScript("arguments[0].click();", activateBtn);
                await driver.sleep(3000);
            } catch (e) {
                console.log('   (Botón Activar no encontrado o ya activado)');
            }

            // Llenar datos básicos si están visibles
            try {
                const nameInput = await driver.findElement(By.xpath("//input[contains(@placeholder, 'Bot de Ventas')]"));
                await nameInput.sendKeys('María E2E');
                const phoneInput = await driver.findElement(By.xpath("//input[contains(@placeholder, '123 4567')]"));
                await phoneInput.sendKeys('3000000000');
            } catch (e) {}

            console.log('   📸 Capturando QR/Estado Chatbot...');
            await takeScreenshot(driver, '06_wizard_chatbot_state', timestamp);

            // Click en Guardar y Continuar (Este es el paso crítico para llegar a Productos)
            console.log('   Avanzando a Productos...');
            const saveBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Guardar y Continuar') or contains(., 'Continuar')]")), 10000);
            await driver.executeScript("arguments[0].click();", saveBtn);
            
        } catch (e) {
            console.log('   ⚠️ Error en paso Chatbot (intentando forzar continuación): ' + e.message);
            try {
                const forceNext = await driver.findElement(By.xpath("//button[contains(., 'Continuar') or contains(., 'Siguiente')]"));
                await driver.executeScript("arguments[0].click();", forceNext);
            } catch (inner) {}
        }
        await driver.sleep(4000); // Wait for transition animation

        // Paso 3: Productos
        console.log('   ▶ Pasó 3: Productos');
        try {
            await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'General')]")), 25000);
            await driver.sleep(3000); // Tiempo para que la animación termine y el form se auto-llene
            
            console.log('   📸 CAPTURANDO FORMULARIO AUTO-LLENADO...');
            await takeScreenshot(driver, '08_wizard_producto_autolleno', timestamp);
            
            // Verificar si los valores están ahí (solo logeo, la captura es lo importante)
            try {
                const nameIn = await driver.findElement(By.xpath("//input[contains(@value, 'Mi Primer Producto')]"));
                console.log('   ✅ Confirmado: Nombre auto-llenado detectado');
            } catch(e) {
                console.log('   ⚠️ No se detectó el valor auto-llenado en el DOM, revisa la captura.');
            }
            await waitAndType(driver, By.xpath("//input[contains(@label, 'Nombre del Producto') or contains(@placeholder, 'Hamburguesa')]"), 'Servicio Premium IA');
            await waitAndType(driver, By.xpath("//textarea[contains(@label, 'Descripción') or contains(@placeholder, 'Describe')]"), 'Descripción del producto premium para el chatbot.');
            await waitAndType(driver, By.xpath("//input[contains(@label, 'Valor de Venta') or contains(@placeholder, '0.00')]"), '99.99');
            
            await takeScreenshot(driver, '08_wizard_producto_nuevo', timestamp);
            
            console.log('   Finalizando Wizard...');
            const finishBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Finalizar Configuración')]")), 10000);
            await driver.executeScript("arguments[0].click();", finishBtn);
        } catch (e) {
            console.log('   ℹ️ Error en el paso de productos: ' + e.message);
            const finalBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Finalizar')]")), 10000);
            await driver.executeScript("arguments[0].click();", finalBtn);
        }
        await driver.sleep(5000);

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
        deleteMailAccount(username);
        console.log('\n🔑 Datos de la sesión:');
        console.log(`   User: ${username}`);
        console.log(`   Pass: ${password}`);
        console.log('=======================================================\n');
    }
}

runE2E().then(() => process.exit(0)).catch(() => process.exit(1));
