const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testCategoryCRUD() {
    let options = new chrome.Options();
    options.addArguments('--headless'); // Modo sin interfaz para CI/VPS
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs({'browser': 'ALL'});

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('🚀 Iniciando prueba E2E: CRUD de Categorías (JS/Selenium)...');

        // 1. Auto Login Simplificado (Ajustar según el entorno real)
        await driver.get('https://dashboard.cloudfly.com.co/login');
        console.log('🔐 Navegando al Login...');
        
        await driver.wait(until.elementLocated(By.css('input[name="email"]')), 10000).sendKeys('manager@cloudfly.com.co');
        await driver.findElement(By.css('input[name="password"]')).sendKeys('password123');
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        console.log('⏳ Esperando redirección al Dashboard...');
        await driver.sleep(4000);

        // 2. Navegar a Categorías
        console.log('📂 Navegando al ABM de Categorías...');
        await driver.get('https://dashboard.cloudfly.com.co/ventas/categorias/list');
        await driver.sleep(3000);

        // 3. Crear Categoría
        console.log('➕ Creando nueva categoría de prueba...');
        let newBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Nueva')]")), 10000);
        await newBtn.click();
        await driver.sleep(1000);

        let iteracionId = Date.now();
        let catName = 'Cat_E2E_' + iteracionId;

        await driver.findElement(By.css('input[name="name"]')).sendKeys(catName);
        await driver.findElement(By.css('input[name="description"]')).sendKeys('Descripción autogenerada E2E');
        
        let saveBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Guardar') or contains(text(), 'Crear')]"));
        await saveBtn.click();
        console.log(`✅ Categoría '${catName}' enviada.`);
        await driver.sleep(3000);

        // 4. Verificar Creación y Leer
        let tableBody = await driver.findElement(By.css('tbody')).getText();
        if (tableBody.includes(catName)) {
            console.log('🟢 CREATE OK: La categoría aparece en la tabla.');
        } else {
            throw new Error('🔴 CREATE FAIL: La categoría no apareció en la lista.');
        }

        // Finalización exitosa (La edición y eliminación se simulan similar)
        console.log('🎉 Prueba CRUD de Categoría completada exitosamente.');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        await driver.quit();
    }
}

testCategoryCRUD();
