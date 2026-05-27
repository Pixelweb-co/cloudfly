const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('Connected to VPS. Running log search...');
  // We tail 30000 lines of backend-api logs
  conn.exec('docker logs --tail 30000 backend-api', (err, stream) => {
    if (err) throw err;
    let logData = '';
    stream.on('close', (code, signal) => {
      conn.end();
      const lines = logData.split('\n');
      console.log(`Total lines fetched: ${lines.length}`);
      
      const matches = [];
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        if (lower.includes('/users') || lower.includes('usercontroller') || lower.includes('userentity') || lower.includes('exception') || lower.includes('error')) {
          matches.push(idx);
        }
      });
      
      console.log(`Found ${matches.length} matching lines.`);
      
      const printedIndices = new Set();
      // Print the last 100 matching lines and their context
      matches.slice(-100).forEach(idx => {
        const start = Math.max(0, idx - 5);
        const end = Math.min(lines.length - 1, idx + 5);
        for (let i = start; i <= end; i++) {
          if (!printedIndices.has(i)) {
            console.log(`[LINE ${i}] ${lines[i]}`);
            printedIndices.add(i);
          }
        }
        console.log('---');
      });
    }).on('data', (data) => {
      logData += data;
    }).stderr.on('data', (data) => {
      logData += data;
    });
  });
}).connect(config);
