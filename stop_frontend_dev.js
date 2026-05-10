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
  conn.exec('cd /root/cloudfly && docker stop frontend-dev', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ frontend-dev stopped successfully');
      conn.end();
    }).on('data', d => console.log(d.toString())).stderr.on('data', e => console.error(e.toString()));
  });
}).connect(config);
