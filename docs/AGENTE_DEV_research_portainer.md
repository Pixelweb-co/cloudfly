# Research – Portainer Deployment on a VPS

## 1. Requirements
- **Port**: 9000 (host) – must be reachable from admin IPs.
- **Volumes**:
  - `/var/run/docker.sock:/var/run/docker.sock` (required for Docker API access)
  - `portainer_data:/data` (persistent UI data)
- **Environment**: `TZ=America/Bogota` (optional, for correct timestamps)

## 2. Security Recommendations
- **Do not expose via Traefik** unless TLS termination is configured. Direct host‑port exposure is acceptable for a single‑node VPS when access is limited.
- **Firewall restriction** (example using `ufw`):
  ```bash
  ufw allow from <ADMIN_IP> to any port 9000
  ufw deny 9000
  ```
- **Docker socket bind‑mount** should stay on the host only; never expose it to other containers.
- **Restart policy**: `unless-stopped` – prevents endless restart loops if Docker daemon is temporarily unavailable.
- **Image updates**: Regularly pull the latest `portainer/portainer-ce` image.

## 3. Docker‑Compose Block (ready‑to‑copy)
```yaml
portainer:
  image: portainer/portainer-ce:latest
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

## 4. References
- Official Portainer Docker install guide: https://docs.portainer.io/start/install/server/docker
- Portainer security best practices: https://www.portainer.io/blog/portainer-security-best-practices
- Securing Docker on Ubuntu VPS (ufw example): https://www.digitalocean.com/community/tutorials/how-to-secure-docker-on-ubuntu-20-04
