const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

console.log('🚀 [DEPLOY] Connecting to VPS to build ONLY Frontend...');

conn.on('ready', () => {
  console.log('✅ SSH Client Ready. Running deployment commands...');
  
  const deploymentCmd = [
    'cd /apps/cloudfly',
    'git stash',
    'git checkout desarrollo',
    'git pull origin desarrollo',
    // Limpiar caché de docker builder y forzar solo el build del frontend
    'docker builder prune -f',
    'docker compose -f docker-compose-full-vps.yml build --no-cache frontend-react',
    'docker compose -f docker-compose-full-vps.yml up -d frontend-react'
  ].join(' && ');

  console.log(`\n🏃 Running: ${deploymentCmd}`);

  conn.exec(deploymentCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      if (code === 0) {
        console.log('\n✨ [DEPLOY] Frontend Deployment finished successfully!');
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
