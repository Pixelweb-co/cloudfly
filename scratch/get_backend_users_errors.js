const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

// We want to fetch the last 1000 lines of logs containing "users" or "userController" or "Error" or "Exception"
const cmd = 'docker logs --tail 10000 backend-api';

console.log('🚀 Checking users-related errors in backend-api logs on VPS...');

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    let logData = '';
    stream.on('close', (code) => {
      conn.end();
      const lines = logData.split('\n');
      
      console.log(`Total lines fetched: ${lines.length}`);
      
      const filteredLines = [];
      lines.forEach((line, idx) => {
        if (line.includes('/users') || line.toLowerCase().includes('usercontroller') || line.toLowerCase().includes('nullpointer') || line.toLowerCase().includes('exception') || line.toLowerCase().includes('error') || line.toLowerCase().includes('500')) {
          filteredLines.push({ idx, line });
        }
      });

      console.log(`Found ${filteredLines.length} matching lines.`);
      
      // Print the last 40 matching lines with some context if possible
      const lastMatches = filteredLines.slice(-40);
      lastMatches.forEach(match => {
        console.log(`--- [Line ${match.idx}] ---`);
        // print surrounding lines
        const start = Math.max(0, match.idx - 2);
        const end = Math.min(lines.length - 1, match.idx + 3);
        for (let i = start; i <= end; i++) {
          console.log(`${i === match.idx ? '👉' : '  '} ${lines[i]}`);
        }
      });
    }).on('data', (data) => {
      logData += data;
    }).stderr.on('data', (data) => {
      logData += data;
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
