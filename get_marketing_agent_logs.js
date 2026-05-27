const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS. Fetching marketing-agent logs...');
  conn.exec('docker logs --tail 300 marketing-agent', (err, stream) => {
    if (err) throw err;
    let logData = '';
    stream.on('close', (code, signal) => {
      fs.writeFileSync('temp_marketing_agent_logs.txt', logData);
      console.log('Logs saved to temp_marketing_agent_logs.txt');
      conn.end();
    }).on('data', (data) => {
      logData += data;
    }).stderr.on('data', (data) => {
      logData += data;
    });
  });
}).connect(config);
