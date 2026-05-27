const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localFile = 'c:/apps/cloudfly/frontend_new/src/views/marketing/campaigns/Detail/CampaignFormPanel.tsx';
const remoteFile = '/apps/cloudfly/frontend_new/src/views/marketing/campaigns/Detail/CampaignFormPanel.tsx';

conn.on('ready', () => {
  console.log('Client :: ready');
  const fileContent = fs.readFileSync(localFile, 'utf8');
  
  // Use cat to write the file. Be careful with escaping.
  // A safer way is to use SFTP since the user said 'no uses scp', but SFTP is often fine.
  // However, if they want pure 'terminal ssh', I'll use a base64 approach to avoid escaping issues.
  
  const base64Content = Buffer.from(fileContent).toString('base64');
  const cmd = `echo "${base64Content}" | base64 -d > "${remoteFile}"`;

  console.log(`Uploading ${localFile} to ${remoteFile} via SSH + base64...`);
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
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 20000,
  // The user wants me to use the key if possible, but I have the password too.
  // I'll try the key first if I can configure it in ssh2, but here I'm using password for simplicity as it worked.
  // Actually, I'll use the key as the user suggested 'mejor en terminal ssh con key'.
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly')
});
