const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Selenium CRUD Test for Marketing Pipelines
 * 
 * Objectives:
 * 1. Login as MANAGER
 * 2. Create a Pipeline
 * 3. Verify in List
 * 4. Edit Pipeline
 * 5. Delete Pipeline
 * 6. Capture Browser Console Logs
 * 
 * Usage: 
 * node tests/pipeline_crud_test.js
 */

async function runPipelineCrudTest() {
    // Configuration
    const baseUrl = 'https://dashboard.cloudfly.com.co';
    const loginEmail = 'mkt_1774026546054'; // Nuevo usuario del Onboarding reciente
    const loginPassword = 'Password123!';
 

    // Setup logging preferences to capture browser logs
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    let options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    // options.addArguments('--headless'); // Comentado para visualización
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs(prefs);

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('🚀 Iniciando Test CRUD de Pipelines...');

        // 1. LOGIN
        console.log('🔐 Realizando login...');
        await driver.get(`${baseUrl}/login`);
        
        let userInput = await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='juanperez123']")), 15000);
        await userInput.sendKeys(loginEmail);
        
        let passInput = await driver.findElement(By.xpath("//input[@type='password']"));
        await passInput.sendKeys(loginPassword);
        
        await driver.findElement(By.xpath("//button[contains(text(), 'Iniciar sesión')]")).click();

        await driver.wait(until.urlContains('/dashboard'), 15000);
        
        // ESPERA CRÍTICA: Aguardar a que el JWT se guarde en localStorage
        console.log('⏳ Esperando persistencia del Token JWT...');
        await driver.wait(async () => {
            const token = await driver.executeScript("return localStorage.getItem('jwt')");
            return token !== null;
        }, 10000, 'El Token JWT no se guardó en localStorage a tiempo');

        console.log('✅ Login exitoso y sesión persistida');
        await checkBrowserLogs(driver);

        // 2. NAVEGACIÓN
        console.log('📂 Navegando a Pipelines...');
        await driver.get(`${baseUrl}/marketing/pipelines`);
        await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Nuevo Embudo')]")), 15000);
        console.log('✅ Página de Pipelines cargada');

        // 3. CREACIÓN DE PIPELINE CON STAGES
        console.log('➕ Creando nuevo Pipeline con etapas...');
        await driver.get(`${baseUrl}/marketing/pipelines/list`);
        
        let addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Nuevo Embudo')]")), 15000);
        await addBtn.click();
        
        let nameInput = await driver.wait(until.elementLocated(By.id('pipeline-name')), 10000);
        await nameInput.sendKeys('Pipeline con Etapas Automatizado');
        
        let descInput = await driver.findElement(By.id('pipeline-description'));
        await descInput.sendKeys('Creado mediante test de Selenium con gestión de stages');
        
        // Agregar una 4ta etapa dinámica
        console.log('📝 Agregando etapa adicional...');
        let addStageBtn = await driver.findElement(By.id('add-stage-btn'));
        await addStageBtn.click();
        
        // Esperar a que aparezca el nuevo input (index 3, ya que hay 3 defaults)
        let newStageInput = await driver.wait(until.elementLocated(By.name('stages.3.name')), 5000);
        await newStageInput.sendKeys('Etapa Extra Selenium');

        let submitBtn = await driver.findElement(By.id('pipeline-submit'));
        await submitBtn.click();
        
        console.log('⏳ Esperando confirmación de creación...');
        await driver.wait(until.elementLocated(By.xpath("//td[contains(text(), 'Pipeline con Etapas Automatizado')]")), 15000);
        console.log('✅ Pipeline creado exitosamente con sus etapas');
        await checkBrowserLogs(driver);

        // 4. UPDATE (U)
        console.log('📝 Editando Pipeline...');
        const pipelineName = 'Pipeline con Etapas Automatizado'; // Use the name from creation
        // Find row actions for our pipeline with wait
        const editBtn = await driver.wait(until.elementLocated(By.xpath(`//tr[descendant::*[contains(text(), '${pipelineName}')]]//button[@title='Editar']`)), 10000);
        await editBtn.click();

        await driver.wait(until.elementLocated(By.id('pipeline-name')), 5000);
        const updatedName = `${pipelineName} (Actualizado)`;
        const editNameInput = await driver.findElement(By.id('pipeline-name'));
        
        // Clear input (CTRL+A, Backspace)
        await editNameInput.sendKeys(Key.CONTROL, 'a');
        await editNameInput.sendKeys(Key.BACK_SPACE);
        await editNameInput.sendKeys(updatedName);
        
        await driver.findElement(By.id('pipeline-submit')).click();
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${updatedName}')]`)), 10000);
        console.log('✅ Pipeline actualizado correctamente');
        await checkBrowserLogs(driver);

        // 5. DELETE (D)
        console.log('🗑️ Eliminando Pipeline...');
        const deleteBtn = await driver.wait(until.elementLocated(By.xpath(`//tr[descendant::*[contains(text(), '${updatedName}')]]//button[@title='Eliminar']`)), 10000);
        await driver.executeScript("arguments[0].click();", deleteBtn);

        // Handle Confirm Dialog
        console.log('⏳ Esperando diálogo de confirmación...');
        try {
            // Priority 1: Browser Confirm
            await driver.wait(until.alertIsPresent(), 8000);
            let alert = await driver.switchTo().alert();
            console.log(`💬 Alert detectado: ${await alert.getText()}`);
            await alert.accept();
        } catch (e) {
            console.log('⚠️ No se detectó alert nativo, buscando diálogo MUI...');
            // Priority 2: MUI/Custom Dialog Button
            const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Eliminar') or contains(., 'Aceptar') or contains(., 'Acepto')]")), 5000);
            await driver.executeScript("arguments[0].click();", confirmBtn);
        }

        console.log('⏳ Verificando eliminación...');
        await driver.sleep(2000);
        const remainingElements = await driver.findElements(By.xpath(`//*[contains(text(), '${updatedName}')]`));
        if (remainingElements.length > 0) {
            throw new Error(`El pipeline '${updatedName}' aún es visible después de eliminarlo.`);
        }
        
        console.log('✅ Pipeline eliminado correctamente');
        await checkBrowserLogs(driver);

        console.log('\n✨ TEST CRUD FINALIZADO CON ÉXITO ✨');
        console.log('⏳ Esperando 30 segundos para observación visual...');
        await driver.sleep(30000);

    } catch (error) {
        console.error('❌ ERROR DURANTE EL TEST:', error);
        await checkBrowserLogs(driver);
    } finally {
        await driver.quit();
    }
}

async function checkBrowserLogs(driver) {
    console.log('\n--- [BROWSER CONSOLE LOGS] ---');
    try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        if (logs.length === 0) {
            console.log('(Sin logs nuevos en consola)');
        } else {
            logs.forEach(log => {
                const level = log.level.name;
                const message = log.message;
                const timestamp = new Date(log.timestamp).toLocaleTimeString();
                
                if (level === 'SEVERE') {
                    console.error(`🔴 [${timestamp}] [${level}] ${message}`);
                } else if (level === 'WARNING') {
                    console.warn(`🟡 [${timestamp}] [${level}] ${message}`);
                } else {
                    console.log(`⚪ [${timestamp}] [${level}] ${message}`);
                }
            });
        }
    } catch (e) {
        console.warn('⚠️ No se pudieron obtener los logs del navegador');
    }
    console.log('-------------------------------\n');
}

runPipelineCrudTest();
