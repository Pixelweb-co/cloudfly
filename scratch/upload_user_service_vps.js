const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const localFile = 'c:/apps/cloudfly/frontend_new/src/services/userService.ts';
const remoteFile = '/apps/cloudfly/frontend_new/src/services/userService.ts';

const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('Connected to VPS. Uploading userService.ts...');
  const fileContent = fs.readFileSync(localFile, 'utf8');
  const base64Content = Buffer.from(fileContent).toString('base64');
  const cmd = `echo "${base64Content}" | base64 -d > "${remoteFile}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log(`Upload finished with code ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
