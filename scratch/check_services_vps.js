const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'cloudfly.com.co',
  port: 10622,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('SSH Ready');
  // Check docker containers and their status
  conn.exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect(config);
