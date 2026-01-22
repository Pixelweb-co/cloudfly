#!/bin/bash

# Script de parada para CloudFly Local

echo "🛑 Deteniendo CloudFly Local"
echo "================================================="

# 1. Detener túnel
echo ""
echo "🌐 Deteniendo Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    sudo systemctl stop cloudflared
    echo "✅ Túnel detenido"
else
    pkill -f "cloudflared tunnel run" && echo "✅ Túnel detenido" || echo "⚠️  Túnel no estaba corriendo"
fi

# 2. Detener Docker Compose (ejecutar desde Windows)
echo ""
echo "🐳 Para detener Docker, ejecuta desde Windows:"
echo "   docker-compose -f docker-compose-local.yml down"
