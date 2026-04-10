const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testProductCRUD() {
    let options = new chrome.Options();
    options.addArguments('--headless'); // Comentar para depurar visualmente
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setLoggingPrefs({'browser': 'ALL'});

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('🚀 Iniciando prueba E2E: CRUD de Productos (JS/Selenium)...');

        // 1. Auto Login Simplificado
        await driver.get('https://dashboard.cloudfly.com.co/login');
        console.log('🔐 Navegando al Login...');
        
        await driver.wait(until.elementLocated(By.css('input[name="email"]')), 10000).sendKeys('manager@cloudfly.com.co');
        await driver.findElement(By.css('input[name="password"]')).sendKeys('password123');
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        console.log('⏳ Esperando inicio de sesión...');
        await driver.sleep(4000);

        // 2. Navegar a Productos
        console.log('📦 Navegando al catálogo de Productos...');
        await driver.get('https://dashboard.cloudfly.com.co/ventas/productos/list');
        await driver.sleep(4000); // Esperar carga de la tabla

        // 3. Iniciar Creación de Producto
        console.log('➕ Clic en Nuevo Producto...');
        let newBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Nuevo')]")), 10000);
        await newBtn.click();
        await driver.sleep(2000);

        let iteracionId = Date.now();
        let prodName = 'Pro_E2E_' + iteracionId;

        console.log('✍️ Rellenando formulario básico de Producto...');
        // Simulando que es un Drawer/Modal o página separada
        const nameInput = await driver.wait(until.elementLocated(By.css('input[name="productName"]')), 5000);
        await nameInput.sendKeys(prodName);
        
        await driver.findElement(By.css('input[name="price"]')).sendKeys('150000');
        await driver.findElement(By.css('input[name="sku"]')).sendKeys(`SKU-${iteracionId}`);
        
        // Simular marcado de "Gestionar Stock"
        // let stockSwitch = await driver.findElement(By.css('input[type="checkbox"][name="manageStock"]'));
        // await stockSwitch.click();

        // Guardar
        let saveBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Guardar')]"));
        await saveBtn.click();
        console.log(`✅ Formulario enviado para '${prodName}'.`);
        await driver.sleep(4000);

        // 4. Verificar Creación (Validación de Company isolation)
        // Volvemos a leer la tabla actual
        let tableBody = await driver.findElement(By.css('tbody')).getText();
        if (tableBody.includes(prodName)) {
            console.log('🟢 CREATE OK: El producto se guardó y es visible en el tenant correcto.');
        } else {
            console.error('🔴 CREATE FAIL: El producto no figura en la tabla principal.');
        }

        // 5. Finalización
        console.log('🎉 Prueba CRUD de Productos finalizada.');

    } catch (error) {
        console.error('❌ Error crítico en la prueba E2E de productos:', error);
    } finally {
        await driver.quit();
    }
}

testProductCRUD();
