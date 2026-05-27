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
  console.log('✅ Connected to VPS. Executing SQL update via stdin...');
  
  const cmd = `docker exec -i mysql mysql -u root -pwidowmaker`;

  const stream = conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log('✅ Stream closed with code ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    // Enviar las consultas SQL a través del stream
    stream.write("USE cloud_master;\n");
    stream.write("UPDATE orders SET company_id = 1 WHERE tenant_id = 1 AND company_id IS NULL;\n");
    stream.write("SELECT ROW_COUNT() as 'Updated Orders';\n");
    stream.write("UPDATE invoices SET company_id = 1 WHERE tenant_id = 1 AND company_id IS NULL;\n");
    stream.write("SELECT ROW_COUNT() as 'Updated Invoices';\n");
    stream.end();
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
