// scratch/check_portainer.js
// -------------------------------------------------
// Portainer health‑check script
// -------------------------------------------------
const http = require('http');
const { execSync } = require('child_process');

function fail(msg) {
  console.error('❌', msg);
  process.exit(1);
}

// 1️⃣ Verify container is running
let running;
try {
  running = execSync(
    'docker compose -f docker-compose-full-vps.yml ps --services --filter "status=running"'
  ).toString().trim();
} catch (e) {
  fail('Docker compose command failed');
}
if (!running.includes('portainer')) {
  fail('Portainer container is NOT running');
}
console.log('✅ Portainer container is running');

// 2️⃣ HTTP health check
http
  .get('http://localhost:9000/api/status', (res) => {
    if (res.statusCode !== 200) {
      fail(`Portainer API returned status ${res.statusCode}`);
    }
    console.log('✅ Portainer API responded with 200');
  })
  .on('error', (e) => fail(`HTTP request failed: ${e.message}`));
