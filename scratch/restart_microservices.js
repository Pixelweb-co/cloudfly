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
  console.log('🔄 Restarting backend-api and scheduler-service containers to refresh database connections...');
  
  conn.exec('docker restart backend-api scheduler-service', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Microservices restarted successfully!');
      conn.end();
    }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
  });
}).connect(config);
