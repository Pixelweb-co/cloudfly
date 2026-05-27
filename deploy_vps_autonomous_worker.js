const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS via SSH key. Deploying updated autonomous_worker.py and rebuilding marketing-agent...\n');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }

    const localPath = 'c:\\apps\\cloudfly\\marketing_agent\\autonomous_worker.py';
    const remotePath = '/apps/cloudfly/marketing_agent/autonomous_worker.py';

    sftp.fastPut(localPath, remotePath, {}, (uploadErr) => {
      if (uploadErr) {
        console.error('❌ SFTP Upload Error:', uploadErr);
        conn.end();
        return;
      }
      console.log('✅ Successfully uploaded updated autonomous_worker.py to VPS.');

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
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
