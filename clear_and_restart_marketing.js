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

console.log('🚀 Connecting to VPS to clear sending lists and campaigns, and restart marketing-agent...');

conn.on('ready', () => {
  console.log('✅ Connected to VPS.');
  
  // Limpiamos campañas y listas de envío (y contactos asociados a listas)
  const query = `
    USE cloud_master;
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE campaigns;
    TRUNCATE TABLE sending_list_contacts;
    TRUNCATE TABLE sending_lists;
    TRUNCATE TABLE scheduled_events;
    SET FOREIGN_KEY_CHECKS = 1;
    SELECT 'Tables cleared successfully' AS status;
  `;

  const escapedQuery = query.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `docker exec -i mysql mysql -u root -pwidowmaker -e "${escapedQuery}" && docker compose -f /apps/cloudfly/docker-compose-full-vps.yml restart marketing-agent`;

  console.log(`🏃 Running remote execution: ${cmd}`);

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('✅ Completed remote operation with code:', code);
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
