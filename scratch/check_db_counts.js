const { Client } = require('ssh2');
const fs = require('fs');

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
  
  const cmd = `
    docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "
      SELECT 'users' as tbl, COUNT(*) as cnt FROM users
      UNION ALL
      SELECT 'clientes' as tbl, COUNT(*) as cnt FROM clientes
      UNION ALL
      SELECT 'companies' as tbl, COUNT(*) as cnt FROM companies
      UNION ALL
      SELECT 'contacts' as tbl, COUNT(*) as cnt FROM contacts
      UNION ALL
      SELECT 'pipelines' as tbl, COUNT(*) as cnt FROM pipelines;
    "
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
