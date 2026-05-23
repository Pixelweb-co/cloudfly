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

conn.on('ready', () => {
  console.log('✅ Connected to VPS.');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('❌ SFTP error:', err);
      conn.end();
      return;
    }
    
    console.log('🚀 Uploading SQL files to VPS...');
    sftp.fastPut('c:/apps/cloudfly/db/cloud_master_inicial_final_mayo_2026.sql', '/tmp/cloud_master_inicial_final_mayo_2026.sql', (err1) => {
      if (err1) {
        console.error('❌ Failed to upload original backup:', err1);
        conn.end();
        return;
      }
      console.log('📄 Original backup uploaded successfully.');
      
      sftp.fastPut('c:/apps/cloudfly/add_new_features_tables.sql', '/tmp/add_new_features_tables.sql', (err2) => {
        if (err2) {
          console.error('❌ Failed to upload features SQL:', err2);
          conn.end();
          return;
        }
        console.log('📄 Features SQL uploaded successfully.');
        
        // Run commands
        const cmd = `
          set -e
          echo "🛑 Stopping backend-api..."
          docker stop backend-api || true
          
          echo "🗄️ Creating cloud_master database if not exists..."
          docker exec mysql mysql -uroot -pwidowmaker -e "CREATE DATABASE IF NOT EXISTS cloud_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
          
          echo "📂 Copying files to mysql container..."
          docker cp /tmp/cloud_master_inicial_final_mayo_2026.sql mysql:/tmp/
          docker cp /tmp/add_new_features_tables.sql mysql:/tmp/
          
          echo "🔄 Restoring original backup (this may take a minute)..."
          docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "source /tmp/cloud_master_inicial_final_mayo_2026.sql"
          
          echo "🔄 Applying new features tables and patches..."
          docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "source /tmp/add_new_features_tables.sql"
          
          echo "🔒 Resetting manager password to 'Password123!'..."
          docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "UPDATE users SET password = '\\$2a\\$10\\$wttLfqsPnsvW0uF.GAODUuguENHoQX3RiPbqkNR7aWXYLAiHp9LEi' WHERE username = 'manager';" || echo "Warning: Could not update manager password"
          
          echo "🧹 Cleaning up tmp files..."
          docker exec mysql rm -f /tmp/cloud_master_inicial_final_mayo_2026.sql /tmp/add_new_features_tables.sql
          rm -f /tmp/cloud_master_inicial_final_mayo_2026.sql /tmp/add_new_features_tables.sql
          
          echo "🚀 Starting backend-api..."
          docker start backend-api
          
          echo "⏳ Waiting 10 seconds for backend to start up..."
          sleep 10
          
          echo "=== CONTAINER STATUS ==="
          docker ps --filter name=backend-api
          
          echo "=== LOGS (last 50 lines) ==="
          docker logs --tail 50 backend-api
        `;
        
        console.log('🔄 Executing restore sequence on VPS...');
        conn.exec(cmd, (errExec, stream) => {
          if (errExec) {
            console.error('❌ Execution error:', errExec);
            conn.end();
            return;
          }
          
          stream.on('close', (code) => {
            console.log(`\n✅ Sequence completed with code: ${code}`);
            conn.end();
          }).on('data', (data) => {
            process.stdout.write(data.toString());
          }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
          });
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
