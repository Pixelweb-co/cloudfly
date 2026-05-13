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
  const sqlContent = `
USE cloud_master;
ALTER TABLE token_usage_log ADD COLUMN IF NOT EXISTS label VARCHAR(100) AFTER conversation_id;
ALTER TABLE token_usage_log MODIFY COLUMN contact_id BIGINT NULL;
-- Handle rename manually if needed
IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'token_usage_log' AND COLUMN_NAME = 'cost_usd') THEN
    ALTER TABLE token_usage_log CHANGE COLUMN estimated_cost_usd cost_usd DECIMAL(12, 6);
END IF;
  `;
  // Simplify SQL for better compatibility
  const simpleSql = `
USE cloud_master;
ALTER TABLE token_usage_log ADD COLUMN label VARCHAR(100) AFTER conversation_id;
ALTER TABLE token_usage_log MODIFY COLUMN contact_id BIGINT NULL;
ALTER TABLE token_usage_log CHANGE COLUMN estimated_cost_usd cost_usd DECIMAL(12, 6);
  `;

  const remotePath = '/tmp/fix_token_table.sql';
  conn.exec(`cat > ${remotePath} << 'EOF'\n${simpleSql}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('✅ Token table fixed');
          conn.end();
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    }).on('data', d => console.log(d.toString()));
  });
}).connect(config);
