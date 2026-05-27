const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS DB. Querying tenant 79 and contact 281...');
  const sql = `
    SELECT '=== TENANT ===' as '';
    SELECT * FROM tenants WHERE id = 79;
    
    SELECT '=== APPOINTMENTS ===' as '';
    SELECT * FROM appointments WHERE tenant_id = 79;
    
    SELECT '=== AVAILABILITY TEMPLATES ===' as '';
    SELECT * FROM availability_templates WHERE tenant_id = 79;
    
    SELECT '=== AVAILABILITY SLOTS ===' as '';
    SELECT * FROM availability_slots WHERE tenant_id = 79 ORDER BY start_time DESC LIMIT 10;
    
    SELECT '=== CONTACTS ===' as '';
    SELECT id, tenant_id, name, phone, chatbot_enabled FROM contacts WHERE tenant_id = 79 AND (id = 281 OR phone LIKE '%573245640657%' OR phone LIKE '%3245640657%');
  `;
  const escapedQuery = sql.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "${escapedQuery}"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
