# Research – Portainer Deployment on VPS

## Overview
Portainer provides a web‑based UI to manage Docker containers, images, networks and volumes. Deploying it on a single‑node VPS is straightforward, but a few security considerations are required because the service needs access to the Docker socket.

## Recommended Configuration
```yaml
portainer:
  image: portainer/portainer-ce:latest
  container_name: portainer
  restart: unless-stopped
  ports:
    - "9000:9000"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock   # host Docker socket
    - portainer_data:/data                         # persistent data volume
  environment:
    TZ: America/Bogota
  networks:
    - app-net
```
- **Port**: `9000` (host → container). Direct exposure is acceptable for a VPS that is firewalled.
- **Volumes**:
  - `/var/run/docker.sock` gives Portainer full control over the Docker daemon – treat this as root access.
  - `portainer_data` stores UI settings, users and persisted data.
- **Restart policy**: `unless-stopped` matches the project's conventions.
- **Network**: attach to existing `app-net` for internal communication.

## Security Recommendations
1. **Firewall restriction** – allow inbound traffic to port `9000` only from trusted IP addresses (e.g., admin workstation). Example `ufw` rule:
   ```bash
   ufw allow from <trusted‑ip>/32 to any port 9000
   ```
2. **TLS/HTTPS** – Prefer terminating TLS with a lightweight reverse‑proxy (Nginx) in front of Portainer, or enable Portainer's built‑in TLS support.
3. **Docker socket exposure** – The container runs with effectively root privileges on the host. Keep the VPS OS patched and limit SSH access.
4. **Regular updates** – Schedule a weekly pull of the latest `portainer/portainer-ce` image and restart the service.
5. **Backup** – Periodically back up the `portainer_data` volume:
   ```bash
   docker run --rm -v portainer_data:/data -v $(pwd):/backup alpine tar czf /backup/portainer_$(date +%F).tar.gz /data
   ```

## References
- Official Portainer documentation: https://docs.portainer.io
- Portainer security guide: https://docs.portainer.io/v2.9/deploy/security
- Docker socket security considerations: https://docs.docker.com/engine/security/#docker-daemon-attack-surface

---
*Prepared by the System Architect and reviewed by the DevOps team.*