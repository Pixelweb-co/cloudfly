const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Selenium CRUD Test for Marketing Pipelines (frontend_new)
 *
 * Login: Admin (edwing2022)
 * URL: https://dashboard.cloudfly.com.co
 *
 * Flujo:
 * 1. Login como ADMIN
 * 2. Crear un Pipeline con etapas
 * 3. Verificar que aparece en la lista
 * 4. Editar el pipeline
 * 5. Eliminar el pipeline
 *
 * Usage:
 *   node tests/pipeline_crud_test.js
 */

const BASE_URL = 'https://dashboard.cloudfly.com.co';
const LOGIN_USERNAME = 'edwing2022';
const LOGIN_PASSWORD = 'Edwin2025*';

const PIPELINE_NAME = `Pipeline Selenium ${Date.now()}`;
const PIPELINE_NAME_UPDATED = `${PIPELINE_NAME} (Editado)`;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function checkBrowserLogs(driver, label = '') {
  console.log(`\n--- [BROWSER CONSOLE ${label}] ---`);
  try {
    const logs = await driver.manage().logs().get(logging.Type.BROWSER);
    if (logs.length === 0) {
      console.log('(Sin logs nuevos)');
    } else {
      logs.forEach(log => {
        const level = log.level.name;
        const msg = log.message;
        const ts = new Date(log.timestamp).toLocaleTimeString();
        if (level === 'SEVERE') {
          console.error(`🔴 [${ts}] [${level}] ${msg}`);
        } else if (level === 'WARNING') {
          console.warn(`🟡 [${ts}] [${level}] ${msg}`);
        } else if (msg.includes('PIPELINE-DEBUG')) {
          console.log(`🟢 [${ts}] [${level}] ${msg}`);
        }
      });
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron obtener logs del navegador:', e.message);
  }
  console.log('-------------------------------\n');
}

async function runPipelineCrudTest() {
  const prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  const options = new chrome.Options();
  options.addArguments('--window-size=1440,900');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.setLoggingPrefs(prefs);
  // Descomenta para modo sin interfaz:
  // options.addArguments('--headless');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // ──────────────────────────────────────────
    // 1. LOGIN COMO ADMIN
    // ──────────────────────────────────────────
    console.log('\n🚀 [1/5] LOGIN COMO ADMIN...');
    await driver.get(`${BASE_URL}/login`);

    // Username — placeholder='juanperez123'
    const usernameInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='juanperez123']")),
      15000,
      'No se encontró el campo de usuario'
    );
    await usernameInput.clear();
    await usernameInput.sendKeys(LOGIN_USERNAME);

    // Password — type=password
    const passwordInput = await driver.findElement(By.xpath("//input[@type='password']"));
    await passwordInput.sendKeys(LOGIN_PASSWORD);

    // Submit — contiene 'Iniciar sesión'
    const loginBtn = await driver.findElement(By.xpath("//button[contains(., 'Iniciar sesión')]"));
    await loginBtn.click();

    // Esperar redirección a /home o /dashboard
    await driver.wait(
      until.urlMatches(/\/(home|dashboard)/),
      20000,
      'No se redirigió al dashboard tras login'
    );

    // Esperar que el JWT se guarde
    await driver.wait(async () => {
      const token = await driver.executeScript("return localStorage.getItem('jwt')");
      return token !== null;
    }, 10000, 'JWT no guardado en localStorage');

    const jwt = await driver.executeScript("return localStorage.getItem('jwt')");
    console.log(`✅ Login exitoso. JWT: ${jwt ? jwt.substring(0, 30) + '...' : 'NO ENCONTRADO'}`);
    await checkBrowserLogs(driver, 'POST-LOGIN');

    // ──────────────────────────────────────────
    // 2. NAVEGAR A PIPELINES
    // ──────────────────────────────────────────
    console.log('\n📂 [2/5] NAVEGANDO A PIPELINES...');
    await driver.get(`${BASE_URL}/marketing/pipelines/list`);

    const addBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Nuevo Embudo')]")),
      20000,
      'No se cargó la página de pipelines'
    );
    console.log(`✅ Página de pipelines cargada`);

    // ──────────────────────────────────────────
    // 3. CREAR PIPELINE (CREATE)
    // ──────────────────────────────────────────
    console.log(`\n➕ [3/5] CREANDO PIPELINE: "${PIPELINE_NAME}"...`);
    await addBtn.click();

    // Esperar que el dialog se abra — campo name con id
    const nameInput = await driver.wait(
      until.elementLocated(By.id('pipeline-name')),
      10000,
      'No se abrió el dialog de creación de pipeline'
    );
    await nameInput.clear();
    await nameInput.sendKeys(PIPELINE_NAME);

    // Descripción
    const descInput = await driver.findElement(By.id('pipeline-description'));
    await descInput.sendKeys('Pipeline creado automáticamente por Selenium E2E');

    // Agregar etapa extra
    console.log('  📝 Agregando etapa adicional...');
    const addStageBtn = await driver.findElement(By.id('add-stage-btn'));
    await addStageBtn.click();
    await sleep(500);

    // El input de la nueva etapa (index 1, ya que hay 1 default "Prospecto")
    const newStageInputs = await driver.findElements(By.xpath("//input[contains(@name,'stages') and contains(@name,'name')]"));
    if (newStageInputs.length >= 2) {
      await newStageInputs[newStageInputs.length - 1].sendKeys('Cierre Selenium');
    }

    // Submit
    const submitBtn = await driver.findElement(By.id('pipeline-submit'));
    await submitBtn.click();

    // Verificar que aparece en la tabla
    await driver.wait(
      until.elementLocated(By.xpath(`//td[contains(., '${PIPELINE_NAME}')] | //*[contains(text(),'${PIPELINE_NAME}')]`)),
      20000,
      `Pipeline "${PIPELINE_NAME}" no apareció en la lista tras creación`
    );
    console.log(`✅ Pipeline creado y visible en lista`);
    await checkBrowserLogs(driver, 'POST-CREATE');

    // ──────────────────────────────────────────
    // 4. EDITAR PIPELINE (UPDATE)
    // ──────────────────────────────────────────
    console.log(`\n✏️ [4/5] EDITANDO PIPELINE...`);

    const editBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//tr[descendant::*[contains(text(), '${PIPELINE_NAME}')]]//button[@title='Editar']`)
      ),
      10000,
      'No se encontró el botón Editar del pipeline creado'
    );
    await editBtn.click();

    const editNameInput = await driver.wait(
      until.elementLocated(By.id('pipeline-name')),
      10000,
      'No se abrió el dialog de edición'
    );

    // Limpiar y escribir nuevo nombre
    await editNameInput.sendKeys(Key.CONTROL, 'a');
    await editNameInput.sendKeys(Key.BACK_SPACE);
    await editNameInput.sendKeys(PIPELINE_NAME_UPDATED);

    const updateSubmitBtn = await driver.findElement(By.id('pipeline-submit'));
    await updateSubmitBtn.click();

    await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(text(), '${PIPELINE_NAME_UPDATED}')]`)),
      20000,
      `Pipeline actualizado "${PIPELINE_NAME_UPDATED}" no apareció en la lista`
    );
    console.log(`✅ Pipeline actualizado correctamente a: "${PIPELINE_NAME_UPDATED}"`);
    await checkBrowserLogs(driver, 'POST-UPDATE');

    // ──────────────────────────────────────────
    // 5. ELIMINAR PIPELINE (DELETE)
    // ──────────────────────────────────────────
    console.log(`\n🗑️ [5/5] ELIMINANDO PIPELINE...`);

    const deleteBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//tr[descendant::*[contains(text(), '${PIPELINE_NAME_UPDATED}')]]//button[@title='Eliminar']`)
      ),
      10000,
      'No se encontró el botón Eliminar del pipeline editado'
    );
    await driver.executeScript('arguments[0].click();', deleteBtn);

    // Manejar confirmación (alert nativo primero, luego MUI)
    try {
      await driver.wait(until.alertIsPresent(), 5000);
      const alert = await driver.switchTo().alert();
      console.log(`  💬 Alert: "${await alert.getText()}"`);
      await alert.accept();
    } catch {
      console.log('  ℹ️ Sin alert nativo, buscando botón de confirmación MUI...');
      const confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Aceptar') or contains(., 'Confirmar') or contains(., 'Eliminar')]")),
        5000
      );
      await driver.executeScript('arguments[0].click();', confirmBtn);
    }

    await sleep(2500);

    const remaining = await driver.findElements(
      By.xpath(`//*[contains(text(), '${PIPELINE_NAME_UPDATED}')]`)
    );
    if (remaining.length > 0) {
      throw new Error(`❌ El pipeline "${PIPELINE_NAME_UPDATED}" aún es visible tras eliminación`);
    }

    console.log(`✅ Pipeline eliminado correctamente`);
    await checkBrowserLogs(driver, 'POST-DELETE');

    // ──────────────────────────────────────────
    // RESULTADO FINAL
    // ──────────────────────────────────────────
    console.log('\n');
    console.log('╔══════════════════════════════════════╗');
    console.log('║   ✨ CRUD TEST PIPELINES: ÉXITO ✨   ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`  ✅ CREATE: Pipeline "${PIPELINE_NAME}"`);
    console.log(`  ✅ UPDATE: Renombrado a "${PIPELINE_NAME_UPDATED}"`);
    console.log(`  ✅ DELETE: Eliminado correctamente`);

    await sleep(5000);

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST CRUD DE PIPELINES:');
    console.error(error.message || error);
    await checkBrowserLogs(driver, 'ERROR');
    // Screenshot del error
    try {
      const screenshot = await driver.takeScreenshot();
      const fs = require('fs');
      const ts = Date.now();
      const path = `tests/logs/pipeline_crud_error_${ts}.png`;
      fs.mkdirSync('tests/logs', { recursive: true });
      fs.writeFileSync(path, screenshot, 'base64');
      console.log(`📸 Screenshot del error guardado en: ${path}`);
    } catch (screenshotErr) {
      console.warn('⚠️ No se pudo guardar screenshot:', screenshotErr.message);
    }
  } finally {
    await driver.quit();
  }
}

runPipelineCrudTest();
