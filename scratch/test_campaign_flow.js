const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Script de prueba para flujo de creación y edición de campañas.
 * Programado para 30 minutos después de la hora actual.
 */
async function runTest() {
    console.log('🚀 Iniciando script de automatización Selenium...');
    
    let options = new chrome.Options();
    // options.addArguments('--headless'); // Descomentar para ejecución sin ventana
    
    // Habilitar logging de la consola
    const loggingPrefs = new (require('selenium-webdriver/lib/logging')).Preferences();
    loggingPrefs.setLevel('browser', 'all');
    options.setLoggingPrefs(loggingPrefs);

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    const printConsoleLogs = async () => {
        const logs = await driver.manage().logs().get('browser');
        logs.forEach(log => {
            console.log(`[BROWSER CONSOLE] [${log.level.name}] ${log.message}`);
        });
    };

    try {
        // 1. LOGIN
        console.log('🌐 Accediendo a la página de login...');
        await driver.get('https://devdashboard.cloudfly.com.co/login');
        
        await driver.wait(until.elementLocated(By.name('email')), 15000);
        await driver.findElement(By.name('email')).sendKeys('manager');
        await driver.findElement(By.name('password')).sendKeys('Password123!', Key.RETURN);
        
        console.log('🔐 Login enviado. Esperando Dashboard...');
        await driver.wait(until.urlContains('/dashboard'), 20000);
        console.log('✅ Login exitoso.');
        await printConsoleLogs();

        // 2. NAVEGAR A NUEVA CAMPAÑA
        console.log('📂 Navegando a creación de campaña...');
        await driver.get('https://devdashboard.cloudfly.com.co/marketing/campaigns/new');
        await driver.wait(until.elementLocated(By.name('name')), 15000);

        // Calcular hora actual + 30 minutos
        const now = new Date();
        const future = new Date(now.getTime() + 30 * 60000);
        
        // Formato para input datetime-local: YYYY-MM-DDTHH:mm
        // Ajustamos por zona horaria local para el input
        const pad = (n) => n.toString().padStart(2, '0');
        const formattedDate = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;

        console.log(`📝 Configurando campaña para las: ${formattedDate}`);

        // Rellenar campos básicos
        await driver.findElement(By.name('name')).sendKeys('Prueba Selenium 30m ' + now.toLocaleTimeString());
        
        // Seleccionar Canal (Select de MUI)
        console.log('📡 Seleccionando canal de envío...');
        const channelSelect = await driver.findElement(By.id('mui-component-select-channelId'));
        await channelSelect.click();
        await driver.wait(until.elementLocated(By.css('li.MuiMenuItem-root')), 5000);
        const firstChannel = await driver.findElement(By.css('li.MuiMenuItem-root'));
        await firstChannel.click();

        // Seleccionar Lista (Select de MUI)
        console.log('👥 Seleccionando lista de audiencia...');
        const listSelect = await driver.findElement(By.id('mui-component-select-sendingListId'));
        await listSelect.click();
        await driver.wait(until.elementLocated(By.css('li.MuiMenuItem-root')), 5000);
        const firstList = await driver.findElement(By.css('li.MuiMenuItem-root'));
        await firstList.click();

        // Mensaje
        await driver.findElement(By.name('message')).sendKeys('Mensaje generado automáticamente por script de prueba Selenium Cloudfly.');

        // Fecha de Programación
        console.log('⏰ Seteando fecha y hora...');
        const dateInput = await driver.findElement(By.name('scheduledAt'));
        
        // Limpiar y setear valor (datetime-local puede ser tricky, enviamos la cadena directamente)
        await dateInput.sendKeys(formattedDate);

        // Click en Guardar
        console.log('💾 Guardando campaña...');
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();

        // 3. VERIFICACIÓN Y EDICIÓN
        console.log('⏳ Esperando redirección a detalle...');
        await driver.wait(until.urlContains('/marketing/campaigns/'), 15000);
        const currentUrl = await driver.getCurrentUrl();
        console.log(`✨ Campaña creada exitosamente: ${currentUrl}`);
        await printConsoleLogs();

        // Esperar a que cargue la vista de edición (que es la misma con los datos cargados)
        await driver.sleep(3000);

        console.log('✏️ Editando el nombre de la campaña...');
        const nameInput = await driver.findElement(By.name('name'));
        // Triple click o CTRL+A para limpiar
        await nameInput.sendKeys(Key.CONTROL, 'a');
        await nameInput.sendKeys(Key.BACK_SPACE);
        await nameInput.sendKeys('Prueba Selenium EDITADA ' + new Date().toLocaleTimeString());

        console.log('🔄 Actualizando campaña...');
        const updateBtn = await driver.findElement(By.css('button[type="submit"]'));
        await updateBtn.click();

        console.log('🎉 Flujo completado con éxito.');
        await printConsoleLogs();
        await driver.sleep(2000);

    } catch (error) {
        console.error('❌ ERROR durante la ejecución:', error);
        await printConsoleLogs();
        // Tomar screenshot en caso de error si fuera necesario
    } finally {
        console.log('🔚 Cerrando navegador...');
        await driver.quit();
    }
}

runTest();
