const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected to VPS. Starting SFTP upload of schemas...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // 1. Upload original backup
    sftp.fastPut('c:/apps/cloudfly/db/cloud_master_inicial_final_mayo_2026.sql', '/tmp/cloud_master_inicial_final_mayo_2026.sql', (err1) => {
      if (err1) throw err1;
      console.log('🚀 Original backup SQL uploaded to VPS.');
      
      // 2. Upload new features schema
      sftp.fastPut('c:/apps/cloudfly/add_new_features_tables.sql', '/tmp/add_new_features_tables.sql', (err2) => {
        if (err2) throw err2;
        console.log('🚀 New features SQL schema uploaded to VPS.');
        
        // 3. Execute original backup to restore all tables, data, and DIAN columns
        console.log('🔄 Executing original backup to restore all tables, data, and DIAN/channels columns...');
        const cmdRestore = 'bash -c "docker exec -i mysql mysql -u root -pwidowmaker cloud_master < /tmp/cloud_master_inicial_final_mayo_2026.sql"';
        
        conn.exec(cmdRestore, (err3, stream3) => {
          if (err3) throw err3;
          stream3.stderr.on('data', d => process.stderr.write(d));
          stream3.on('close', (code3) => {
            console.log(`✅ Original backup restored with code: ${code3}`);
            
            // 4. Execute new features schema (workflows, tags, notifications)
            console.log('🔄 Executing new features schema to add workflows, tags, and notifications...');
            const cmdAddFeatures = 'bash -c "docker exec -i mysql mysql -u root -pwidowmaker cloud_master < /tmp/add_new_features_tables.sql"';
            
            conn.exec(cmdAddFeatures, (err4, stream4) => {
              if (err4) throw err4;
              stream4.stderr.on('data', d => process.stderr.write(d));
              stream4.on('close', (code4) => {
                console.log(`✅ New features schema applied with code: ${code4}`);
                
                // 5. Generate unified, complete database dump
                console.log('🔄 Dumping fully unified complete database...');
                const cmdDump = 'docker exec mysql mysqldump -u root -pwidowmaker cloud_master > /tmp/cloud_master_clean_install.sql';
                
                conn.exec(cmdDump, (err5, stream5) => {
                  if (err5) throw err5;
                  stream5.stderr.on('data', d => process.stderr.write(d));
                  stream5.on('close', (code5) => {
                    console.log(`✅ Unified dump created with code: ${code5}. Downloading clean backup via SFTP...`);
                    
                    // 6. Download the clean backup file
                    sftp.fastGet('/tmp/cloud_master_clean_install.sql', 'c:/apps/cloudfly/db/cloud_master_clean_install.sql', (err6) => {
                      if (err6) throw err6;
                      console.log('🎉 Consolidated, complete backup successfully downloaded to c:/apps/cloudfly/db/cloud_master_clean_install.sql!');
                      
                      // 7. Cleanup temp files on VPS host
                      conn.exec('rm -f /tmp/cloud_master_inicial_final_mayo_2026.sql /tmp/add_new_features_tables.sql /tmp/cloud_master_clean_install.sql', () => {
                        conn.end();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly')
});
