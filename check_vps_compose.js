const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS via SSH key.\n');
  
  const cmd = `
    echo "=== COMPOSE SERVICES DEFINED ===" && \
    cd /apps/cloudfly && \
    docker compose -f docker-compose-full-vps.yml config --services && \
    echo "" && \
    echo "=== COMPOSE STATUS ===" && \
    docker compose -f docker-compose-full-vps.yml ps -a && \
    echo "" && \
    echo "=== IMAGES ON VPS ===" && \
    docker images
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
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
