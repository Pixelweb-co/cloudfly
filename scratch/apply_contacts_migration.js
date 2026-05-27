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
    
    -- Add position to contacts
    ALTER TABLE contacts ADD COLUMN position VARCHAR(255) NULL AFTER stage;
    
    -- Add is_employee to contacts
    ALTER TABLE contacts ADD COLUMN is_employee TINYINT(1) DEFAULT 0 AFTER position;
    
    -- Add position to clientes (just in case)
    ALTER TABLE clientes ADD COLUMN position VARCHAR(255) NULL AFTER cargo_cliente;
  `;
  
  const remotePath = '/tmp/migration_contacts.sql';
  conn.exec(`cat > ${remotePath} << 'EOF'\n${sql}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('✅ Contacts Migration finished successfully');
          conn.end();
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    }).on('data', d => console.log(d.toString()));
  });
}).connect(config);
