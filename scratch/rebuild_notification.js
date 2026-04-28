const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const rebuildCommand = 'cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d --build notification-service';
  
  conn.exec(rebuildCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Rebuild completed. Code: ' + code);
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
