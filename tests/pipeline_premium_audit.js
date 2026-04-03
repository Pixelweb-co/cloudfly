const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function auditPremiumPipeline() {
    console.log('🚀 Iniciando Auditoría Selenium de Pipelines Premium...');
    
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    
    // Configuración de captura de logs de consola
    let loggingPrefs = new (require('selenium-webdriver').logging.Preferences)();
    loggingPrefs.setLevel(require('selenium-webdriver').logging.Type.BROWSER, require('selenium-webdriver').logging.Level.ALL);
    options.setLoggingPrefs(loggingPrefs);

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        console.log('🌐 Navegando a Cloudfly Dashboard...');
        await driver.get('https://dashboard.cloudfly.com.co/login');

        console.log('🔑 Realizando Login...');
        await driver.wait(until.elementLocated(By.name('email')), 15000);
        await driver.findElement(By.name('email')).sendKeys('mkt_1774026546054');
        await driver.findElement(By.name('password')).sendKeys('Password123!');
        await driver.findElement(By.css('button[type="submit"]')).click();

        await driver.wait(until.urlContains('/dashboard'), 20000);
        console.log('✅ Login Exitoso.');

        console.log('📂 Accediendo a la lista de Pipelines...');
        await driver.get('https://dashboard.cloudfly.com.co/marketing/pipelines/list');
        
        // Esperar a que el botón de nuevo embudo sea visible
        const nuevoBtnSelector = "//button[contains(., 'Nuevo Embudo')]";
        await driver.wait(until.elementLocated(By.xpath(nuevoBtnSelector)), 15000);
        
        console.log('✨ Abriendo el Diálogo Premium...');
        await driver.findElement(By.xpath(nuevoBtnSelector)).click();
        
        // Verificar el marcador visual premium
        const premiumTitleSelector = "//h2[contains(., 'Nuevo Embudo Premium')]";
        await driver.wait(until.elementLocated(By.xpath(premiumTitleSelector)), 10000);
        console.log('💎 Título "Nuevo Embudo Premium" detectado correctamente.');

        console.log('📝 Llenando datos del formulario...');
        await driver.findElement(By.name('name')).sendKeys('Selenium Audit Premium v1.0');
        await driver.findElement(By.name('description')).sendKeys('Prueba de persistencia integral con diseño premium y logs de debug.');

        // Selección de Tipo (si es necesario un clic en dropdown, asumimos el valor por defecto)
        
        console.log('🎨 Agregando etapas del embudo...');
        // El formulario premium requiere al menos una etapa
        const addStageBtn = await driver.findElement(By.xpath("//button[contains(., 'Agregar Etapa')]"));
        await addStageBtn.click();
        
        // Esperar a que el input de la etapa aparezca (animación framer-motion)
        await driver.wait(until.elementLocated(By.name('stages.0.name')), 5000);
        await driver.findElement(By.name('stages.0.name')).sendKeys('Etapa 1: Análisis Selenium');

        console.log('💾 GUARDANDO PIPELINE...');
        // Usamos un selector más robusto para el botón de guardar
        const saveBtn = await driver.findElement(By.xpath("//button[contains(., 'Guardar Embudo')]"));
        await saveBtn.click();

        console.log('⏳ Esperando procesamiento y captura de logs (10s)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('\n📊 --- REPORTE DE CONSOLA [PIPELINE-DEBUG] ---');
        let logs = await driver.manage().logs().get(require('selenium-webdriver').logging.Type.BROWSER);
        let debugLogsFound = false;
        
        logs.forEach(function(entry) {
            if (entry.message.includes('[PIPELINE-DEBUG]')) {
                debugLogsFound = true;
                console.log('\x1b[32m%s\x1b[0m', entry.message); // En verde si es debug
            } else if (entry.level.name === 'SEVERE') {
                console.log('\x1b[31m[ERROR] %s\x1b[0m', entry.message); // En rojo si es error
            }
        });
        
        if (!debugLogsFound) {
            console.log('⚠️ No se encontraron logs de [PIPELINE-DEBUG]. Verifique si el código fue desplegado correctamente.');
        }
        console.log('--- FIN DEL REPORTE ---\n');

        // Verificación final en la tabla
        console.log('🔍 Verificando registro en la tabla...');
        await driver.get('https://dashboard.cloudfly.com.co/marketing/pipelines/list');
        await driver.wait(until.elementLocated(By.xpath("//td[contains(., 'Selenium Audit Premium v1.0')]")), 15000);
        console.log('🏆 ¡ÉXITO! El pipeline se guardó y aparece correctamente en la tabla.');

    } catch (error) {
        console.error('❌ ERROR CRÍTICO durante la auditoría:', error);
        
        // Si hay error, capturamos todos los logs para debugear
        console.log('\n🛑 --- ÚLTIMOS LOGS ANTES DEL FALLO ---');
        let logs = await driver.manage().logs().get(require('selenium-webdriver').logging.Type.BROWSER);
        logs.slice(-20).forEach(e => console.log(`[${e.level.name}] ${e.message}`));
    } finally {
        await driver.quit();
        console.log('🏁 Sesión de auditoría finalizada.');
    }
}

auditPremiumPipeline();
