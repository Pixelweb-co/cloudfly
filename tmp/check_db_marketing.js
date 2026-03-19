const { execSync } = require('child_process');
const SSH_KEY = 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly';
const API_VPS = 'root@109.205.182.94';
const DB_PASS = 'widowmaker';
const DB_NAME = 'cloud_master';

function runSshSql(sql) {
    const remoteCmd = `docker exec -i mysql mysql -u root -p${DB_PASS} ${DB_NAME} -N -s 2>/dev/null`;
    const localCmd  = `echo ${JSON.stringify(sql)} | ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${API_VPS} "${remoteCmd}"`;
    return execSync(localCmd, { encoding: 'utf8' }).trim();
}

try {
    const ts = '1773888630760';
    console.log(`🔍 Verificando DB para tenant ${ts}...`);
    
    const pipeline = runSshSql(`SELECT name FROM pipelines WHERE name = 'Atención a Clientes' AND tenant_id = (SELECT id FROM clientes WHERE nombre_cliente LIKE '%${ts}%' LIMIT 1);`);
    const campaign = runSshSql(`SELECT name FROM marketing_campaigns WHERE name = 'Atención Clientes' AND tenant_id = (SELECT id FROM clientes WHERE nombre_cliente LIKE '%${ts}%' LIMIT 1);`);
    const channel  = runSshSql(`SELECT name FROM channels WHERE name = 'WhatsApp Principal' AND tenant_id = (SELECT id FROM clientes WHERE nombre_cliente LIKE '%${ts}%' LIMIT 1);`);
    const chatbot  = runSshSql(`SELECT chatbot_type FROM chatbot_config WHERE tenant_id = (SELECT id FROM clientes WHERE nombre_cliente LIKE '%${ts}%' LIMIT 1);`);

    console.log(`   Pipeline   : ${pipeline ? '✅ ' + pipeline : '❌'}`);
    console.log(`   Campaña    : ${campaign ? '✅ ' + campaign : '❌'}`);
    console.log(`   Canal      : ${channel ? '✅ ' + channel : '❌'}`);
    console.log(`   ChatbotType: ${chatbot ? '✅ ' + chatbot : '❌'}`);
    
    if (pipeline && campaign && channel && chatbot) {
        console.log('\n🚀 VERIFICACIÓN EXITOSA: Los componentes de marketing fueron creados correctamente.');
    } else {
        console.log('\n⚠️ VERIFICACIÓN PARCIAL O FALLIDA.');
    }
} catch (e) {
    console.error('Error:', e.message);
}
