const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS (api.cloudfly.com.co:22) with password auth!\n');
  
  const cmd = 'echo "=== MEMORY STATUS ===" && free -h && echo "" && echo "=== DISK STATUS ===" && df -h / && echo "" && echo "=== RUNNING DOCKER CONTAINERS ===" && docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Ports}}"';

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
