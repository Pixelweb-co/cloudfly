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

CREATE TABLE IF NOT EXISTS availability_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    user_id BIGINT,
    name VARCHAR(255),
    weekly_schedule JSON,
    duration_default INT DEFAULT 30,
    buffer_before INT DEFAULT 0,
    buffer_after INT DEFAULT 0,
    min_anticipation INT DEFAULT 24,
    max_future_range INT DEFAULT 30,
    daily_limit INT,
    allow_weekends BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_tenant_company (tenant_id, company_id)
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    user_id BIGINT,
    template_id BIGINT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    appointment_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slot_tenant_company_time (tenant_id, company_id, start_time),
    FOREIGN KEY (template_id) REFERENCES availability_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    user_id BIGINT,
    contact_id BIGINT,
    slot_id BIGINT,
    title VARCHAR(255),
    description TEXT,
    observations TEXT,
    appointment_type VARCHAR(50),
    channel VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_appointment_tenant_company (tenant_id, company_id),
    FOREIGN KEY (slot_id) REFERENCES availability_slots(id) ON DELETE SET NULL
);
  `;

  const remotePath = '/tmp/migration.sql';
  conn.exec(`cat > ${remotePath} << 'EOF'\n${sqlContent}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('✅ Final Migration finished');
          conn.end();
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    }).on('data', d => console.log(d.toString()));
  });
}).connect(config);
