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

console.log('🚀 Connecting to VPS to search backend-api logs for the specific Request ID...');

conn.on('ready', () => {
  console.log('✅ Connected. Searching logs for request "89c40774"...');
  
  // Search for the request ID with context to see the exact exception trace
  const cmd = 'docker logs backend-api 2>&1 | grep -a -A 100 "89c40774"';

  conn.exec(cmd, (err, stream) => {
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
  console.error('❌ Connection error:', err);
}).connect(config);
