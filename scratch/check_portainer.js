// scratch/check_portainer.js
// Verifies that the Portainer container is running and its HTTP API returns 200.

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

function httpStatus(callback) {
  http
    .get('http://localhost:9000/api/status', (res) => {
      callback(null, res.statusCode);
    })
    .on('error', (err) => callback(err));
}

if (!containerRunning()) {
  console.error('❌ Portainer container is NOT running.');
  process.exit(1);
}

httpStatus((err, status) => {
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
