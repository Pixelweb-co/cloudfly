const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  console.log('🔄 Starting mysql container...');
  conn.exec('docker start mysql', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ docker start mysql executed');
      conn.end();
    }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
  });
}).connect(config);
