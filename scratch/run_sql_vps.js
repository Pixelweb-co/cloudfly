const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

conn.on('ready', () => {
  console.log('✅ SSH Client Ready. Running SQL queries...');
  
  const sql = `
    USE cloud_master;

    -- Usar updated_at en lugar de updatedAt
    INSERT INTO channels 
      (tenant_id, company_id, name, platform, provider, status, instance_name, created_at, updated_at)
    SELECT 79, 80, 'WhatsApp Principal', 'WHATSAPP', 'EVOLUTION_API', 1, 'cloudfly_t79_c80', NOW(), NOW()
    FROM DUAL
    WHERE NOT EXISTS (
      SELECT 1 FROM channels WHERE tenant_id = 79 AND company_id = 80 AND platform = 'WHATSAPP'
    );

    INSERT INTO channels 
      (tenant_id, company_id, name, platform, provider, status, instance_name, created_at, updated_at)
    SELECT 78, 79, 'WhatsApp Principal', 'WHATSAPP', 'EVOLUTION_API', 1, 'cloudfly_t78_c79', NOW(), NOW()
    FROM DUAL
    WHERE NOT EXISTS (
      SELECT 1 FROM channels WHERE tenant_id = 78 AND company_id = 79 AND platform = 'WHATSAPP'
    );

    SELECT id, tenant_id, company_id, name, instance_name, platform, status FROM channels WHERE tenant_id IN (78, 79);
  `;

  // Limpiamos los comentarios para evitar problemas con el aplanamiento y docker exec
  const cleanSql = sql
    .split('\n')
    .map(line => line.split('--')[0].trim()) // Eliminar comentarios de línea SQL
    .filter(Boolean)
    .join(' ');

  const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${cleanSql}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n✅ SQL Command finished with code ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
