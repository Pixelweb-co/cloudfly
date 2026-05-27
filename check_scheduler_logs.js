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
  const cmd = `docker logs --since 6h scheduler-service`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    const logFile = 'c:/apps/cloudfly/vps_scheduler_logs.txt';
    const writeStream = fs.createWriteStream(logFile);
    stream.on('close', () => {
      writeStream.end();
      console.log(`✅ Logs successfully written to ${logFile}`);
      conn.end();
    }).on('data', (data) => {
      writeStream.write(data);
    }).stderr.on('data', (data) => {
      writeStream.write(data);
    });
  });
}).connect(config);
