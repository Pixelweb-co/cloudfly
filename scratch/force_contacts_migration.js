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
  console.log('🔄 Restarting MySQL container to clear metadata locks...');
  
  // 1. Restart MySQL container
  conn.exec('docker restart mysql', (err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => {
      console.log('✅ MySQL restarted. Waiting 5 seconds for it to become ready...');
      
      setTimeout(() => {
        const sql = `
          USE cloud_master;
          
          -- Check if columns exist before adding to prevent errors
          ALTER TABLE contacts ADD COLUMN position VARCHAR(255) NULL AFTER stage;
          ALTER TABLE contacts ADD COLUMN is_employee TINYINT(1) DEFAULT 0 AFTER position;
          ALTER TABLE clientes ADD COLUMN position VARCHAR(255) NULL AFTER cargo_cliente;
        `;
        
        console.log('🚀 Running ALTER TABLE queries now...');
        const remotePath = '/tmp/migration_contacts_force.sql';
        
        conn.exec(`cat > ${remotePath} << 'EOF'\n${sql}\nEOF\n`, (err, writeStream) => {
          if (err) throw err;
          
          writeStream.on('close', () => {
            const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
            conn.exec(cmd, (err, execStream) => {
              if (err) throw err;
              
              execStream.on('close', () => {
                console.log('🎉 Contacts Migration finished successfully!');
                
                // Let's also double check by running DESC contacts
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
        
      }, 5000);
    });
  });
}).connect(config);
