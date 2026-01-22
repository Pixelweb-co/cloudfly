# Script de inicio rapido para CloudFly Local + Tunnel

Write-Host "Iniciando CloudFly Local con Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Verificar Docker
Write-Host "`nVerificando Docker..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker info | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker esta corriendo" -ForegroundColor Green
    }
    else {
        Write-Host "Docker no esta corriendo. Inicia Docker Desktop." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Docker no esta instalado" -ForegroundColor Red
    exit 1
}

# 2. Iniciar Docker Compose
Write-Host "`nIniciando servicios Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose-local.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Servicios Docker iniciados" -ForegroundColor Green
}
else {
    Write-Host "Error al iniciar servicios Docker" -ForegroundColor Red
    exit 1
}

# 3. Esperar a que Traefik este listo
Write-Host "`nEsperando a que Traefik este listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Verificar Traefik
$traefikStatus = docker ps --filter "name=traefik" --format "{{.Status}}"
if ($traefikStatus -like "*Up*") {
    Write-Host "Traefik esta corriendo" -ForegroundColor Green
}
else {
    Write-Host "Traefik no esta corriendo correctamente" -ForegroundColor Yellow
}

# 5. El tunel ahora se inicia via Docker Compose (servicio 'tunnel')
Write-Host "`nVerificando Tunel Cloudflare (Docker)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Start-Sleep -Seconds 3
Write-Host "Tunel iniciado (verifica logs en la ventana de WSL)" -ForegroundColor Green

# 6. Mostrar resumen
Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "CloudFly Local esta corriendo" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "`nServicios disponibles:" -ForegroundColor Yellow
Write-Host "  Local:"
Write-Host "    Dashboard:  http://localhost" -ForegroundColor Cyan
Write-Host "    API:        http://localhost/api" -ForegroundColor Cyan
Write-Host "    Traefik:    http://localhost:8080" -ForegroundColor Cyan
Write-Host "    N8N:        http://n8n.localhost" -ForegroundColor Cyan

Write-Host "`n  Publico (via tunel):"
Write-Host "    Dashboard:  https://dashboard.cloudfly.com.co" -ForegroundColor Green
Write-Host "    API:        https://api.cloudfly.com.co" -ForegroundColor Green
Write-Host "    N8N:        https://autobot.cloudfly.com.co" -ForegroundColor Green
Write-Host "    Evolution:  https://eapi.cloudfly.com.co" -ForegroundColor Green
Write-Host "    Chat:       https://chat.cloudfly.com.co" -ForegroundColor Green
Write-Host "    Chatwoot:   https://chatcenter.cloudfly.com.co" -ForegroundColor Green

Write-Host "`nComandos utiles:" -ForegroundColor Yellow
Write-Host "  Ver logs:       docker-compose -f docker-compose-local.yml logs -f"
Write-Host "  Detener todo:   docker-compose -f docker-compose-local.yml down"
Write-Host "  Reiniciar:      docker-compose -f docker-compose-local.yml restart"

Write-Host "`nRecuerda:" -ForegroundColor Yellow
Write-Host "  - Configurar DNS en HestiaCP (ver guia)" -ForegroundColor Gray
Write-Host "  - El tunel debe estar corriendo para acceso publico" -ForegroundColor Gray
