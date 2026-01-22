# Inicio Rápido - CloudFly Local con Túnel

## Pasos para Iniciar

### 1. Iniciar Docker Desktop
- Abre Docker Desktop desde el menú de Windows
- Espera a que el ícono de Docker en la bandeja del sistema esté verde

### 2. Ejecutar el script de inicio
```powershell
cd c:\apps\cloudfly
.\start-local.ps1
```

### 3. Configurar DNS en HestiaCP

Agrega estos registros CNAME en tu zona DNS de `cloudfly.com.co`:

```
api         CNAME   7345e721-289a-4e8b-8af6-bd440b52fa31.cfargotunnel.com.
dashboard   CNAME   7345e721-289a-4e8b-8af6-bd440b52fa31.cfargotunnel.com.
autobot     CNAME   7345e721-289a-4e8b-8af6-bd440b52fa31.cfargotunnel.com.
eapi        CNAME   7345e721-289a-4e8b-8af6-bd440b52fa31.cfargotunnel.com.
chat        CNAME   7345e721-289a-4e8b-8af6-bd440b52fa31.cfargotunnel.com.
chatcenter  CNAME   7345e721-289a-4e8b-8af6-bd440b52fa31.cfargotunnel.com.
```

### 4. Verificar

**Local:**
- http://localhost - Dashboard
- http://localhost:8080 - Traefik Dashboard

**Público (después de configurar DNS):**
- https://dashboard.cloudfly.com.co
- https://api.cloudfly.com.co
- https://autobot.cloudfly.com.co

## Detener

```powershell
docker-compose -f docker-compose-local.yml down
wsl -e bash -c "pkill -f cloudflared"
```

## Troubleshooting

**Docker no inicia:**
- Verifica que Docker Desktop esté instalado
- Reinicia Docker Desktop
- Verifica que WSL 2 esté habilitado

**Túnel no conecta:**
```bash
wsl -e bash -c "cloudflared tunnel run cloudfly --loglevel debug"
```

**Error 502:**
- Verifica logs: `docker logs traefik`
- Verifica servicio: `docker logs backend-api`
