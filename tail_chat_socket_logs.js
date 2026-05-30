const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

conn.on('ready', () => {
  console.log('📡 Tailing chat-socket-service logs in real-time...');
  console.log('   Envía un mensaje desde un contacto externo para verificar el fix.\n');
  conn.exec('docker logs --tail 10 -f chat_socket 2>&1', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stdout.write(d));
  });
}).connect(config);
