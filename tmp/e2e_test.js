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
        // Added the missing confirm password
        await driver.findElement(By.name('confirmPassword')).sendKeys(password);
        
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        console.log('✅ Registro completado. Esperando un momento para activación...');
        await new Promise(r => setTimeout(r, 3000)); // wait 3s for DB insert to finish

        // 1.5 Activación en base de datos
        console.log('1.5 Activando usuario en base de datos...');
        const { execSync } = require('child_process');
        const sqlCmd = `UPDATE cloud_master.users SET is_enabled = true WHERE username = '${username}';`;
        const sshCmd = `ssh -i C:\\\\Users\\\\Edwin\\\\.ssh\\\\id_rsa_cloudfly root@109.205.182.94 "docker exec mysql mysql -u root -pwidowmaker cloud_master -e \\"${sqlCmd}\\""`;
        try {
            execSync(sshCmd);
            console.log('✅ Usuario activado');
        } catch (e) {
            console.error('❌ Error activando usuario:', e.message);
            return;
        }
        
        await driver.get('https://dashboard.cloudfly.com.co/login');
        await driver.wait(until.elementLocated(By.name('username')), 10000);
        await driver.findElement(By.name('username')).sendKeys(username);
        await driver.findElement(By.name('password')).sendKeys(password);
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        console.log('✅ Login completado. Esperando redirección a account-setup...');
        await driver.wait(until.urlContains('/account-setup'), 15000);

        // 3. Account Setup
        console.log('3. Account Setup - Paso 1: Pantalla de Bienvenida');
        // Wait for the "Continuar" button on step 0
        await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Continuar')]")), 15000);
        await driver.sleep(1000); // Give it a moment to render
        await driver.findElement(By.xpath("//button[contains(text(), 'Continuar')]")).click();

        console.log('3. Account Setup - Paso 2: Información del Negocio');
        await driver.wait(until.elementLocated(By.name('name')), 10000);
        await driver.findElement(By.name('name')).sendKeys('Empresa Test E2E');
        await driver.findElement(By.name('nit')).sendKeys('123456789-0');
        await driver.findElement(By.name('phone')).sendKeys(whatsapp);
        await driver.findElement(By.name('address')).sendKeys('Calle Falsa 123');
        await driver.findElement(By.name('contact')).sendKeys('Admin Contact');
        await driver.findElement(By.name('position')).sendKeys('Gerente');
        
        // Seleccionar tipo de negocio (Salón de Belleza)
        const beautySalon = await driver.findElement(By.xpath("//*[contains(text(), 'Salón de Belleza')]"));
        await beautySalon.click();
        
        await driver.findElement(By.name('objetoSocial')).sendKeys('Esta es una descripción de prueba para el chatbot IA que tiene más de veinte caracteres.');

        console.log('🔔 Previo a enviar Información del Negocio. La notificación de bienvenida se disparará ahora.');
        // Submitting FormCustomer
        await driver.findElement(By.css('button[type="submit"]')).click();

        console.log('Esperando el siguiente paso (Configuración Chatbot)...');
        await driver.sleep(5000);

        console.log('🏁 Flujo completado. Esperando confirmación de notificación...');

    } catch (error) {
        console.error('❌ Error en la prueba E2E:', error);
    } finally {
        await driver.quit();
        console.log(`\n🔑 Credenciales generadas:\nUsuario: ${username}\nPassword: ${password}`);
    }
}

runE2E();
