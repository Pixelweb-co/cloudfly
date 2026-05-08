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

console.log('🚀 [DEPLOY] Starting Frontend Deployment to dashboard.cloudfly.com.co...');

conn.on('ready', () => {
  console.log('✅ SSH Client Ready');
  
  const commands = [
    'cd /apps/cloudfly',
    'git pull origin main',
    'docker compose -f docker-compose-full-vps.yml up -d --build frontend-react',
    'docker ps | grep frontend-react'
  ];

  const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
      console.log(`\n🏃 Running: ${cmd}`);
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream.on('close', (code, signal) => {
          resolve({ cmd, code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data;
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          stderr += data;
          process.stderr.write(data);
        });
      });
    });
  };

  (async () => {
    try {
      for (const cmd of commands) {
        const res = await runCommand(cmd);
        if (res.code !== 0) {
           console.error(`\n❌ Command failed with code ${res.code}`);
           if (cmd.includes('docker compose')) break; // Stop if critical command fails
        }
      }
      console.log('\n✨ [DEPLOY] Frontend deployment finished successfully!');
    } catch (err) {
      console.error('\n💥 [DEPLOY] Fatal error:', err);
    } finally {
      conn.end();
    }
  })();
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
