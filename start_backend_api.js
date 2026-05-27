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
  
  // Try to start backend-api and output the compose logs/errors
  const cmd = 'cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d backend-api';

  console.log(`🏃 Executing on VPS: ${cmd}\n`);
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log(`\n🏁 Command finished with exit code ${code}`);
      
      // Let's also check if it created the container by running docker ps -a filter
      console.log('\n🔍 Verifying if container was created...');
      conn.exec('docker ps -a --filter name=backend-api', (err2, stream2) => {
        if (err2) {
          conn.end();
          return;
        }
        stream2.on('close', () => conn.end())
               .on('data', d => process.stdout.write(d))
               .stderr.on('data', e => process.stderr.write(e));
      });
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
