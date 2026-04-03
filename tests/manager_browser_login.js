const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// URL y Credenciales
const LOGIN_URL = 'https://dashboard.cloudfly.com.co/login';
const credentials = {
    username: 'manager',
    password: 'Password123!'
};

async function managerBrowserLoginTest() {
    console.log('🌐 Iniciando Prueba Selenium: Login de Manager Master...');
    
    let options = new chrome.Options();
    // Desactivar sandbox si es necesario para Windows/WSL
    // options.addArguments('--no-sandbox');
    // options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log(`🌍 Navegando a ${LOGIN_URL}...`);
        await driver.get(LOGIN_URL);

        // Esperar a que el campo de usuario sea visible
        console.log('🔑 Llenando formulario de login...');
        await driver.wait(until.elementLocated(By.name('username')), 10000);
        
        const usernameField = await driver.findElement(By.name('username'));
        const passwordField = await driver.findElement(By.name('password'));
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));

        await usernameField.sendKeys(credentials.username);
        await passwordField.sendKeys(credentials.password);
        
        console.log('🖱️ Haciendo clic en "Iniciar sesión"...');
        await loginButton.click();

        // Esperar redirección al Home (URL debe contener /home)
        console.log('⏳ Esperando redirección al panel principal...');
        await driver.wait(until.urlContains('/home'), 15000);

        const currentUrl = await driver.getCurrentUrl();
        console.log(`✅ ¡LOGIN EXITOSO! Redirigido a: ${currentUrl}`);

        // Capturar títulos para validación visual
        const dashboardTitle = await driver.getTitle();
        console.log(`📑 Título de la página: ${dashboardTitle}`);

        // Verificación de presencia de elementos de Manager (ej. Menú)
        console.log('🔍 Verificando estado de la sesión...');
        const welcomeText = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Bienvenido')]")), 5000);
        console.log('🎉 Panel de control cargado correctamente.');

    } catch (error) {
        console.log('\n❌ FALLA EN LA PRUEBA E2E');
        console.log('-----------------------------------');
        console.error('Error:', error.message);
        
        // Capturar captura de pantalla en caso de error (opcional)
        // await driver.takeScreenshot().then(image => require('fs').writeFileSync('tests/login_error.png', image, 'base64'));
    } finally {
        await driver.quit();
        console.log('\n🏁 Sesión Selenium finalizada.');
    }
}

managerBrowserLoginTest();
