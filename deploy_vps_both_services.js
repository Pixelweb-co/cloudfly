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
  console.log('✅ Connected to VPS. Uploading fixed files and rebuilding both services...\n');

  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }

    const files = [
      {
        local: 'c:\\apps\\cloudfly\\lead-generator\\app\\infrastructure\\repositories\\apify_repository.py',
        remote: '/apps/cloudfly/lead-generator/app/infrastructure/repositories/apify_repository.py',
        label: 'apify_repository.py'
      },
      {
        local: 'c:\\apps\\cloudfly\\marketing_agent\\autonomous_worker.py',
        remote: '/apps/cloudfly/marketing_agent/autonomous_worker.py',
        label: 'autonomous_worker.py'
      },
      {
        local: 'c:\\apps\\cloudfly\\marketing_agent\\services\\prospector_service.py',
        remote: '/apps/cloudfly/marketing_agent/services/prospector_service.py',
        label: 'prospector_service.py'
      }
    ];

    let idx = 0;

    function uploadNext() {
      if (idx >= files.length) {
        // All uploaded - rebuild both containers
        const cmd = `
          echo "--- [Rebuilding lead-generator...] ---"
          docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d --build --force-recreate lead-generator
          echo "--- [Rebuilding marketing-agent...] ---"
          docker compose -f /apps/cloudfly/docker-compose-full-vps.yml up -d --build --force-recreate marketing-agent
          echo ""
          echo "✅ Both services rebuilt and started."
        `;

        conn.exec(cmd, (execErr, stream) => {
          if (execErr) { console.error(execErr); conn.end(); return; }
          stream.on('close', () => {
            console.log('\n🏁 Deployment completed.');
            conn.end();
          }).on('data', (data) => {
            process.stdout.write(data);
          }).stderr.on('data', (data) => {
            process.stderr.write(data);
          });
        });
        return;
      }

      const file = files[idx++];
      sftp.fastPut(file.local, file.remote, {}, (err) => {
        if (err) {
          console.error(`❌ Upload Error for ${file.label}:`, err);
          conn.end();
          return;
        }
        console.log(`✅ Uploaded ${file.label}`);
        uploadNext();
      });
    }

    uploadNext();
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
