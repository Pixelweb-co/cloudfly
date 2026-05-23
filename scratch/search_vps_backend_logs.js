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
  console.log('✅ Connected to VPS. Searching ALL backend-api logs for keyword: "573245640657" or "evolution" or "webhook"...');
  
  // Vamos a usar grep para filtrar todo el historial de docker logs
  // Redirigimos stderr a stdout porque docker logs escribe en stderr por defecto
  const cmd = 'docker logs backend-api 2>&1 | grep -i -E "573245640657|evolution|webhook|camila" | tail -n 150';

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
      console.log(`\n--- RESULTADOS DE BÚSQUEDA ---`);
      console.log(output || 'No se encontraron coincidencias en los logs.');
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
