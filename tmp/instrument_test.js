const fs = require('fs');

async function extractLogs() {
    try {
        const text = fs.readFileSync('tmp/e2e_onboarding_marketing.js', 'utf8');
        // Let's modify the end of the script to write the logs to a JSON file
        const p = console.log;
        const newScript = text.replace(
            "await printBrowserLogs(driver);",
            "await printBrowserLogs(driver);\n        try { const logs = await driver.manage().logs().get(require('selenium-webdriver/lib/logging').Type.BROWSER); fs.writeFileSync('tmp/browser_logs_dump.json', JSON.stringify(logs, null, 2)); } catch(e) {}"
        );
        fs.writeFileSync('tmp/e2e_onboarding_marketing.js', newScript);
    } catch (e) {
        console.error(e);
    }
}
extractLogs();
