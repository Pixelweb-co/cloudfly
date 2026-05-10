const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS');
  const cmd = `cd /apps/cloudfly && git pull origin main && docker rm -f frontend-react && docker rmi -f cloudfly-frontend-react && docker compose -f docker-compose-full-vps.yml build --no-cache frontend-react && docker compose -f docker-compose-full-vps.yml up -d frontend-react`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log(`✅ Frontend build process completed with code ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
