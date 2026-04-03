const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testLoginAndDashboard() {
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setAcceptInsecureCerts(true);

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('Navigating to login page...');
        await driver.get('https://dashboard.cloudfly.com.co/login');

        // Wait for login form
        await driver.wait(until.elementLocated(By.name('username')), 10000);
        
        console.log('Entering credentials...');
        await driver.findElement(By.name('username')).sendKeys('manager');
        await driver.findElement(By.name('password')).sendKeys('Password123!');
        
        console.log('Clicking login button...');
        await driver.findElement(By.css('button[type="submit"]')).click();

        // Wait for dashboard or home page
        console.log('Waiting for dashboard redirection...');
        await driver.wait(until.urlContains('/home'), 15000);
        console.log('Current URL:', await driver.getCurrentUrl());

        // Wait a bit for async requests
        await driver.sleep(5000);

        // Get browser logs
        console.log('\n--- BROWSER CONSOLE LOGS ---');
        let logs = await driver.manage().logs().get('browser');
        logs.forEach(log => {
            console.log(`[${log.level.name}] ${log.message}`);
        });

        // Take screenshot
        let screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('dashboard_verification.png', screenshot, 'base64');
        console.log('\nScreenshot saved as dashboard_verification.png');

    } catch (error) {
        console.error('Test failed:', error);
        // Take error screenshot
        let screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('login_error.png', screenshot, 'base64');
    } finally {
        await driver.quit();
    }
}

testLoginAndDashboard();
