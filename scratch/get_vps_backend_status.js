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
  
  // Commands:
  // 1. Docker ps for backend-api (both running and stopped)
  // 2. Last 100 lines of docker logs for backend-api
  // 3. MySQL databases list
  const cmd = `
    echo "=== DOCKER CONTAINER STATUS FOR backend-api ==="
    docker ps -a --filter name=backend-api --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.State}}"
    
    echo ""
    echo "=== MYSQL DATABASES ==="
    docker exec mysql mysql -uroot -pwidowmaker -e "SHOW DATABASES;" 2>&1 || echo "Could not query MySQL"
    
    echo ""
    echo "=== BACKEND-API RECENT LOGS ==="
    docker logs --tail 100 backend-api 2>&1 || echo "Could not read logs for backend-api"
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
