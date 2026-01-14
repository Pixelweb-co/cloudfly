#!/bin/bash
set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Iniciando Voice Bot System...${NC}"

# 1. Verificar dependencias
echo -e "${BLUE}1. Comprobando requisitos...${NC}"
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker no está instalado." >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Error: Docker Compose no está instalado." >&2
  exit 1
fi

# 2. Permisos para script y directorios
mkdir -p /tmp/audio
chmod 777 /tmp/audio
echo -e "${GREEN}✅ Directorios preparados${NC}"

# 3. Construir y levantar contenedores
echo -e "${BLUE}2. Levantando servicios (Docker Compose)...${NC}"
docker-compose up -d --build

# 4. Esperar a que los servicios estén listos
echo -e "${BLUE}3. Esperando inicio de servicios...${NC}"
sleep 5

# Verificar Asterisk
if docker ps | grep -q asterisk; then
    echo -e "${GREEN}✅ Asterisk UP${NC}"
else
    echo "❌ Asterisk falló al iniciar"
fi

# Verificar STT
if docker ps | grep -q stt; then
  echo -e "${GREEN}✅ STT Service UP${NC}"
else
    echo "❌ STT falló al iniciar"
fi

# Verificar TTS
if docker ps | grep -q tts; then
  echo -e "${GREEN}✅ TTS Service UP${NC}"
else
    echo "❌ TTS falló al iniciar"
fi


echo -e "${BLUE}4. Estado de la red (Puertos)${NC}"
netstat -tulpn | grep -E '5060|8088|8000|5002' || echo "Nota: netstat no disponible o no mostró puertos (puede requerir sudo)"

echo -e "\n${GREEN}🚀 Sistema Listo!${NC}"
echo -e "Logs disponibles con: ${BLUE}docker-compose logs -f${NC}"
echo -e "\n${BLUE}Para probar:${NC}"
echo "1. Registra tu softphone en: EXT 1001 / Pass: password1001"
echo "2. Llama a la extensión: 1000"
