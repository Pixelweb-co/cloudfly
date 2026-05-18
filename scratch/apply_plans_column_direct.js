const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  console.log('🚀 SSH Client Connected. Altering plans table directly...');
  
  const sql = `
    USE cloud_master;
    ALTER TABLE plans ADD COLUMN is_basic TINYINT(1) DEFAULT 0 AFTER is_free;
    UPDATE plans SET is_basic = 1 WHERE name LIKE '%básico%' OR name LIKE '%basic%' OR (is_free = 0 AND is_active = 1) LIMIT 1;
  `.replace(/\n/g, ' ').trim();
  
  const remoteCmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${sql}"`;
  
  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`✅ SQL alter finished with code ${code}`);
      conn.end();
    }).on('data', (d) => {
      process.stdout.write(d.toString());
    }).stderr.on('data', (e) => {
      process.stderr.write(e.toString());
    });
  });
}).connect(config);
