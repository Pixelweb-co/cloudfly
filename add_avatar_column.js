const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS via SSH key. Running DDL to add avatar_id column...\n');
  
  const query = `
    USE cloud_master;
    
    -- Check if avatar_id already exists before adding it
    SELECT count(*) INTO @col_exists 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'cloud_master' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'avatar_id';
      
    SET @ddl = IF(@col_exists = 0, 
      'ALTER TABLE users ADD COLUMN avatar_id BIGINT NULL', 
      'SELECT "Column avatar_id already exists" AS message');
      
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    DESCRIBE users;
  `;

  const escapedQuery = query.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `docker exec -i mysql mysql -u root -pwidowmaker -e "${escapedQuery}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log('\n✅ DDL command completed.');
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
