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

console.log('🚀 [DEPLOY] Rebuilding backend-api + billing-service (no-cache)...');

conn.on('ready', () => {
  console.log('✅ SSH Ready. Running deployment...');
  
  const cmd = [
    'cd /apps/cloudfly',
    'git pull origin desarrollo',
    // Rebuild ambos servicios sin cache
    'docker compose -f docker-compose-full-vps.yml build --no-cache backend-api billing-service',
    // Reiniciar ambos contenedores
    'docker compose -f docker-compose-full-vps.yml up -d backend-api billing-service'
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      if (code === 0) console.log('\n✨ [DEPLOY] backend-api + billing-service deployed!');
      else console.error(`\n❌ Deploy failed with code ${code}`);
      conn.end();
    }).on('data', d => process.stdout.write(d))
      .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', err => {
  console.error('❌ Connection error:', err);
}).connect(config);
