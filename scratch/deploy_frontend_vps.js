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

const cmd = 'docker compose -f /apps/cloudfly/docker-compose-full-vps.yml build --no-cache frontend-react && docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d frontend-react';

console.log(`🚀 [VPS] Rebuilding frontend: ${cmd}`);

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      console.log(`\n✅ Exit code: ${code}`);
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
