const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected to VPS. Starting SFTP upload of scripts and backup...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // 1. Upload unify_vps_db.sh
    sftp.fastPut('c:/apps/cloudfly/unify_vps_db.sh', '/tmp/unify_vps_db.sh', (err1) => {
      if (err1) throw err1;
      console.log('🚀 Unification bash script uploaded.');
      
      // 2. Upload add_new_features_tables.sql
      sftp.fastPut('c:/apps/cloudfly/add_new_features_tables.sql', '/tmp/add_new_features_tables.sql', (err2) => {
        if (err2) throw err2;
        console.log('🚀 Features SQL schema uploaded.');
        
        // 3. Upload cloud_master_inicial_final_mayo_2026.sql
        sftp.fastPut('c:/apps/cloudfly/db/cloud_master_inicial_final_mayo_2026.sql', '/tmp/cloud_master_inicial_final_mayo_2026.sql', (err3) => {
          if (err3) throw err3;
          console.log('🚀 Original backup SQL uploaded.');
          
          // 4. Make script executable and execute it!
          console.log('🔄 Executing bash script on VPS host...');
          const cmd = 'chmod +x /tmp/unify_vps_db.sh && /tmp/unify_vps_db.sh';
          
          conn.exec(cmd, (errExec, stream) => {
            if (errExec) throw errExec;
            
            stream.on('data', data => process.stdout.write(data.toString()));
            stream.stderr.on('data', data => process.stderr.write(data.toString()));
            
            stream.on('close', (code) => {
              console.log(`\n✅ Bash script execution complete with code: ${code}`);
              if (code !== 0) throw new Error("Database unification script failed on VPS");
              
              // 5. Download the clean backup file
              console.log('🔄 SFTP downloading the final consolidated backup...');
              sftp.fastGet('/tmp/cloud_master_clean_install.sql', 'c:/apps/cloudfly/db/cloud_master_clean_install.sql', (errGet) => {
                if (errGet) throw errGet;
                console.log('🎉 Clean consolidated backup successfully saved to c:/apps/cloudfly/db/cloud_master_clean_install.sql!');
                
                // 6. Cleanup temp files on VPS host
                conn.exec('rm -f /tmp/unify_vps_db.sh /tmp/add_new_features_tables.sql /tmp/cloud_master_inicial_final_mayo_2026.sql /tmp/cloud_master_clean_install.sql', () => {
                  conn.end();
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
