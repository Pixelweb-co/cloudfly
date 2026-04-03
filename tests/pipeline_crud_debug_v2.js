const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function debugSave() {
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    // Enable logging
    let loggingPrefs = new (require('selenium-webdriver').logging.Preferences)();
    loggingPrefs.setLevel(require('selenium-webdriver').logging.Type.BROWSER, require('selenium-webdriver').logging.Level.ALL);
    options.setLoggingPrefs(loggingPrefs);

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        console.log('Navegando a login...');
        await driver.get('https://dashboard.cloudfly.com.co/login');

        console.log('Login...');
        await driver.wait(until.elementLocated(By.name('email')), 10000);
        await driver.findElement(By.name('email')).sendKeys('mkt_1774026546054');
        await driver.findElement(By.name('password')).sendKeys('Password123!');
        await driver.findElement(By.css('button[type="submit"]')).click();

        await driver.wait(until.urlContains('/dashboard'), 15000);
        console.log('Login exitoso.');

        await driver.get('https://dashboard.cloudfly.com.co/marketing/pipelines/list');
        await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Nuevo Embudo')]")), 15000);
        
        console.log('Abriendo formulario...');
        await driver.findElement(By.xpath("//button[contains(., 'Nuevo Embudo')]")).click();
        await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Nuevo Embudo')]")), 5000);

        console.log('Llenando campos...');
        // Nombre
        await driver.findElement(By.css('input[name="name"]')).sendKeys('Pipeline Selenium Debug v2');
        // Descripcion
        await driver.findElement(By.css('textarea[name="description"]')).sendKeys('Test de guardado con captura de logs');

        // Color (Ya tiene default #7367F0)
        
        console.log('Agregando una etapa...');
        const addStageBtn = await driver.findElement(By.xpath("//button[contains(., 'Agregar Etapa')]"));
        await addStageBtn.click();
        
        await driver.wait(until.elementLocated(By.css('input[name="stages.0.name"]')), 2000);
        await driver.findElement(By.css('input[name="stages.0.name"]')).sendKeys('Etapa Debug Success');

        console.log('HACIENDO CLIC EN GUARDAR...');
        const saveBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Guardar')]"));
        await saveBtn.click();

        console.log('Esperando 5 segundos para capturar logs...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('--- LOGS DE CONSOLA ---');
        let logs = await driver.manage().logs().get(require('selenium-webdriver').logging.Type.BROWSER);
        logs.forEach(function(entry) {
            console.log('[%s] %s: %s', 
                new Date(entry.timestamp).toISOString(), 
                entry.level.name, 
                entry.message
            );
        });
        console.log('--- FIN DE LOGS ---');

    } catch (error) {
        console.error('Error durante el proceso:', error);
    } finally {
        await driver.quit();
    }
}

debugSave();
