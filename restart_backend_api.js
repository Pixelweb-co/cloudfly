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
  console.log('✅ Connected to VPS via SSH key. Restarting backend-api to reload new tables...\n');
  
  const cmd = 'docker compose -f /apps/cloudfly/docker-compose-full-vps.yml restart backend-api';

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log(`\n🏁 Container restart finished with code ${code}`);
      
      // Let's stream the new logs to verify successful boot
      console.log('\n⏳ Streaming backend-api logs in 5 seconds...');
      setTimeout(() => {
        conn.exec('docker logs --tail 50 backend-api', (err2, stream2) => {
          if (err2) {
            conn.end();
            return;
          }
          stream2.on('close', () => conn.end())
                 .on('data', d => process.stdout.write(d))
                 .stderr.on('data', e => process.stderr.write(e));
        });
      }, 5000);
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
