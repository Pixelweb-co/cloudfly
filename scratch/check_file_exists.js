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
  console.log('✅ Connected to VPS. Checking files in uploads directory...');
  conn.exec('ls -la /apps/cloudfly/uploads; ls -la /apps/cloudfly/uploads/media; ls -la /apps/cloudfly/uploads/media/1', (err, stream) => {
    if (err) throw err;
    let dataBuffer = '';
    stream.on('close', (code, signal) => {
      console.log('=== FILES ===');
      console.log(dataBuffer);
      conn.end();
    }).on('data', (data) => {
      dataBuffer += data;
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
