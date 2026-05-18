const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  console.log('🚀 SSH Client Connected. Reading migration file...');
  const sqlFile = fs.readFileSync('db/migration_billing_v11.sql', 'utf8');
  
  console.log('📡 Executing migration on remote MySQL container...');
  
  const remoteCmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master`;
  
  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`✅ SQL migration finished with code ${code}`);
      conn.end();
    }).on('data', (d) => {
      process.stdout.write(d.toString());
    }).stderr.on('data', (e) => {
      process.stderr.write(e.toString());
    });
    
    stream.write(sqlFile);
    stream.end();
  });
}).connect(config);
