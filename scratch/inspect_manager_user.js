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
  
  const cmd = `
    echo "=== USER DETAILS ==="
    docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "SELECT * FROM users WHERE username = 'manager'\\G"
    
    echo "=== ROLES ASSIGNED ==="
    docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "SELECT * FROM user_roles;"
    
    echo "=== CLIENTES (TENANTS) ==="
    docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "SELECT * FROM clientes;"
    
    echo "=== COMPANIES ==="
    docker exec mysql mysql -uroot -pwidowmaker cloud_master -e "SELECT * FROM companies;"
  `;
  
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
