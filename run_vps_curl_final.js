const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly')
};

conn.on('ready', () => {
  const payload = JSON.stringify({
    mode: 'automatic',
    filters: {
      keyword: 'veterinarias',
      country: 'Colombia',
      limit: 3,
      source: 'google_search',
      enrich: true
    }
  });

  // Call generating endpoint and immediately tail logs
  const cmd = [
    `curl -s -X POST http://localhost:8001/leads/generate -H "Content-Type: application/json" -d '${payload}'`,
    'echo "=== Container Logs ==="',
    'docker compose -f /apps/cloudfly/docker-compose-full-vps.yml logs --tail=20 lead-generator'
  ].join(' && ');

  console.log('Running on VPS:', cmd);

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (d) => {
      process.stdout.write(d);
    }).stderr.on('data', (d) => {
      process.stderr.write(d);
    });
  });
}).connect(config);
