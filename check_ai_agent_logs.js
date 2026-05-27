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
  console.log('✅ Connected to VPS. Fetching ai_agent logs...');
  
  const cmd = 'docker logs --tail 1000 ai_agent';

  conn.exec(cmd, (err, stream) => { 
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    const logFile = 'c:/apps/cloudfly/vps_ai_agent_logs.txt';
    const writeStream = fs.createWriteStream(logFile);
    stream.on('close', (code, signal) => {
      writeStream.end();
      console.log(`✅ Logs successfully written to ${logFile}`);
      conn.end();
    }).on('data', (data) => {
      writeStream.write(data);
    }).stderr.on('data', (data) => {
      writeStream.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
