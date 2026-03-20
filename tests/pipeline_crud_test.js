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
    const baseUrl = 'http://localhost:3000'; // Change to VPS URL if needed for remote testing
    const loginEmail = 'manager'; 
    const loginPassword = 'Password123*'; 

    // Setup logging preferences to capture browser logs
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    let options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--headless'); // Headless mode
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
        
        let userInput = await driver.wait(until.elementLocated(By.name('email')), 10000);
        await userInput.sendKeys(loginEmail);
        await driver.findElement(By.name('password')).sendKeys(loginPassword);
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        await driver.wait(until.urlContains('/dashboard'), 15000);
        console.log('✅ Login exitoso');
        await checkBrowserLogs(driver);

        // 2. NAVEGACIÓN
        console.log('📂 Navegando a Pipelines...');
        await driver.get(`${baseUrl}/marketing/pipelines`);
        await driver.wait(until.elementLocated(By.xpath("//h5[contains(text(), 'Embudos')]")), 10000);
        console.log('✅ Página de Pipelines cargada');

        // 3. CREATE (C)
        console.log('➕ Creando nuevo Pipeline...');
        const addBtn = await driver.findElement(By.xpath("//button[contains(., 'Nuevo Embudo')]"));
        await addBtn.click();

        // Wait for Dialog
        await driver.wait(until.elementLocated(By.id('pipeline-name')), 5000);
        const pipelineName = `Test Pipeline ${Date.now()}`;
        await driver.findElement(By.id('pipeline-name')).sendKeys(pipelineName);
        await driver.findElement(By.id('pipeline-description')).sendKeys('Descripción generada por Test Selenium');
        
        // Submit
        await driver.findElement(By.id('pipeline-submit')).click();
        console.log(`⏳ Esperando confirmación de creación: ${pipelineName}`);
        
        // Wait for list update (check for name in table)
        await driver.wait(until.elementLocated(By.xpath(`//p[contains(text(), '${pipelineName}')] | //span[contains(text(), '${pipelineName}')] | //div[contains(text(), '${pipelineName}')]`)), 10000);
        console.log('✅ Pipeline creado y verificado en la lista');
        await checkBrowserLogs(driver);

        // 4. UPDATE (U)
        console.log('📝 Editando Pipeline...');
        // Find row actions for our pipeline
        const editBtn = await driver.findElement(By.xpath(`//tr[descendant::*[contains(text(), '${pipelineName}')]]//button[@title='Editar']`));
        await editBtn.click();

        await driver.wait(until.elementLocated(By.id('pipeline-name')), 5000);
        const updatedName = `${pipelineName} (Actualizado)`;
        const nameInput = await driver.findElement(By.id('pipeline-name'));
        
        // Clear input (CTRL+A, Backspace)
        await nameInput.sendKeys(Key.CONTROL, 'a');
        await nameInput.sendKeys(Key.BACK_SPACE);
        await nameInput.sendKeys(updatedName);
        
        await driver.findElement(By.id('pipeline-submit')).click();
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${updatedName}')]`)), 10000);
        console.log('✅ Pipeline actualizado correctamente');
        await checkBrowserLogs(driver);

        // 5. DELETE (D)
        console.log('🗑️ Eliminando Pipeline...');
        const deleteBtn = await driver.findElement(By.xpath(`//tr[descendant::*[contains(text(), '${updatedName}')]]//button[@title='Eliminar']`));
        await deleteBtn.click();

        // Handle Confirm Dialog (Standard browser confirm)
        try {
            await driver.wait(until.alertIsPresent(), 5000);
            let alert = await driver.switchTo().alert();
            await alert.accept();
        } catch (e) {
            // Check for Custom MUI Confirm Dialog
            const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Eliminar')]")), 5000);
            await confirmBtn.click();
        }

        console.log('⏳ Verificando eliminación...');
        await driver.wait(async () => {
            const elements = await driver.findElements(By.xpath(`//*[contains(text(), '${updatedName}')]`));
            return elements.length === 0;
        }, 10000);
        
        console.log('✅ Pipeline eliminado correctamente');
        await checkBrowserLogs(driver);

        console.log('\n✨ TEST CRUD FINALIZADO CON ÉXITO ✨');

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
