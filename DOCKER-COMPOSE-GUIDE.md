## Portainer

Portainer provides a web UI to manage Docker containers on the VPS.

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

**Why direct host‑port exposure?**
The Product Owner decided not to route Portainer through Traefik. Direct exposure simplifies access on a single‑node VPS and avoids an extra reverse‑proxy layer. Access should be limited to trusted IPs via the host firewall (see `research_portainer.md`).

*See `research_portainer.md` for security hardening details and official references.*