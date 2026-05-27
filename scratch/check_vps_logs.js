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
  console.log('✅ Connected to VPS. Fetching logs...');
  
  // Fetch lead-scrapper-google logs (last 150 lines)
  console.log('\n--- 🔍 lead-scrapper-google logs (last 150 lines) ---');
  conn.exec('docker logs --tail 150 lead-scrapper-google', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      // Fetch marketing-agent logs next (last 150 lines)
      console.log('\n--- 🎯 marketing-agent logs (last 150 lines) ---');
      conn.exec('docker logs --tail 150 marketing-agent', (err2, stream2) => {
        if (err2) throw err2;
        stream2.on('close', () => {
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
