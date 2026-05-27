const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS via SSH key. Transferring prospector and worker files and rebuilding marketing-agent...\n');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }

    const localWorker = 'c:\\apps\\cloudfly\\marketing_agent\\autonomous_worker.py';
    const remoteWorker = '/apps/cloudfly/marketing_agent/autonomous_worker.py';
    const localProspector = 'c:\\apps\\cloudfly\\marketing_agent\\services\\prospector_service.py';
    const remoteProspector = '/apps/cloudfly/marketing_agent/services/prospector_service.py';

    sftp.fastPut(localWorker, remoteWorker, {}, (err1) => {
      if (err1) {
        console.error('❌ Worker Upload Error:', err1);
        conn.end();
        return;
      }
      console.log('✅ Successfully uploaded autonomous_worker.py.');

      sftp.fastPut(localProspector, remoteProspector, {}, (err2) => {
        if (err2) {
          console.error('❌ Prospector Upload Error:', err2);
          conn.end();
          return;
        }
        console.log('✅ Successfully uploaded prospector_service.py.');

        // Rebuild and recreate marketing-agent
        const cmd = `
          echo "--- [Rebuilding & Recreating marketing-agent container...] ---"
          docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d --build --force-recreate marketing-agent
        `;

        conn.exec(cmd, (execErr, stream) => {
          if (execErr) {
            console.error(execErr);
            conn.end();
            return;
          }
          stream.on('close', () => {
            console.log('\n🏁 Deployment and rebuild completed.');
            conn.end();
          }).on('data', (data) => {
            process.stdout.write(data);
          }).stderr.on('data', (data) => {
            process.stderr.write(data);
          });
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
