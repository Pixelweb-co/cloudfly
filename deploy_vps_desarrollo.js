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

console.log('🚀 [DEPLOY] Connecting to VPS (api.cloudfly.com.co:22)...');

conn.on('ready', () => {
  console.log('✅ SSH Client Ready. Running deployment commands...');
  
  const deploymentCmd = [
    'cd /apps/cloudfly',
    'git stash',                  // Guardar cambios locales temporales (ej. instances.json)
    'git checkout desarrollo',    // Asegurar que estamos en desarrollo
    'git pull origin desarrollo', // Traer los últimos cambios
    'docker compose -f docker-compose-full-vps.yml up -d --build'
  ].join(' && ');

  console.log(`\n🏃 Running: ${deploymentCmd}`);

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
