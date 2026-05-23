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
  console.log('✅ Connected to VPS. Querying external HTTPS contacts API...');
  const cmd = `curl -i -X OPTIONS -H "Origin: https://dashboard.cloudfly.com.co" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Authorization,X-Tenant-Id,X-Company-Id" https://api.cloudfly.com.co/api/v1/contacts && echo "\n\n--- GET REQUEST ---\n" && curl -i -H "Origin: https://dashboard.cloudfly.com.co" https://api.cloudfly.com.co/api/v1/contacts`;
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
}).connect(config);
