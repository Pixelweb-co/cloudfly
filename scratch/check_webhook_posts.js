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
  console.log('✅ Connected to VPS. Searching backend-api logs for webhook posts or phone events...');
  
  // Vamos a usar grep para filtrar todo el historial de docker logs
  // Buscaremos '/api/webhooks/evolution' o '/webhooks/evolution' o 'webhook' con POST o '573245640657' o exceptions
  const cmd = 'docker logs backend-api 2>&1 | grep -i -E "webhooks/evolution|573245640657|webhook" | tail -n 200';

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    
    let output = '';
    stream.on('data', (data) => {
      output += data.toString();
    });
    
    stream.stderr.on('data', (data) => {
      output += data.toString();
    });

    stream.on('close', (code, signal) => {
      console.log(`\n--- RESULTADOS DE WEBHOOKS/PHONE ---`);
      console.log(output || 'No se encontraron coincidencias en los logs.');
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
