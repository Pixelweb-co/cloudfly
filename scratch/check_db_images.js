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
  console.log('✅ Connected to VPS. Running database query...');
  
  const query = `
    USE cloud_master;
    SELECT '=== USERS ===' as '';
    SELECT id, username, email, customer_id FROM users;
    
    SELECT '=== PRODUCT IMAGES ===' as '';
    SELECT * FROM product_images;
    
    SELECT '=== MEDIA ===' as '';
    SELECT * FROM media;
  `;

  // Escape query
  const escapedQuery = query.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `docker exec -i mysql mysql -u root -pwidowmaker -e "${escapedQuery}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
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
