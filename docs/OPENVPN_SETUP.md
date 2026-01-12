# 🔐 OpenVPN + Traefik Setup para local.cloudfly.com.co

## 📋 Arquitectura

```
Internet → DNS (local.cloudfly.com.co) → VPS (Traefik:443) → OpenVPN → Tu PC (localhost:3000)
```

## 🚀 Instalación Rápida

### VPS - Script Automatizado

```bash
#!/bin/bash
# Guardar como: setup-vpn-proxy.sh

# 1. Instalar OpenVPN
wget https://git.io/vpn -O openvpn-install.sh
chmod +x openvpn-install.sh
echo -e "1\n1194\n1\ncloudfly-dev" | ./openvpn-install.sh

# 2. Crear estructura Traefik
mkdir -p /opt/cloudfly-proxy
cd /opt/cloudfly-proxy

# 3. Crear docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    networks:
      - proxy
    ports:
      - "80:80"
      - "443:443"
    environment:
      - CF_API_EMAIL=${CF_API_EMAIL}
      - CF_DNS_API_TOKEN=${CF_DNS_API_TOKEN}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
      - ./config.yml:/config.yml:ro

networks:
  proxy:
    external: true
EOF

# 4. Crear traefik.yml
cat > traefik.yml << 'EOF'
api:
  dashboard: true

entryPoints:
  http:
    address: ":80"
  https:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
  file:
    filename: /config.yml

certificatesResolvers:
  cloudflare:
    acme:
      email: admin@cloudfly.com.co
      storage: acme.json
      dnsChallenge:
        provider: cloudflare
EOF

# 5. Crear config.yml
cat > config.yml << 'EOF'
http:
  routers:
    local-frontend:
      entryPoints: ["https"]
      rule: "Host(`local.cloudfly.com.co`)"
      tls:
        certResolver: cloudflare
      service: local-fe

    local-backend:
      entryPoints: ["https"]
      rule: "Host(`api-local.cloudfly.com.co`)"
      tls:
        certResolver: cloudflare
      service: local-be

  services:
    local-fe:
      loadBalancer:
        servers:
          - url: "http://10.8.0.2:3000"
    
    local-be:
      loadBalancer:
        servers:
          - url: "http://10.8.0.2:8080"
EOF

# 6. Preparar certificados
touch acme.json
chmod 600 acme.json

# 7. Crear red Docker
docker network create proxy 2>/dev/null || true

# 8. Configurar firewall
ufw allow 1194/udp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Setup completo!"
echo "📝 Próximos pasos:"
echo "1. Editar .env con tus credenciales de Cloudflare"
echo "2. docker-compose up -d"
echo "3. Descargar /root/cloudfly-dev.ovpn a tu PC"
```

### Ejecutar en VPS:
```bash
chmod +x setup-vpn-proxy.sh
./setup-vpn-proxy.sh
```

---

## 💻 Windows PC - Cliente OpenVPN

### PowerShell Script

```powershell
# setup-vpn-client.ps1

# 1. Instalar OpenVPN GUI
winget install OpenVPNTechnologies.OpenVPN

# 2. Descargar configuración del VPS
$vpsIP = Read-Host "IP del VPS"
scp root@${vpsIP}:/root/cloudfly-dev.ovpn $env:USERPROFILE\Downloads\

# 3. Mover a carpeta OpenVPN
$ovpnPath = "$env:USERPROFILE\OpenVPN\config"
New-Item $ovpnPath -ItemType Directory -Force
Move-Item "$env:USERPROFILE\Downloads\cloudfly-dev.ovpn" $ovpnPath -Force

# 4. Agregar configuración personalizada
Add-Content "$ovpnPath\cloudfly-dev.ovpn" @"

# No usar VPN para todo el tráfico
route-nopull
route 10.8.0.0 255.255.255.0 vpn_gateway

# Script para iniciar servicios al conectar
script-security 2
up "C:\\apps\\cloudfly\\scripts\\vpn-connected.bat"
"@

Write-Host "✅ OpenVPN configurado!" -ForegroundColor Green
Write-Host "👉 Conecta desde OpenVPN GUI en la bandeja del sistema" -ForegroundColor Cyan
```

---

## 🔧 Scripts Auxiliares

### vpn-connected.bat
```batch
@echo off
echo ========================================
echo VPN Conectado - Iniciando servicios
echo ========================================

REM Frontend
start "CloudFly Frontend" cmd /k "cd C:\apps\cloudfly\frontend && npm run dev"

REM Backend  
timeout /t 5
start "CloudFly Backend" cmd /k "cd C:\apps\cloudfly\backend && mvn spring-boot:run"

echo.
echo ✅ Servicios iniciados
echo 🌐 Frontend: https://local.cloudfly.com.co
echo 🔌 Backend: https://api-local.cloudfly.com.co
echo.
pause
```

Guardar en: `C:\apps\cloudfly\scripts\vpn-connected.bat`

---

## 🌐 DNS - Cloudflare

Agregar estos registros **DNS Only** (sin proxy):

```
local.cloudfly.com.co      A    TU_VPS_IP
api-local.cloudfly.com.co  A    TU_VPS_IP
```

---

## ✅ Verificación

```bash
# En VPS - Ver logs de Traefik
docker logs -f traefik

# En VPS - Ver conexiones OpenVPN
cat /var/log/openvpn/status.log

# En Windows - Ver IP asignada
ipconfig | findstr "10.8.0"

# Prueba desde navegador
curl https://local.cloudfly.com.co
```

---

## 🐛 Troubleshooting

### VPN no conecta
```bash
# VPS - Revisar firewall
ufw status

# VPS - Reiniciar OpenVPN
systemctl restart openvpn@server
```

### Traefik no encuentra tu PC
```bash
# Verificar que tu PC tenga IP 10.8.0.2
# En Windows:
ipconfig

# Ping desde VPS a tu PC
ping 10.8.0.2
```

### Certificados SSL no se generan
```bash
# VPS - Ver logs
docker logs traefik

# Verificar credenciales Cloudflare
cat /opt/cloudfly-proxy/.env
```

---

## 📊 Comandos Útiles

```bash
# VPS - Ver estado
systemctl status openvpn@server
docker ps
docker logs traefik

# VPS - Agregar más clientes
./openvpn-install.sh

# Windows - Reconectar VPN
# Click derecho en OpenVPN GUI → Disconnect → Connect

# Windows - Ver rutas
route print | findstr 10.8.0
```

---

## 🎯 Resultado Final

✅ `https://local.cloudfly.com.co` → localhost:3000 (Frontend)  
✅ `https://api-local.cloudfly.com.co` → localhost:8080 (Backend)  
✅ SSL válido con Let's Encrypt  
✅ Sin exponeer puertos directamente en tu PC  
✅ Acceso controlado solo por VPN  

