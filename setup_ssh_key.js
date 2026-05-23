const { Client } = require('ssh2');
const fs = require('fs');

const localPubKeyPath = 'C:/Users/Edwin/.ssh/id_rsa_cloudfly.pub';
if (!fs.existsSync(localPubKeyPath)) {
  console.error(`❌ Local public key not found at: ${localPubKeyPath}`);
  process.exit(1);
}

const pubKeyContent = fs.readFileSync(localPubKeyPath, 'utf8').trim();
console.log('🔑 Local public key loaded successfully.');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS via password authentication.');
  
  // Commands to ensure .ssh exists and append key safely
  const setupCmd = `
    mkdir -p /root/.ssh && \
    chmod 700 /root/.ssh && \
    touch /root/.ssh/authorized_keys && \
    chmod 600 /root/.ssh/authorized_keys && \
    grep -qF "${pubKeyContent}" /root/.ssh/authorized_keys || echo "${pubKeyContent}" >> /root/.ssh/authorized_keys && \
    echo "🔑 Public key successfully registered in authorized_keys!"
  `;

  conn.exec(setupCmd, (err, stream) => {
    if (err) {
      console.error('❌ Failed to execute key setup command:', err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      conn.end();
      if (code === 0) {
        console.log('\n🔄 Testing connection using the SSH key now...');
        testKeyAuth();
      } else {
        console.error(`❌ Setup command failed with code ${code}`);
      }
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

function testKeyAuth() {
  const keyConn = new Client();
  keyConn.on('ready', () => {
    console.log('🎉 SUCCESS! Authenticated flawlessly using the id_rsa_cloudfly private key without password!');
    keyConn.end();
  }).on('error', (err) => {
    console.error('❌ Key authentication test failed:', err.message);
  }).connect({
    host: 'api.cloudfly.com.co',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
    readyTimeout: 10000
  });
}
