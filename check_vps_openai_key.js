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
  console.log('✅ Connected to VPS via SSH key. Reading environment variables...\n');
  
  // Command to print OPENAI_API_KEY from .env, and get OPENAI_API_KEY from docker inspect of marketing-agent container
  const cmd = `
    echo "--- [VPS .env File] ---"
    grep -i "OPENAI_API_KEY" /apps/cloudfly/.env || echo "OPENAI_API_KEY not found in /apps/cloudfly/.env"
    
    echo ""
    echo "--- [marketing-agent Container Env] ---"
    docker inspect marketing-agent | grep -i "OPENAI_API_KEY" || echo "OPENAI_API_KEY not found in marketing-agent container inspect"
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
