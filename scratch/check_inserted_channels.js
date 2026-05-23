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
  
  const sql = "USE cloud_master; SELECT id, tenant_id, company_id, name, instance_name, platform, status FROM channels WHERE tenant_id IN (78, 79);";
  const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${sql}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
  });
}).connect(config);
