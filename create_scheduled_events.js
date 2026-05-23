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
  console.log('✅ Connected to VPS. Creating scheduled_events table if missing...');
  
  const query = `
    USE cloud_master;
    CREATE TABLE IF NOT EXISTS scheduled_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        subscription_id BIGINT NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        scheduled_at DATETIME NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        payload TEXT NULL,
        retry_count INT NOT NULL DEFAULT 0,
        executed_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    );
    DESCRIBE scheduled_events;
  `;

  // Escape query for bash double quotes
  const escapedQuery = query.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `docker exec -i mysql mysql -u root -pwidowmaker -e "${escapedQuery}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('✅ Remote script execution finished with code:', code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
