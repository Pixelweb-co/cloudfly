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
  console.log('✅ Connected to VPS via SSH key. Transferring updated docker-compose-full-vps.yml and recreating marketing-agent...\n');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }

    const localPath = 'c:\\apps\\cloudfly\\docker-compose-full-vps.yml';
    const remotePath = '/apps/cloudfly/docker-compose-full-vps.yml';

    sftp.fastPut(localPath, remotePath, {}, (uploadErr) => {
      if (uploadErr) {
        console.error('❌ SFTP Upload Error:', uploadErr);
        conn.end();
        return;
      }
      console.log('✅ Successfully uploaded updated docker-compose-full-vps.yml to VPS.');

      // Recreate marketing-agent to load the new environment variable
      const cmd = `
        echo "--- [Recreating marketing-agent container...] ---"
        docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d --force-recreate marketing-agent
        
        echo ""
        echo "--- [Verifying Environment Variables of marketing-agent] ---"
        docker inspect marketing-agent | grep -i "LEAD_GENERATOR_URL"
      `;

      conn.exec(cmd, (execErr, stream) => {
        if (execErr) {
          console.error(execErr);
          conn.end();
          return;
        }
        stream.on('close', () => {
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
