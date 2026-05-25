// scratch/check_portainer.js
// Verifies that the Portainer container is running and its HTTP API returns 200.
// Allows optional HOST override via environment variable (default: localhost).

const { execSync } = require('child_process');
const http = require('http');

function containerRunning() {
  try {
    const out = execSync('docker inspect -f "{{.State.Running}}" portainer', { encoding: 'utf8' }).trim();
    return out === 'true';
  } catch (e) {
    return false;
  }
}

function httpStatus(host, callback) {
  const options = {
    hostname: host,
    port: 9000,
    path: '/api/status',
    method: 'GET',
  };
  const req = http.request(options, (res) => {
    callback(null, res.statusCode);
  });
  req.on('error', (err) => callback(err));
  req.end();
}

if (!containerRunning()) {
  console.error('❌ Portainer container is NOT running.');
  process.exit(1);
}

const host = process.env.HOST || 'localhost';
httpStatus(host, (err, status) => {
  if (err) {
    console.error('❌ HTTP request failed:', err.message);
    process.exit(1);
  }
  if (status === 200) {
    console.log('✅ Portainer is running and API returned 200.');
    process.exit(0);
  } else {
    console.error(`❌ Unexpected HTTP status: ${status}`);
    process.exit(1);
  }
});
