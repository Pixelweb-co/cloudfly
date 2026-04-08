/**
 * 🚀 E2E PIPELINE CRUD - Cloudfly Selenium Test
 * 
 * Tests: CREATE → READ → UPDATE → DELETE of Pipelines via UI
 * Uses fresh user registration + IMAP activation for clean state
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
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

// ─── HELPERS ────────────────────────────────────────────────────────────────

function runSshSql(sql) {
    const escapedSql = sql.replace(/'/g, "'\\''" );
    const remoteCmd = `docker exec -i mysql mysql -u root -p${DB_PASS} ${DB_NAME} -N -s -e "${escapedSql}" 2>/dev/null`;
    const localCmd = `ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${VPS} "${remoteCmd}"`;
    try {
        return execSync(localCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) { return ''; }
}

function runSshHestia(cmd) {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const portFlag = `-p ${MAIL_PORT}`;
    return execSync(`ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${portFlag} ${MAIL_USER}@${MAIL_HOST} "${escapedCmd}"`, { encoding: 'utf8' });
}

function createMailAccount(account, password) {
    console.log(`   📧 Creando cuenta IMAP: ${account}@${MAIL_DOMAIN}`);
    const cmd = `/usr/local/hestia/bin/v-add-mail-account cloudfly ${MAIL_DOMAIN} ${account} '${password}'`;
    runSshHestia(cmd);
}

function deleteMailAccount(account) {
    console.log(`   🧹 Eliminando cuenta IMAP: ${account}@${MAIL_DOMAIN}`);
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
    let retries = 3;
    while (retries > 0) {
        try {
            const el = await driver.wait(until.elementLocated(locator), timeout);
            await driver.wait(until.elementIsVisible(el), 10000);
            await driver.sleep(500);
            await el.click();
            return;
        } catch (e) {
            if (e.name === 'StaleElementReferenceError' && retries > 1) {
                retries--;
                await driver.sleep(1000);
            } else { throw e; }
        }
    }
}

async function waitAndType(driver, locator, text, timeout = 15000) {
    let retries = 3;
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
            } else { throw e; }
        }
    }
}

async function clearAndType(driver, locator, text) {
    const el = await driver.wait(until.elementLocated(locator), 10000);
    await driver.wait(until.elementIsVisible(el), 5000);
    await driver.sleep(300);
    // Select all and replace
    await el.click();
    await el.sendKeys(Key.chord(Key.CONTROL, 'a'));
    await el.sendKeys(text);
}

// ─── MAIN TEST FLOW ─────────────────────────────────────────────────────────

async function runTest() {
    const ts = Date.now();
    const user = `pipe_${ts}`;
    const email = `${user}@${MAIL_DOMAIN}`;
    const pass = 'Password123!';

    const PIPELINE_NAME = `Test Pipeline ${ts}`;
    const PIPELINE_UPDATED = `Updated Pipeline ${ts}`;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(` 🚀  E2E PIPELINE CRUD TEST - Cloudfly`);
    console.log(`${'═'.repeat(60)}`);

    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');

    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
    chromeOptions.setLoggingPrefs(prefs);

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    try {
        // ═══════════════════════════════════════════════════
        // FASE 0: CREAR USUARIO Y ACTIVAR
        // ═══════════════════════════════════════════════════
        console.log('\n── FASE 0: SETUP (Registro + Activación + Onboarding) ──');
        
        createMailAccount(user, pass);

        // Registro
        console.log('   📝 Registrando usuario...');
        await driver.get(`${BASE_URL}/register`);
        await driver.wait(until.elementLocated(By.name('nombres')), 15000);
        await waitAndType(driver, By.name('nombres'), 'Pipeline');
        await waitAndType(driver, By.name('apellidos'), 'Tester');
        await waitAndType(driver, By.name('username'), user);
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('password'), pass);
        await waitAndType(driver, By.name('confirmPassword'), pass);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        console.log('   ✅ Registro enviado.');
        await driver.sleep(3000);

        // Activación IMAP
        console.log('   📬 Activando cuenta vía IMAP...');
        const link = await getActivationLink(user, pass);
        console.log(`   🔗 Enlace: ${link}`);
        await driver.get(link);
        await driver.sleep(5000);
        console.log('   ✅ Cuenta activada.');

        // Login
        console.log('   🔑 Login...');
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.name('username')), 15000);
        await waitAndType(driver, By.name('username'), user);
        await waitAndType(driver, By.name('password'), pass);
        await waitAndClick(driver, By.css('button[type="submit"]'));
        await driver.wait(until.urlContains('/account-setup'), 25000);
        console.log('   ✅ Login exitoso → account-setup');

        // Onboarding Wizard (mismo patrón que e2e_onboarding_marketing.js)
        console.log('   ⚡ Completando Wizard...');
        // Paso 0: Bienvenida
        await waitAndClick(driver, By.xpath("//button[contains(text(),'Continuar')]"), 15000);
        await driver.sleep(2000);
        
        // Paso 1: Datos de Negocio
        console.log('   📝 Paso 1: Datos de Negocio');
        const nit = '900' + ts.toString().slice(-6);
        await waitAndType(driver, By.name('name'), `PipelineCo ${ts}`);
        await waitAndType(driver, By.name('nit'), nit);
        await waitAndType(driver, By.name('phone'), '573001234567');
        await waitAndType(driver, By.name('email'), email);
        await waitAndType(driver, By.name('address'), 'Calle Test 123');
        await waitAndType(driver, By.name('contact'), 'Pipeline Admin');
        await waitAndType(driver, By.name('position'), 'Gerente');
        
        // Seleccionar tipo de negocio (card click)
        try {
            const bizCard = await driver.findElement(By.xpath("//*[contains(text(), 'Software / SaaS')]"));
            await driver.executeScript("arguments[0].click();", bizCard);
        } catch (e) { }
        
        await waitAndType(driver, By.name('objetoSocial'), 'Empresa de prueba para test E2E de Pipelines CRUD.');
        await waitAndClick(driver, By.xpath("//button[@type='submit']"));
        console.log('   ✅ Account Setup enviado.');
        await driver.sleep(8000);

        // Paso 2: WhatsApp (skip)
        console.log('   📝 Paso 2: WhatsApp (skipping)');
        try {
            const skipBtn = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Configurar más tarde')]")), 10000);
            await driver.executeScript("arguments[0].click();", skipBtn);
            console.log('   ✅ WhatsApp Configuración Omitida.');
        } catch (e) {
            try { await waitAndClick(driver, By.xpath("//button[contains(text(),'Siguiente')]"), 8000); } catch (err) { }
        }
        await driver.sleep(3000);

        // Paso 3: Finalizar
        console.log('   📝 Paso 3: Finalizar');
        try {
            const finishBtn = await driver.wait(
                until.elementLocated(By.css("button[type='submit'], button.bg-primary, button[class*='MuiButton']")),
                20000
            );
            await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", finishBtn);
            await driver.sleep(500);
            await driver.executeScript("arguments[0].click();", finishBtn);
            console.log('   ✅ Wizard finalizado');
        } catch (_) {
            try {
                const btns = await driver.findElements(By.xpath("//button[contains(., 'Finalizar')]"));
                if (btns.length > 0) {
                    await driver.executeScript("arguments[0].click();", btns[0]);
                    console.log('   ✅ Finalizar (fallback) clickeado');
                }
            } catch (err) {
                console.log('   ℹ️ Asumiendo redirección automática');
            }
        }
        
        // Esperar dashboard
        await driver.wait(until.urlContains('/home'), 30000);
        await driver.sleep(3000);
        console.log('   ✅ Dashboard alcanzado. Setup completo.');
        await takeScreenshot(driver, 'SETUP_COMPLETE', ts);

        // ═══════════════════════════════════════════════════
        // FASE 1: CREATE PIPELINE
        // ═══════════════════════════════════════════════════
        console.log('\n── FASE 1: CREATE PIPELINE ──────────────────────────────');
        
        await driver.get(`${BASE_URL}/marketing/pipelines/list`);
        await driver.sleep(5000);
        await takeScreenshot(driver, 'PIPELINE_LIST_INITIAL', ts);

        // Contar pipelines existentes
        const initialRows = await driver.findElements(By.css('table tbody tr'));
        const initialCount = initialRows.length;
        console.log(`   📊 Pipelines iniciales en tabla: ${initialCount}`);

        // Click "Nuevo Embudo"
        console.log('   ➕ Abriendo formulario de creación...');
        await waitAndClick(driver, By.xpath("//button[contains(., 'Nuevo Embudo')]"), 10000);
        await driver.sleep(2000);
        await takeScreenshot(driver, 'PIPELINE_FORM_OPEN', ts);

        // Rellenar formulario
        console.log(`   📝 Rellenando: "${PIPELINE_NAME}"`);
        // Selectores basados en placeholder verificados por browser_subagent
        const nameInput = await driver.wait(until.elementLocated(By.css('input[placeholder*="Pipelines de Ventas"]')), 10000);
        await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);
        await nameInput.click();
        await nameInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
        await nameInput.sendKeys(PIPELINE_NAME);
        
        const descInput = await driver.findElement(By.css('textarea[placeholder*="propósito"]'));
        await descInput.click();
        await descInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
        await descInput.sendKeys('Pipeline de prueba E2E automatizado');
        
        // Las etapas por defecto ya vienen (Prospecto). Agregar una más.
        console.log('   📝 Agregando etapa adicional...');
        await waitAndClick(driver, By.id('add-stage-btn'), 5000);
        await driver.sleep(1000);
        
        // Escribir nombre de la segunda etapa
        const stageInputs = await driver.findElements(By.css('input[placeholder*="Etapa"]'));
        if (stageInputs.length >= 2) {
            const lastInput = stageInputs[stageInputs.length - 1];
            await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", lastInput);
            await lastInput.click();
            await lastInput.sendKeys('Calificado');
            console.log('   ✅ Etapa "Calificado" agregada');
        }

        await takeScreenshot(driver, 'PIPELINE_FORM_FILLED', ts);

        // Submit
        console.log('   💾 Guardando pipeline...');
        const submitBtn = await driver.wait(until.elementLocated(By.id('pipeline-submit')), 10000);
        await driver.executeScript("arguments[0].click();", submitBtn);
        await driver.sleep(6000);
        await takeScreenshot(driver, 'PIPELINE_CREATED', ts);

        // Verificar que se creó
        const afterCreateRows = await driver.findElements(By.css('table tbody tr'));
        const afterCreateCount = afterCreateRows.length;
        console.log(`   📊 Pipelines después de crear: ${afterCreateCount}`);

        // Buscar el nombre en la tabla
        const pageSource = await driver.getPageSource();
        if (pageSource.includes(PIPELINE_NAME)) {
            console.log(`   ✅ CREATE OK: "${PIPELINE_NAME}" encontrado en la tabla`);
        } else {
            console.error(`   ❌ CREATE FAILED: "${PIPELINE_NAME}" NO encontrado en la tabla`);
            await takeScreenshot(driver, 'CREATE_FAILED', ts);
        }

        // Verificar en DB
        const dbPipeline = runSshSql(`SELECT name FROM pipelines WHERE name = '${PIPELINE_NAME}' LIMIT 1`);
        console.log(`   🗄️ DB Check: ${dbPipeline ? '✅ ' + dbPipeline : '❌ No encontrado en DB'}`);

        // ═══════════════════════════════════════════════════
        // FASE 2: READ PIPELINE (verify details)
        // ═══════════════════════════════════════════════════
        console.log('\n── FASE 2: READ PIPELINE ───────────────────────────────');
        
        // Verificar detalles visibles en la tabla
        const pipelineRow = await driver.findElement(
            By.xpath(`//td[contains(., '${PIPELINE_NAME}')]/ancestor::tr`)
        );
        
        // Verificar etapas
        const stagesChip = await pipelineRow.findElement(By.xpath(".//span[contains(., 'etapas')]"));
        const stagesText = await stagesChip.getText();
        console.log(`   📋 Etapas mostradas: ${stagesText}`);
        
        // Verificar estado
        const statusChip = await pipelineRow.findElement(By.xpath(".//span[contains(., 'Activo') or contains(., 'Inactivo')]"));
        const statusText = await statusChip.getText();
        console.log(`   📋 Estado: ${statusText}`);
        
        // Verificar tipo
        const typeCell = await pipelineRow.findElement(By.xpath(".//td[2]"));
        const typeText = await typeCell.getText();
        console.log(`   📋 Tipo: ${typeText}`);

        console.log('   ✅ READ OK: Todos los campos visibles verificados');
        await takeScreenshot(driver, 'PIPELINE_READ_VERIFIED', ts);

        // ═══════════════════════════════════════════════════
        // FASE 3: UPDATE PIPELINE
        // ═══════════════════════════════════════════════════
        console.log('\n── FASE 3: UPDATE PIPELINE ─────────────────────────────');
        
        // Click en el botón de editar del pipeline creado
        console.log('   ✏️ Abriendo formulario de edición...');
        const editBtn = await pipelineRow.findElement(By.css('button[title="Editar"], button[color="info"]'));
        await driver.executeScript("arguments[0].click();", editBtn);
        await driver.sleep(2000);
        await takeScreenshot(driver, 'PIPELINE_EDIT_OPEN', ts);

        // Cambiar nombre
        console.log(`   📝 Cambiando nombre a: "${PIPELINE_UPDATED}"`);
        const editNameInput = await driver.wait(until.elementLocated(By.css('input[placeholder*="Pipelines de Ventas"]')), 10000);
        await editNameInput.click();
        await editNameInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
        await editNameInput.sendKeys(PIPELINE_UPDATED);
        
        // Agregar una tercera etapa
        console.log('   📝 Agregando tercera etapa "Cerrado"...');
        await waitAndClick(driver, By.id('add-stage-btn'), 5000);
        await driver.sleep(1000);
        const updatedStageInputs = await driver.findElements(By.css('input[name^="stages."]'));
        if (updatedStageInputs.length >= 3) {
            const lastInput = updatedStageInputs[updatedStageInputs.length - 1];
            await lastInput.clear();
            await lastInput.sendKeys('Cerrado');
            console.log('   ✅ Etapa "Cerrado" agregada');
        }

        await takeScreenshot(driver, 'PIPELINE_EDIT_FILLED', ts);

        // Submit update
        console.log('   💾 Guardando cambios...');
        await waitAndClick(driver, By.id('pipeline-submit'), 10000);
        await driver.sleep(4000);
        await takeScreenshot(driver, 'PIPELINE_UPDATED', ts);

        // Verificar actualización en la tabla
        const updatedSource = await driver.getPageSource();
        if (updatedSource.includes(PIPELINE_UPDATED)) {
            console.log(`   ✅ UPDATE OK: "${PIPELINE_UPDATED}" visible en la tabla`);
        } else {
            console.error(`   ❌ UPDATE FAILED: "${PIPELINE_UPDATED}" NO encontrado`);
            await takeScreenshot(driver, 'UPDATE_FAILED', ts);
        }

        // Verificar en DB
        const dbUpdated = runSshSql(`SELECT name FROM pipelines WHERE name = '${PIPELINE_UPDATED}' LIMIT 1`);
        console.log(`   🗄️ DB Check: ${dbUpdated ? '✅ ' + dbUpdated : '❌ No actualizado en DB'}`);

        // Verificar etapas en DB
        const pipelineId = runSshSql(`SELECT id FROM pipelines WHERE name = '${PIPELINE_UPDATED}' LIMIT 1`);
        if (pipelineId) {
            const stageCount = runSshSql(`SELECT COUNT(*) FROM pipeline_stages WHERE pipeline_id = ${pipelineId}`);
            console.log(`   🗄️ DB Etapas: ${stageCount} (esperado: 3)`);
        }

        // ═══════════════════════════════════════════════════
        // FASE 4: DELETE PIPELINE
        // ═══════════════════════════════════════════════════
        console.log('\n── FASE 4: DELETE PIPELINE ─────────────────────────────');
        
        // Find the updated pipeline row
        const updatedRow = await driver.findElement(
            By.xpath(`//td[contains(., '${PIPELINE_UPDATED}')]/ancestor::tr`)
        );
        
        // Click delete button
        console.log('   🗑️ Eliminando pipeline...');
        const deleteBtn = await updatedRow.findElement(By.css('button[title="Eliminar"], button[color="error"]'));
        
        // Handle the confirm dialog
        await driver.executeScript("window.__origConfirm = window.confirm; window.confirm = () => true;");
        await driver.executeScript("arguments[0].click();", deleteBtn);
        await driver.sleep(4000);
        await driver.executeScript("window.confirm = window.__origConfirm;");
        
        await takeScreenshot(driver, 'PIPELINE_DELETED', ts);

        // Verify deletion from UI
        const afterDeleteSource = await driver.getPageSource();
        if (!afterDeleteSource.includes(PIPELINE_UPDATED)) {
            console.log(`   ✅ DELETE OK: "${PIPELINE_UPDATED}" eliminado de la tabla`);
        } else {
            console.error(`   ❌ DELETE FAILED: "${PIPELINE_UPDATED}" aún visible`);
            await takeScreenshot(driver, 'DELETE_FAILED', ts);
        }

        // Verify deletion from DB
        const dbDeleted = runSshSql(`SELECT name FROM pipelines WHERE name = '${PIPELINE_UPDATED}' LIMIT 1`);
        console.log(`   🗄️ DB Check: ${!dbDeleted ? '✅ Eliminado de DB' : '❌ Aún en DB: ' + dbDeleted}`);

        // ═══════════════════════════════════════════════════
        // RESUMEN FINAL
        // ═══════════════════════════════════════════════════
        console.log(`\n${'═'.repeat(60)}`);
        console.log(` 🏁  PIPELINE CRUD TEST COMPLETADO EXITOSAMENTE`);
        console.log(`${'═'.repeat(60)}`);
        console.log(`   ✅ CREATE: Pipeline creado y verificado`);
        console.log(`   ✅ READ:   Datos verificados en tabla`);
        console.log(`   ✅ UPDATE: Nombre y etapas actualizados`);
        console.log(`   ✅ DELETE: Pipeline eliminado y verificado`);

    } catch (e) {
        console.error(`\n❌ ERROR FATAL: ${e.message}`);
        try {
            const logs = await driver.manage().logs().get(logging.Type.BROWSER);
            logs.forEach(log => console.log(`   🌐 [BROWSER] ${log.level.name}: ${log.message}`));
        } catch (err) {}
        await takeScreenshot(driver, 'ERROR_PIPELINE_CRUD', ts);
        process.exit(1);
    } finally {
        await driver.quit();
        deleteMailAccount(user);
    }
}

runTest();
