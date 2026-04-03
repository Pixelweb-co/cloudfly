const https = require('https');

// Configuración de la API y credenciales
const options = {
    hostname: 'api.cloudfly.com.co',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const credentials = JSON.stringify({
    username: 'manager_master',
    password: 'CloudFly2026!'
});

console.log('🚀 Iniciando Prueba de Login Nativa para Manager Master...');
console.log(`📡 URL Objetivo: https://${options.hostname}${options.path}`);
console.log(`👤 Usuario: manager_master`);

const req = https.request(options, (res) => {
    let data = '';

    console.log(`\n📊 Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ ¡LOGIN EXITOSO! (200 OK)');
            console.log('-----------------------------------');
            try {
                const responseData = JSON.parse(data);
                if (responseData.jwt || responseData.token) {
                    console.log('🔑 Token JWT recibido satisfactoriamente.');
                    console.log(`🛡️ Rol: ${responseData.user?.roles?.[0]?.name || 'N/A'}`);
                } else {
                    console.log('⚠️ Alerta: Login exitoso pero no se detectó token.');
                }
            } catch (e) {
                console.log('⚠️ Respuesta no válida en formato JSON.');
            }
        } else {
            console.log('\n❌ FALLO EN LA AUTENTICACIÓN');
            console.log('-----------------------------------');
            console.log(`Motivo: ${data || 'Desconocido'}`);
            if (res.statusCode === 401) {
                console.log('💡 Sugerencia: Revisa que el hash de contraseña en la DB sea correcto.');
            }
        }
    });
});

req.on('error', (e) => {
    console.error(`\n❌ Error de red: ${e.message}`);
});

req.write(credentials);
req.end();
