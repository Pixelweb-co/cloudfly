const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  const sql = `
    USE cloud_master;
    
    -- Alter table contacts to add assigned_user_ids column
    ALTER TABLE contacts ADD COLUMN assigned_user_ids TEXT NULL AFTER chatbot_enabled;
  `;
  
  console.log('🚀 Executing SQL migration directly...');
  const remotePath = '/tmp/migration_contacts_assigned_users.sql';
  
  conn.exec(`cat > ${remotePath} << 'EOF'\n${sql}\nEOF\n`, (err, writeStream) => {
    if (err) throw err;
    
    writeStream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        
        execStream.on('close', () => {
          console.log('🎉 SQL migration executed successfully!');
          
          // Verify final columns
          const descCmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "DESC contacts;"`;
          conn.exec(descCmd, (err, descStream) => {
            if (err) throw err;
            descStream.on('close', () => {
              conn.end();
            }).on('data', d => console.log('SCHEMA:\n' + d.toString()));
          });
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    });
  });
}).connect(config);
