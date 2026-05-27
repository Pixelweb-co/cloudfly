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
  console.log('✅ Connected to VPS via SSH key. Transferring lead-generator repository file and rebuilding lead-generator...\n');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }

    const localRepo = 'c:\\apps\\cloudfly\\lead-generator\\app\\infrastructure\\repositories\\apify_repository.py';
    const remoteRepo = '/apps/cloudfly/lead-generator/app/infrastructure/repositories/apify_repository.py';

    sftp.fastPut(localRepo, remoteRepo, {}, (err1) => {
      if (err1) {
        console.error('❌ Repository Upload Error:', err1);
        conn.end();
        return;
      }
      console.log('✅ Successfully uploaded apify_repository.py.');

      // Rebuild and recreate lead-generator
      const cmd = `
        echo "--- [Rebuilding & Recreating lead-generator container...] ---"
        docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d --build --force-recreate lead-generator
      `;

      conn.exec(cmd, (execErr, stream) => {
        if (execErr) {
          console.error(execErr);
          conn.end();
          return;
        }
        stream.on('close', () => {
          console.log('\n🏁 Lead Generator Deployment and rebuild completed.');
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
