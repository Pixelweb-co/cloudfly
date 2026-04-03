const https = require('https');

async function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.cloudfly.com.co',
            port: 443,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const credentials = JSON.stringify({
            username: 'manager_master',
            password: 'CloudFly2026!'
        });

        console.log(`📡 Probando: https://${options.hostname}${path}...`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📊 Status Code: ${res.statusCode}`);
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Error: ${e.message}`);
            resolve(500);
        });

        req.write(credentials);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Iniciando Comparación de Endpoints...');
    await testEndpoint('/api/auth/login');
    await testEndpoint('/auth/login');
    console.log('🏁 Pruebas finalizadas.');
}

runTests();
