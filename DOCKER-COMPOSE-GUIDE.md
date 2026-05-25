# Docker Compose Guide

... (existing content omitted) ...

## Portainer

Portainer provides a web UI to manage Docker containers on the VPS.

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
  restart: unless-stopped          # restart policy aligned with spec
  ports:
    - "9000:9000"                  # host‑port exposure, not behind Traefik
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - portainer_data:/data
  environment:
    TZ: America/Bogota
  networks:
    - app-net
```

### Why no Traefik?
The team decided to expose Portainer directly on port **9000** to keep the management UI simple and avoid an extra reverse‑proxy layer on a single‑node VPS. The host firewall should restrict access to trusted IPs only.

### Security recommendations
- Restrict port **9000** in the VPS firewall (e.g., `ufw allow from <trusted‑ip> to any port 9000`).
- Consider adding TLS termination with a lightweight Nginx proxy if the UI must be reachable over the public internet.
- The Docker socket is mounted inside the container; keep the VPS SSH access hardened.
- Regularly back up the named volume `portainer_data`.

For a deeper dive see `research_portainer.md`.
