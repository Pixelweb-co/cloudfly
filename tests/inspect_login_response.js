const https = require('https');

const options = {
    hostname: 'api.cloudfly.com.co',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const credentials = JSON.stringify({
    username: 'manager_master',
    password: 'CloudFly2026!'
});

console.log('🔍 Inspeccionando DTO de respuesta para Manager Master...');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        try {
            const obj = JSON.parse(data);
            console.log('📦 Payload de Respuesta Rectivo:');
            console.log(JSON.stringify(obj, null, 2));
        } catch (e) {
            console.log('⚠️ No se pudo parsear como JSON:', data);
        }
    });
});

req.write(credentials);
req.end();
