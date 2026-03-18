const { Builder, By, Key, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Selenium Test for Marketing Pipelines Kanban (Enhanced for Debugging)
 * Usage: 
 * 1. npm install selenium-webdriver
 * 2. node tests/pipeline_kanban_test.js
 */

async function runTest() {
    // Configuration
    const baseUrl = 'http://localhost:3000';
    // User MANAGER according to README
    const loginEmail = 'manager'; 
    const loginPassword = 'Password123*'; 

    // Setup logging preferences to capture browser logs
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    let options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--headless'); // Modo headless para ejecución silenciosa
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs(prefs);

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('🚀 Iniciando Test de Pipelines Kanban con usuario MANAGER...');

        // 1. Login
        console.log('🔐 Realizando login...');
        await driver.get(`${baseUrl}/login`);
        
        // El README dice que el campo es 'username' para juanpepe, pero el input name es 'email' o 'username'?
        // En selenium_chat_test.py usaban By.NAME, "email". Revisamos.
        let userInput;
        try {
            userInput = await driver.wait(until.elementLocated(By.name('email')), 5000);
        } catch (e) {
            userInput = await driver.wait(until.elementLocated(By.name('username')), 5000);
        }

        await userInput.sendKeys(loginEmail);
        await driver.findElement(By.name('password')).sendKeys(loginPassword);
        await driver.findElement(By.xpath("//button[@type='submit']")).click();

        // Esperar redirección al dashboard
        await driver.wait(until.urlContains('/dashboard'), 10000);
        console.log('✅ Login exitoso');

        // 2. Navegar a Lista de Pipelines
        console.log('📂 Navegando a Lista de Pipelines...');
        await driver.get(`${baseUrl}/marketing/pipelines/list`);
        
        try {
            await driver.wait(until.elementLocated(By.xpath("//h5[contains(text(), 'Embudos de Marketing')]")), 10000);
            console.log('✅ Lista de pipelines cargada');
        } catch (e) {
            console.warn('⚠️ No se detectó el encabezado H5, verificando logs...');
        }

        // 3. Obtener Logs de Consola periódicamente o al final
        await checkBrowserLogs(driver);

        // 4. Navegar al Kanban
        console.log('📊 Buscando enlace al Kanban...');
        const kanbanBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(@title, 'Ver Kanban')]")), 5000);
        await kanbanBtn.click();
        
        await driver.wait(until.urlContains('/marketing/pipelines/kanban'), 10000);
        console.log('✅ Tablero Kanban accedido');

        // Esperar a que cargue el tablero
        await driver.wait(until.elementLocated(By.xpath("//h6")), 10000);
        
        // Check logs again after heavy UI load
        await checkBrowserLogs(driver);

        console.log('\n✨ TEST FINALIZADO ✨');

    } catch (error) {
        console.error('❌ ERROR DURANTE EL TEST:', error);
        await checkBrowserLogs(driver);
    } finally {
        await driver.quit();
    }
}

async function checkBrowserLogs(driver) {
    console.log('\n--- BROWSER CONSOLE LOGS ---');
    const logs = await driver.manage().logs().get(logging.Type.BROWSER);
    if (logs.length === 0) {
        console.log('(No hay logs en la consola)');
    } else {
        logs.forEach(log => {
            const level = log.level.name;
            const message = log.message;
            if (level === 'SEVERE') {
                console.error(`🔴 [${level}] ${message}`);
            } else if (level === 'WARNING') {
                console.warn(`🟡 [${level}] ${message}`);
            } else {
                console.log(`⚪ [${level}] ${message}`);
            }
        });
    }
    console.log('---------------------------\n');
}

runTest();
