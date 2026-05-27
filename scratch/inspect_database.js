const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ SSH Client Ready. Inspecting database...');
  
  const sql = "USE cloud_master; SELECT 'channels' AS tbl, id, tenant_id, company_id, instance_name, platform, status FROM channels; SELECT 'channel_configs' AS tbl, id, tenant_id, company_id, instance_name, channel_type, is_active FROM channel_configs;";
  const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${sql}"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
