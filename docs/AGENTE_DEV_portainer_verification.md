# Portainer Verification Script

The repository includes a Node.js script located at `scratch/check_portainer.js`. This script is used to automatically verify that the Portainer container is running correctly on the VPS and that its health‑check endpoint returns a successful HTTP 200 response.

## How the script works
1. **Docker container check** – Executes `docker inspect -f "{{.State.Running}}" portainer` to ensure the container named `portainer` is in a *running* state.
2. **HTTP health‑check** – Sends a `GET` request to `http://<HOST>:9000/api/status` (default host is `localhost`). The script expects a **200** status code and will output a success message.
3. **Configurable host** – You can override the target host by setting the environment variable `HOST` before running the script, e.g.:
   ```bash
   HOST=192.168.1.10 node scratch/check_portainer.js
   ```
4. **Exit codes** – The script exits with `0` on success and `1` on any failure, making it suitable for CI pipelines.

## Script source (`scratch/check_portainer.js`)
```javascript
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
```

## Usage
```bash
# Ensure Docker daemon is running and Node.js LTS is installed.
node scratch/check_portainer.js          # Local verification (default localhost)
HOST=YOUR_VPS_IP node scratch/check_portainer.js   # Remote verification
```

If the script prints `✅ Portainer is running and API returned 200.` and exits with code 0, the deployment meets the acceptance criteria for **CLOUD‑139**.
