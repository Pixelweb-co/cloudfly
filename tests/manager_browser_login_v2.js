const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const logging = require('selenium-webdriver/lib/logging');

// URL y Credenciales
const BASE_URL = 'https://dashboard.cloudfly.com.co';
const credentials = {
    username: 'manager',
    password: 'Password123!'
};

async function printBrowserLogs(driver) {
    try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        if (logs.length > 0) {
            console.log('\n🌐 [BROWSER CONSOLE LOGS]');
            logs.forEach(log => {
                console.log(`   [${log.level.name}] ${log.message}`);
                if (log.message.includes('401') || log.message.includes('500') || log.message.includes('Error')) {
                    console.log('   🚨 Error detectado en consola.');
                }
            });
            console.log('-------------------------------\n');
        }
    } catch (e) { }
}

async function runTest() {
    console.log('🚀 Iniciando Prueba E2E: Login de Manager (Onboarding Flow Style)...');
    
    let chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--start-maximized', '--no-sandbox', '--disable-dev-shm-usage');
    
    // Configurar captura de logs
    const prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
    chromeOptions.setLoggingPrefs(prefs);

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        console.log(`🌍 Navegando a ${BASE_URL}/login...`);
        await driver.get(`${BASE_URL}/login`);

        await driver.wait(until.elementLocated(By.name('username')), 15000);
        
        const usernameField = await driver.findElement(By.name('username'));
        const passwordField = await driver.findElement(By.name('password'));
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));

        console.log(`👤 Ingresando usuario: ${credentials.username}`);
        await usernameField.sendKeys(credentials.username);
        await passwordField.sendKeys(credentials.password);
        
        console.log('🖱️ Clic en Iniciar sesión...');
        await loginButton.click();

        // Esperar redirección
        console.log('⏳ Esperando redirección (Dashboard o Onboarding)...');
        
        // El usuario puede ir a /home o /account-setup
        try {
            await driver.wait(until.urlMatches(/\/home|\/account-setup/), 20000);
            const finalUrl = await driver.getCurrentUrl();
            console.log(`✅ ¡LOGIN EXITOSO! Redirigido a: ${finalUrl}`);
            
            if (finalUrl.includes('/account-setup')) {
                console.log('⚠️ El usuario está en el flujo de Onboarding.');
            } else {
                console.log('🏆 Acceso directo al Dashboard confirmado.');
            }
        } catch (e) {
            console.log('❌ Timeout esperando redirección.');
            await printBrowserLogs(driver);
            throw e;
        }

        // Post-login check
        await driver.sleep(2000);
        await printBrowserLogs(driver);

    } catch (error) {
        console.error(`\n❌ FALLA EN LA PRUEBA: ${error.message}`);
        await printBrowserLogs(driver);
    } finally {
        await driver.quit();
        console.log('🏁 Sesión Selenium finalizada.');
    }
}

runTest();
