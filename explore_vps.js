const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'cloudfly.com.co',
  port: 10622,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  conn.exec('pwd; ls -F /; find /home -name cloudfly -type d -maxdepth 2 2>/dev/null; which docker', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
