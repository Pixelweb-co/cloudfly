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
  
  const deploymentCmd = [
    'cd /apps/cloudfly',
    'git fetch origin',
    'git reset --hard origin/main',
    'docker exec -i mysql mysql -u root -pwidowmaker cloud_master < /apps/cloudfly/ai-agent/chatbots.sql',
    'docker compose -f docker-compose-full-vps.yml up -d --build backend-api frontend-react'
  ].join(' && ');

  console.log(`\n🏃 Running Deployment Pipeline...`);
  
  conn.exec(deploymentCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      if (code === 0) {
        console.log('\n✨ [DEPLOY] Deployment finished successfully!');
      } else {
        console.error(`\n❌ Deployment failed with code ${code}`);
      }
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
