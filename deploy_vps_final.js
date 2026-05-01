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

console.log('🚀 [DEPLOY] Connecting to VPS (109.205.182.94)...');

conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  
  const commands = [
    'cd /apps/cloudfly',
    'git pull origin main',
    'docker exec -i mysql mysql -u root -pwidowmaker cloud_master < /apps/cloudfly/ai-agent/chatbots.sql',
    'docker compose -f docker-compose-full-vps.yml up -d --build backend-api frontend-react'
  ];

  const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
      console.log(`\n🏃 Running: ${cmd}`);
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream.on('close', (code, signal) => {
          resolve({ cmd, code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data;
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          stderr += data;
          process.stderr.write(data);
        });
      });
    });
  };

  (async () => {
    try {
      for (const cmd of commands) {
        const res = await runCommand(cmd);
        if (res.code !== 0 && !cmd.includes('mysql')) {
           console.error(`❌ Command failed with code ${res.code}`);
           process.exit(1);
        }
      }
      console.log('\n✨ [DEPLOY] Deployment finished successfully!');
    } catch (err) {
      console.error('\n💥 [DEPLOY] Fatal error:', err);
      process.exit(1);
    } finally {
      conn.end();
    }
  })();
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
