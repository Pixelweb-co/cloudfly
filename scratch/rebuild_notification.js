const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  // Process: git fetch -> git reset --hard -> rebuild notification-service
  const deployCommand = 'cd /apps/cloudfly && git fetch origin main && git reset --hard origin/main && docker compose -f docker-compose-full-vps.yml up -d --build notification-service';
  
  conn.exec(deployCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Deployment completed. Code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 20000
});
