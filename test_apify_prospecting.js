const { Client } = require('ssh2');
const fs = require('fs');

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const keyword = 'peluquerias';
const country = 'Colombia';

async function testDirectApify() {
  console.log('\n--- 1. Testing Apify API Directly ---');
  const url = `https://api.apify.com/v2/actor-tasks?token=${APIFY_TOKEN}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Apify API Token is valid and working!');
      console.log(`Found ${data.data.items.length} existing tasks in this account.`);
    } else {
      console.log(`❌ Apify API Token returned status: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('❌ Error calling Apify directly:', error);
  }
}

function testVPSIntegration() {
  console.log('\n--- 2. Testing VPS Integration ---');
  const conn = new Client();
  const config = {
    host: '109.205.182.94',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
    readyTimeout: 60000
  };

  conn.on('ready', () => {
    console.log('✅ Connected to VPS via SSH.');
    
    // Command to test the lead-generator API inside the VPS.
    // It calls http://localhost:8000 inside the lead-generator container or http://localhost:8001 on the host.
    // Let's use the local container port 8000 by executing curl through docker compose.
    const testCmd = [
      'cd /apps/cloudfly',
      'echo "=== Checking lead-generator container status ==="',
      'docker compose -f docker-compose-full-vps.yml ps lead-generator',
      'echo "=== Making test request to lead-generator ==="',
      `curl -s -X POST http://localhost:8001/leads/generate -H "Content-Type: application/json" -d '{"mode": "automatic", "filters": {"keyword": "${keyword}", "country": "${country}", "limit": 3, "source": "google_search", "enrich": true}}'`
    ].join(' && ');

    console.log(`Running on VPS: ${testCmd}`);

    conn.exec(testCmd, (err, stream) => {
      if (err) {
        console.error('❌ SSH Execution error:', err);
        conn.end();
        return;
      }
      let output = '';
      stream.on('close', (code, signal) => {
        console.log(`\nCommand completed with code ${code}`);
        if (code === 0) {
          console.log('✅ API integration test finished.');
        } else {
          console.log('❌ API integration test returned an error.');
        }
        conn.end();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }).on('error', (err) => {
    console.error('❌ SSH Connection error:', err);
  }).connect(config);
}

async function run() {
  await testDirectApify();
  testVPSIntegration();
}

run();
