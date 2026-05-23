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
  console.log('✅ Connected to VPS. Fetching chat_socket container logs...');
  
  // Vamos a buscar en las últimas 3000 líneas de logs de chat_socket
  const cmd = 'docker logs --tail 3000 chat_socket';

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

    stream.on('close', () => {
      console.log(`\n--- FILTRANDO LOGS DE CHAT SOCKET ---`);
      
      const lines = logData.split('\n');
      console.log(`Total de líneas de Chat Socket: ${lines.length}`);
      
      const keywords = ['573245640657', 'webhook', 'error', 'fail', 'cloudfly_t79_c80', 'camila', 'abort', 'skip'];
      
      const matchedLines = [];
      lines.forEach((line, idx) => {
        const lowerLine = line.toLowerCase();
        const matches = keywords.some(k => lowerLine.includes(k));
        if (matches) {
          matchedLines.push({ idx, line });
        }
      });
      
      console.log(`Líneas coincidentes encontradas: ${matchedLines.length}\n`);
      
      const printedIndices = new Set();
      matchedLines.forEach(({ idx }) => {
        const start = Math.max(0, idx - 4);
        const end = Math.min(lines.length - 1, idx + 10);
        
        let headerPrinted = false;
        for (let i = start; i <= end; i++) {
          if (!printedIndices.has(i)) {
            if (!headerPrinted) {
              console.log(`\n--- Contexto L${i} ---`);
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
