const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testForgotPassword() {
    let options = new chrome.Options();
    options.addArguments('--headless'); // Comentar para ver el navegador si el entorno lo permite
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs({'browser': 'ALL'});

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('🚀 Iniciando prueba de recuperación de contraseña UI...');
        await driver.get('https://dashboard.cloudfly.com.co/recover-password');

        // Esperar a que el input esté presente (MUI TextField suele ser un input dentro de un div)
        const emailInput = await driver.wait(until.elementLocated(By.css('input[type="email"], input[name="email"], input.MuiInputBase-input')), 15000);
        await emailInput.sendKeys('egbmaster2007@gmail.com');
        console.log('📝 Email ingresado.');

        // Encontrar y clic en el botón de enviar
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();
        console.log('🔘 Botón presionado. Esperando respuesta...');

        // Esperar unos segundos para la respuesta
        await driver.sleep(5000);

        // Obtener logs de la consola del navegador
        const logs = await driver.manage().logs().get('browser');
        console.log('\n--- 📋 CONSOLE LOGS DEL NAVEGADOR ---');
        logs.forEach(log => {
            console.log(`[${log.level.name}] ${log.message}`);
        });
        console.log('-------------------------------------\n');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        await driver.quit();
    }
}

testForgotPassword();
