const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runE2E() {
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options())
        .build();

    const timestamp = Date.now();
    const username = `admin_${timestamp}`;
    const password = 'Password123!';
    const email = `admin_${timestamp}@example.com`;
    const whatsapp = '573246285134';

    try {
        console.log(`🚀 Iniciando prueba E2E para usuario: ${username}`);
        
        // 1. Registro
        await driver.get('https://dashboard.cloudfly.com.co/register');
        await driver.wait(until.elementLocated(By.name('nombres')), 10000);
        
        await driver.findElement(By.name('nombres')).sendKeys('Admin');
        await driver.findElement(By.name('apellidos')).sendKeys('Test');
        await driver.findElement(By.name('username')).sendKeys(username);
        await driver.findElement(By.name('email')).sendKeys(email);
        await driver.findElement(By.name('password')).sendKeys(password);
        
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        console.log('✅ Registro completado. Esperando redirección...');
        await driver.wait(until.urlContains('/login'), 15000);

        // 2. Login (Asumiendo que se habilita automáticamente o se salta verificación para el test)
        // NOTA: Si se requiere verificación de email, el flujo se detiene aquí. 
        // Pero el usuario pidió llegar al account setup.
        
        await driver.get('https://dashboard.cloudfly.com.co/login');
        await driver.wait(until.elementLocated(By.name('username')), 10000);
        await driver.findElement(By.name('username')).sendKeys(username);
        await driver.findElement(By.name('password')).sendKeys(password);
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        console.log('✅ Login completado. Esperando redirección a account-setup...');
        await driver.wait(until.urlContains('/account-setup'), 15000);

        // 3. Account Setup
        await driver.wait(until.elementLocated(By.name('name')), 10000);
        await driver.findElement(By.name('name')).sendKeys('Empresa Test E2E');
        await driver.findElement(By.name('nit')).sendKeys('123456789-0');
        await driver.findElement(By.name('phone')).sendKeys(whatsapp);
        await driver.findElement(By.name('address')).sendKeys('Calle Falsa 123');
        await driver.findElement(By.name('contact')).sendKeys('Admin Contact');
        await driver.findElement(By.name('position')).sendKeys('Gerente');
        
        // Seleccionar tipo de negocio (Beauty Salon)
        const beautySalon = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
        await beautySalon.click();
        
        await driver.findElement(By.name('objetoSocial')).sendKeys('Esta es una descripción de prueba para el chatbot IA que tiene más de veinte caracteres.');

        console.log('🔔 Previo a enviar. La notificación de bienvenida se disparará ahora.');
        await driver.findElement(By.css('button[type="submit"]')).click();

        console.log('🏁 Flujo completado. Esperando confirmación de notificación...');

    } catch (error) {
        console.error('❌ Error en la prueba E2E:', error);
    } finally {
        await driver.quit();
        console.log(`\n🔑 Credenciales generadas:\nUsuario: ${username}\nPassword: ${password}`);
    }
}

runE2E();
