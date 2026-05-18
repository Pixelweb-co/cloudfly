const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

console.log('🚀 Connecting to VPS to download recent logs...');

conn.on('ready', () => {
  console.log('✅ Connected. Downloading last 1500 lines of backend logs...');
  
  const cmd = 'docker logs backend-api --tail 1500';

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let logData = '';
    stream.on('close', (code, signal) => {
      fs.writeFileSync('c:/apps/cloudfly/scratch/recent_backend_logs.txt', logData);
      console.log('✅ Download completed! Logs saved to scratch/recent_backend_logs.txt');
      conn.end();
    }).on('data', (data) => {
      logData += data;
    }).stderr.on('data', (data) => {
      logData += data;
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
