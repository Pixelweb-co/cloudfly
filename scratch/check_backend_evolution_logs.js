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
  console.log('✅ Connected to VPS. Fetching backend-api logs related to evolution/contacts...');
  
  // Vamos a buscar en las últimas 4000 líneas del log de backend-api
  // Queremos buscar de forma insensible a mayúsculas/minúsculas términos como "evolution", "webhook", "contact", "573245640657", "camila"
  const cmd = 'docker logs --tail 4000 backend-api';

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    
    let logData = '';
    stream.on('data', (data) => {
      logData += data.toString();
    });
    
    stream.stderr.on('data', (data) => {
      logData += data.toString();
    });

    stream.on('close', (code, signal) => {
      console.log(`\n--- FILTRANDO LOGS DE BACKEND ---`);
      
      const lines = logData.split('\n');
      console.log(`Total de líneas obtenidas: ${lines.length}`);
      
      const keywords = ['evolution', 'webhook', 'contact', 'camila', '573245640657', 'spa'];
      
      // Encontrar las líneas coincidentes y mostrar un poco de contexto
      const matchedLines = [];
      lines.forEach((line, idx) => {
        const lowerLine = line.toLowerCase();
        const matches = keywords.some(k => lowerLine.includes(k));
        if (matches) {
          matchedLines.push({ idx, line });
        }
      });
      
      console.log(`Líneas coincidentes encontradas: ${matchedLines.length}\n`);
      
      // Imprimir las líneas coincidentes con un rango de contexto (ej. 2 líneas antes y 5 líneas después)
      const printedIndices = new Set();
      matchedLines.forEach(({ idx }) => {
        const start = Math.max(0, idx - 2);
        const end = Math.min(lines.length - 1, idx + 6);
        
        let headerPrinted = false;
        for (let i = start; i <= end; i++) {
          if (!printedIndices.has(i)) {
            if (!headerPrinted) {
              console.log(`\n--- Contexto alrededor de la línea ${i} ---`);
              headerPrinted = true;
            }
            console.log(`[L${i}] ${lines[i]}`);
            printedIndices.add(i);
          }
        }
      });
      
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
