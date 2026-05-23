const { Client } = require('ssh2');
const fs = require('fs');

const keys = ['id_rsa_cloudfly', 'id_rsa'];
const host = 'api.cloudfly.com.co';
const port = 22;

function tryKey(index) {
  if (index >= keys.length) {
    console.error('❌ All keys failed to authenticate.');
    return;
  }
  
  const keyName = keys[index];
  console.log(`🔑 Trying SSH key: ${keyName} to ${host}:${port}...`);
  
  const conn = new Client();
  conn.on('ready', () => {
    console.log(`✅ Success! Authenticated using key: ${keyName}\n`);
    conn.exec('echo "=== DOCKER STATUS ===" && docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Ports}}"', (err, stream) => {
      if (err) {
        console.error(err);
        conn.end();
        return;
      }
      stream.on('close', () => conn.end())
            .on('data', d => process.stdout.write(d))
            .stderr.on('data', e => process.stderr.write(e));
    });
  }).on('error', (err) => {
    console.error(`❌ Key ${keyName} failed: ${err.message}`);
    tryKey(index + 1);
  }).connect({
    host: host,
    port: port,
    username: 'root',
    privateKey: fs.readFileSync(`C:/Users/Edwin/.ssh/${keyName}`),
    readyTimeout: 10000
  });
}

tryKey(0);
