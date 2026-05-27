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
  console.log('✅ Connected to VPS via SSH key. Recreating marketing-agent container to reload new .env variables...\n');

  // Recreate the container to apply changes from the modified .env file
  const cmd = `
    echo "--- [Recreating container with docker compose up -d] ---"
    docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d --force-recreate marketing-agent
    
    echo ""
    echo "--- [New Active Container Environment Key (showing first 25 chars)] ---"
    docker inspect marketing-agent | grep -i "OPENAI_API_KEY" | cut -c 1-60
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
