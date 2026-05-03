const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const jarPath = 'backend_new/target/backend-new-0.0.1-SNAPSHOT.jar';
const remotePath = '/apps/cloudfly/backend-new.jar';

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localJar = path.join('c:/apps/cloudfly', jarPath);
    console.log(`Uploading ${localJar} to ${remotePath}...`);
    sftp.fastPut(localJar, remotePath, (err) => {
      if (err) {
        console.error('Error uploading JAR:', err);
      } else {
        console.log('JAR uploaded successfully.');
        console.log('Restarting backend-api container...');
        conn.exec('docker compose -f /apps/cloudfly/docker-compose-full-vps.yml restart backend-api', (err, stream) => {
          if (err) throw err;
          stream.on('close', (code, signal) => {
            console.log(`Container restart finished with code ${code}`);
            conn.end();
          }).on('data', (data) => {
            process.stdout.write(data);
          }).stderr.on('data', (data) => {
            process.stderr.write(data);
          });
        });
      }
    });
  });
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 30000
});
