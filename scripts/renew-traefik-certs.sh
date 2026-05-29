#!/usr/bin/env bash
# Crea /apps/cloudfly/certs/acme.json y reinicia Traefik para obtener certs Let's Encrypt.
# Uso en el VPS (como root o con sudo para mkdir/chmod):
#   sudo mkdir -p /apps/cloudfly/certs
#   chmod +x scripts/renew-traefik-certs.sh
#   ./scripts/renew-traefik-certs.sh

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-full-vps.yml}"
CERT_DIR="${TRAEFIK_CERTS_DIR:-/apps/cloudfly/certs}"
SERVICE="${TRAEFIK_SERVICE:-traefik}"

echo "==> Directorio de certificados: ${CERT_DIR}"
mkdir -p "${CERT_DIR}"

if [[ "${RESET_ACME:-0}" == "1" ]] || [[ ! -f "${CERT_DIR}/acme.json" ]] || [[ ! -s "${CERT_DIR}/acme.json" ]]; then
  if [[ -f "${CERT_DIR}/acme.json" ]] && [[ -s "${CERT_DIR}/acme.json" ]] && [[ "${RESET_ACME:-0}" == "1" ]]; then
    cp "${CERT_DIR}/acme.json" "${CERT_DIR}/acme.json.bak.$(date +%Y%m%d%H%M%S)"
    echo "==> Respaldo creado (RESET_ACME=1)"
  fi
  echo "==> Generando acme.json nuevo (Traefik lo rellenará al obtener los certs)"
  echo '{}' > "${CERT_DIR}/acme.json"
fi

chmod 600 "${CERT_DIR}/acme.json"
ls -la "${CERT_DIR}/acme.json"

export TRAEFIK_CERTS_DIR="${CERT_DIR}"
echo "==> Reiniciando ${SERVICE} (${COMPOSE_FILE})"
docker compose -f "${COMPOSE_FILE}" up -d "${SERVICE}"

echo "==> Esperando emisión ACME (45s)..."
sleep 45

echo "==> Últimos logs ACME:"
docker logs "${SERVICE}" 2>&1 | grep -iE 'acme|certificate|error|unable|default certificate' | tail -40 || true

echo ""
echo "==> Tamaño de acme.json (debe crecer si Let's Encrypt respondió):"
wc -c "${CERT_DIR}/acme.json" || true

echo ""
echo "==> Prueba TLS:"
echo | openssl s_client -connect api.cloudfly.com.co:443 -servername api.cloudfly.com.co 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates 2>/dev/null || echo "(openssl no disponible en este host)"
