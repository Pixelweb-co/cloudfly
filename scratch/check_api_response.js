const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS. Logging in to fetch JWT token...');
  
  const loginCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"username":"manager","password":"widowmaker"}' http://localhost:8080/auth/login`;
  
  conn.exec(loginCmd, (err, stream) => {
    if (err) throw err;
    let loginData = '';
    stream.on('close', (code, signal) => {
      try {
        const loginRes = JSON.parse(loginData);
        const token = loginRes.token || loginRes.jwt;
        if (!token) {
          console.error('Failed to get token. Response:', loginData);
          conn.end();
          return;
        }
        
        console.log('✅ Logged in successfully. Fetching products list...');
        const productsCmd = `curl -s -H "Authorization: Bearer ${token}" http://localhost:8080/api/v1/products/tenant/1?companyId=1`;
        
        conn.exec(productsCmd, (pErr, pStream) => {
          if (pErr) throw pErr;
          let pData = '';
          pStream.on('close', () => {
            try {
              const products = JSON.parse(pData);
              console.log('=== PRODUCTS API RESPONSE ===');
              products.forEach(p => {
                console.log(`ID: ${p.id} | Name: ${p.productName}`);
                console.log(`  imageUrls:`, p.imageUrls);
                console.log(`  imageIds:`, p.imageIds);
              });
            } catch (e) {
              console.error('Failed to parse products JSON:', e);
              console.log('Raw products output:', pData);
            }
            conn.end();
          }).on('data', (chunk) => {
            pData += chunk;
          });
        });
      } catch (e) {
        console.error('Failed to parse login response:', e);
        console.log('Raw login output:', loginData);
        conn.end();
      }
    }).on('data', (chunk) => {
      loginData += chunk;
    });
  });
}).connect(config);
