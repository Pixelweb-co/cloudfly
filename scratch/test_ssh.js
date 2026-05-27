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

console.log('Testing SSH connection...');

conn.on('ready', () => {
  console.log('SSH connection successful!');
  conn.exec('uptime', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Connection closed.');
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH connection failed:', err);
  process.exit(1);
}).connect(config);
