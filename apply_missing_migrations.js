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

-- V8: Idempotencia
ALTER TABLE orders ADD COLUMN external_reference VARCHAR(255) NULL;
ALTER TABLE orders ADD UNIQUE INDEX idx_order_ext_ref (external_reference);

ALTER TABLE quotes ADD COLUMN external_reference VARCHAR(255) NULL;
ALTER TABLE quotes ADD UNIQUE INDEX idx_quote_ext_ref (external_reference);

-- V9: Token Usage Log
CREATE TABLE IF NOT EXISTS token_usage_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    estimated_cost_usd DECIMAL(12, 6) DEFAULT 0.000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_tenant (tenant_id),
    INDEX idx_token_contact (contact_id),
    INDEX idx_token_created (created_at)
);
  `;

  const remotePath = '/tmp/migration_v8_v9.sql';
  conn.exec(`cat > ${remotePath} << 'EOF'\n${sqlContent}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('✅ Migration V8 & V9 finished successfully');
          conn.end();
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    }).on('data', d => console.log(d.toString()));
  });
}).connect(config);
