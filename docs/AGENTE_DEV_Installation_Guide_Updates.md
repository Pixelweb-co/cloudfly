# AGENTE_DEV_Installation_Guide_Updates.md

## Updated Installation Guide – Ticket Resolver Service

The following sections have been added to **INSTALLATION_GUIDE.md** to cover the new Ticket Resolver micro‑service.

---

### 1. Prerequisites

- Docker Engine ≥ 24.0
- Docker Compose ≥ 2.20
- Access to the VPS where Traefik is already configured.
- Jira credentials (URL, user, API token) – see *Environment Variables* below.

---

### 2. Environment Variables

Create a file `ticket_resolver/.env` (do **not** commit this file to version control) with the following content:

```dotenv
JIRA_URL=https://yourcompany.atlassian.net
JIRA_USER=ci_bot
JIRA_TOKEN=YOUR_JIRA_TOKEN
```

> **Security note** – Store the token in a secret manager (e.g., HashiCorp Vault) on the VPS and mount it as an environment variable if you prefer not to keep it in a plain‑text file.

---

### 3. Adding the Service to Docker‑Compose

The `docker-compose-full-vps.yml` file already contains the Ticket Resolver definition. If you are using a custom compose file, ensure the following snippet is present under `services:`:

```yaml
  ticket_resolver:
    build:
      context: ./ticket_resolver
      dockerfile: Dockerfile
    container_name: ticket_resolver
    restart: unless-stopped
    env_file:
      - ./ticket_resolver/.env
    volumes:
      - ./ticket_resolver:/app:ro
    ports:
      - "8080:8080"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ticket_resolver.rule=PathPrefix(`/ticket_resolver` )"
      - "traefik.http.routers.ticket_resolver.entrypoints=websecure"
      - "traefik.http.services.ticket_resolver.loadbalancer.server.port=8080"
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

### 4. Build & Deploy

```bash
# From the repository root
docker compose -f docker-compose-full-vps.yml build ticket_resolver
docker compose -f docker-compose-full-vps.yml up -d ticket_resolver
```

The service will automatically register with Traefik and become reachable at:

```
https://<your‑vps-domain>/ticket_resolver/health
https://<your‑vps-domain>/ticket_resolver/tickets/pending
```

---

### 5. Verify Deployment

```bash
# Health check
curl -k https://<vps>/ticket_resolver/health
# Expected output: {"status":"ok"}

# Pending tickets (requires valid JIRA credentials)
curl -k https://<vps>/ticket_resolver/tickets/pending
```

If you receive a `500` error, check the container logs:

```bash
docker logs -f ticket_resolver
```

---

### 6. Monitoring & Logging

- **Traefik Dashboard** – accessible at `https://<vps>/dashboard/` (if enabled) will show the `ticket_resolver` router.
- **Docker healthcheck** – Docker will automatically restart the container if the `/health` endpoint fails.

---

### 7. Clean‑up

To stop and remove the service:

```bash
docker compose -f docker-compose-full-vps.yml down ticket_resolver
```

---

## References
- `ticket_resolver/Dockerfile` – container image definition.
- `ticket_resolver/api.py` – FastAPI endpoints.
- `ticket_resolver/jira_client.py` – Jira integration logic.
- `AGENTE_DEV_Ticket_Resolver_Architecture.md` – full architecture diagram and service overview.
