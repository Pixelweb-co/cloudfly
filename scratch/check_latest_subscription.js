const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  // Ver logs del billing-service para detectar errores con Wompi
  conn.exec(`docker logs billing-service --tail 50 2>&1`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', e => console.error(e))
  .connect({ host: '109.205.182.94', port: 22, username: 'root', privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly') });
