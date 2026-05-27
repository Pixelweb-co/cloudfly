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
  const sql = "ALTER TABLE contacts ADD COLUMN position VARCHAR(255) NULL AFTER stage; ALTER TABLE contacts ADD COLUMN is_employee TINYINT(1) DEFAULT 0 AFTER position; ALTER TABLE clientes ADD COLUMN position VARCHAR(255) NULL AFTER cargo_cliente;";
  
  console.log('🚀 Executing SQL ALTER queries via mysql -e...');
  const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "${sql}"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ Query finished execution.');
      
      // Let\'s run DESC contacts to see if columns are there!
      const descCmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "DESC contacts;"`;
      conn.exec(descCmd, (err, descStream) => {
        if (err) throw err;
        descStream.on('close', () => {
          conn.end();
        }).on('data', (d) => {
          process.stdout.write(d.toString());
        });
      });
    }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
  });
}).connect(config);
