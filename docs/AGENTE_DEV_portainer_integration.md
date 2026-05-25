# Portainer Integration for CloudFly VPS

## Overview
Portainer is a lightweight Docker management UI that has been added to the CloudFly VPS stack. The service is exposed directly on host port **9000** (no Traefik) as requested by the Product Owner. This document explains the configuration, rationale, and verification steps.

## Docker‑Compose Configuration
The service is defined in `docker-compose‑full‑vps.yml`:

```yaml
# -------------------------------------------------
# Portainer – UI for Docker management.
# Exposed directly on host port 9000 (no Traefik) as
# requested by the Product Owner. Direct exposure
# simplifies access on a single‑node VPS and avoids
# an extra reverse‑proxy layer. Access should be
# limited via host firewall (allow only trusted IPs).
# -------------------------------------------------
portainer:
  image: portainer/portainer-ce:latest
  container_name: portainer
  restart: unless-stopped
  ports:
    - "9000:9000"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - portainer_data:/data
  environment:
    TZ: America/Bogota
  networks:
    - app-net
```

### Key Points
- **Direct host port exposure**: `9000:9000` – no Traefik labels.
- **Restart policy**: `unless-stopped` – aligns with the acceptance criteria.
- **Volumes**: Docker socket for API access and a named volume `portainer_data` for persistence.
- **Network**: Attached to `app-net` like other services.

## Security Considerations
- **Firewall**: Restrict inbound traffic to port 9000 to trusted IPs (e.g., `ufw allow from <ADMIN_IP> to any port 9000`).
- **TLS**: Optional – if HTTPS is required, consider placing Portainer behind Traefik with TLS termination in the future.
- **Docker socket**: Only bind‑mounted on the host; no additional permissions are granted.

## Verification
A lightweight Node.js script `scratch/check_portainer.js` verifies that the container is running and the API is reachable:

```js
// scratch/check_portainer.js
const { execSync } = require('child_process');
const http = require('http');

function containerRunning() {
  try {
    const out = execSync('docker inspect -f "{{.State.Running}}" portainer', {
      encoding: 'utf8',
    }).trim();
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
```

Run it with `node scratch/check_portainer.js`.

## Documentation References
- Official Portainer Docker install guide: https://docs.portainer.io/start/install/server/docker
- Portainer security best practices: https://www.portainer.io/blog/portainer-security-best-practices
- Securing Docker on a VPS (ufw example): https://www.digitalocean.com/community/tutorials/how-to-secure-docker-on-ubuntu-20-04

---

**Next Steps**: Deploy the updated compose file on the VPS, run the verification script, and confirm UI access at `http://<VPS‑IP>:9000`.
