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

-- 1. TRIGGER: INSERT (Automatic Creation)
DROP TRIGGER IF EXISTS tr_create_contact_on_user_insert;
DELIMITER //
CREATE TRIGGER tr_create_contact_on_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE v_contact_id BIGINT;
    IF NEW.contact_id IS NULL THEN
        INSERT INTO contacts (uuid, name, email, tenant_id, company_id, is_active, created_at, type, stage)
        VALUES (UUID(), CONCAT(NEW.nombres, ' ', NEW.apellidos), NEW.email, NEW.customer_id, NEW.company_id, 1, NOW(), 'CUSTOMER', 'NEW');
        SET NEW.contact_id = LAST_INSERT_ID();
    END IF;
END //
DELIMITER ;

-- 2. TRIGGER: UPDATE (Automatic Sync)
DROP TRIGGER IF EXISTS tr_update_contact_on_user_update;
DELIMITER //
CREATE TRIGGER tr_update_contact_on_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Si el usuario tiene un contacto asociado, actualizamos sus datos básicos
    IF NEW.contact_id IS NOT NULL THEN
        UPDATE contacts 
        SET name = CONCAT(NEW.nombres, ' ', NEW.apellidos),
            email = NEW.email,
            updated_at = NOW()
        WHERE id = NEW.contact_id;
    END IF;
END //
DELIMITER ;

-- 3. TRIGGER: DELETE (Automatic Cleanup)
DROP TRIGGER IF EXISTS tr_delete_contact_on_user_delete;
DELIMITER //
CREATE TRIGGER tr_delete_contact_on_user_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    -- Si el usuario tenía un contacto asociado, lo eliminamos
    IF OLD.contact_id IS NOT NULL THEN
        DELETE FROM contacts WHERE id = OLD.contact_id;
    END IF;
END //
DELIMITER ;
  `;

  const remotePath = '/tmp/full_triggers_migration.sql';
  conn.exec(`cat > ${remotePath} << 'EOF'\n${sqlContent}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('✅ Full Triggers (Insert, Update, Delete) created successfully');
          conn.end();
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    }).on('data', d => console.log(d.toString()));
  });
}).connect(config);
