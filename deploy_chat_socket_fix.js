const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

console.log('🚀 [DEPLOY] Connecting to VPS (109.205.182.94)...');

conn.on('ready', () => {
  console.log('✅ SSH Client Ready');

  // Step 1: Copy the changed file via SCP
  const localFile = path.resolve(__dirname, 'chat-socket-service/src/services/chatService.js');
  const remoteFile = '/apps/cloudfly/chat-socket-service/src/services/chatService.js';

  console.log(`\n📄 Copying ${localFile} -> ${remoteFile}`);
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut(localFile, remoteFile, (err) => {
      sftp.end();
      if (err) throw err;
      console.log('✅ File copied successfully');

      // Step 2: Rebuild and restart chat-socket-service
      const cmd = 'cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d --build chat-socket-service';
      console.log(`\n🏃 Running: ${cmd}`);
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          if (code === 0) {
            console.log('\n✅ [DEPLOY] chat-socket-service rebuilt and restarted!');
            // Step 3: Show recent logs
            const logsCmd = 'docker logs --tail 30 chat_socket';
            console.log(`\n📋 Recent logs:\n`);
            conn.exec(logsCmd, (err2, stream2) => {
              if (err2) throw err2;
              stream2.on('close', () => conn.end());
              stream2.on('data', (d) => process.stdout.write(d));
              stream2.stderr.on('data', (d) => process.stderr.write(d));
            });
          } else {
            console.error(`\n❌ Deploy failed with code ${code}`);
            conn.end();
          }
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
}).connect(config);
