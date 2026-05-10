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

-- Add column if not exists
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'contact_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN contact_id BIGINT'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP PROCEDURE IF EXISTS sp_create_user_with_contact;

DELIMITER //
CREATE PROCEDURE sp_create_user_with_contact(
    IN p_nombres VARCHAR(255),
    IN p_apellidos VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_tenant_id BIGINT,
    IN p_company_id BIGINT
)
BEGIN
    DECLARE v_contact_id BIGINT;
    DECLARE v_uuid VARCHAR(255);
    
    SET v_uuid = UUID();
    
    -- 1. Crear el contacto
    INSERT INTO contacts (uuid, name, email, tenant_id, company_id, is_active, created_at, type, stage)
    VALUES (v_uuid, CONCAT(p_nombres, ' ', p_apellidos), p_email, p_tenant_id, p_company_id, 1, NOW(), 'CUSTOMER', 'NEW');
    
    SET v_contact_id = LAST_INSERT_ID();
    
    -- 2. Crear el usuario asociado al contacto
    INSERT INTO users (nombres, apellidos, username, password, email, customer_id, company_id, contact_id, is_enabled, account_no_expired, account_no_locked, credential_no_expired)
    VALUES (p_nombres, p_apellidos, p_username, p_password, p_email, p_tenant_id, p_company_id, v_contact_id, 0, 1, 1, 1);
    
    SELECT v_contact_id as contact_id, LAST_INSERT_ID() as user_id;
END //
DELIMITER ;
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
