const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected to VPS. Checking active processes on host...');
  
  conn.exec('ps aux | grep -E "mysql|unify|mariadb"', (err, stream) => {
    if (err) throw err;
    stream.on('data', data => console.log(data.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly')
});
