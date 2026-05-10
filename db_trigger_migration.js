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

-- Eliminar trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS tr_create_contact_on_user_insert;

DELIMITER //

CREATE TRIGGER tr_create_contact_on_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE v_contact_id BIGINT;
    DECLARE v_uuid VARCHAR(255);
    
    -- Solo crear contacto si no viene uno ya asignado
    IF NEW.contact_id IS NULL THEN
        SET v_uuid = UUID();
        
        -- 1. Insertar el contacto automáticamente
        -- Nota: Usamos nombres y apellidos del nuevo usuario
        INSERT INTO contacts (
            uuid, 
            name, 
            email, 
            tenant_id, 
            company_id, 
            is_active, 
            created_at, 
            type, 
            stage
        )
        VALUES (
            v_uuid, 
            CONCAT(NEW.nombres, ' ', NEW.apellidos), 
            NEW.email, 
            NEW.customer_id, 
            NEW.company_id, 
            1, 
            NOW(), 
            'CUSTOMER', 
            'NEW'
        );
        
        -- 2. Obtener el ID generado y asignarlo al campo contact_id del nuevo usuario
        SET v_contact_id = LAST_INSERT_ID();
        SET NEW.contact_id = v_contact_id;
    END IF;
END //

DELIMITER ;
  `;

  const remotePath = '/tmp/trigger_migration.sql';
  conn.exec(`cat > ${remotePath} << 'EOF'\n${sqlContent}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker < ${remotePath}`;
      conn.exec(cmd, (err, execStream) => {
        if (err) throw err;
        execStream.on('close', () => {
          console.log('✅ Trigger created successfully - Automatic contact creation enabled');
          conn.end();
        }).on('data', d => console.log('OUT: ' + d)).stderr.on('data', e => console.error('ERR: ' + e));
      });
    }).on('data', d => console.log(d.toString()));
  });
}).connect(config);
