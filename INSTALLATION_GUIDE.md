# Instalación y Configuración de CloudFly

## Prerrequisitos
- Docker Engine >= 24.x
- Docker Compose >= 2.20
- Node.js >= 20 (para el frontend)
- Python >= 3.12 (para los micro‑servicios)
- Java JDK 17 (para servicios legacy)

## Desarrollo Local
1. Clonar el repositorio
   ```bash
   git clone https://github.com/cloudfly/cloudfly.git
   cd cloudfly
   ```
2. Copiar los archivos de ejemplo de variables de entorno
   ```bash
   cp .env.example .env
   cp ai_scrum_team/.env.example ai_scrum_team/.env
   ```
3. Levantar la pila completa en modo local
   ```bash
   docker compose -f docker-compose-local.yml up -d
   ```
4. Verificar que los contenedores estén saludables
   ```bash
   curl -f http://localhost:8000/health
   ```
5. Ejecutar la suite de pruebas
   ```bash
   pytest
   ```

## Despliegue en VPS
1. Asegurarse de que el VPS tenga Docker y Docker‑Compose instalados.
2. Copiar el archivo `docker-compose-full-vps.yml` al servidor.
3. Subir los archivos de configuración (`.env`, `ai_scrum_team/.env`).
4. Iniciar los contenedores
   ```bash
   docker compose -f docker-compose-full-vps.yml up -d
   ```
5. Traefik expondrá los servicios bajo HTTPS. Verificar con:
   ```bash
   curl -k https://<HOST>/ia_scrum_team/health
   ```

## Herramientas de Verificación
- `scripts/check_*` – utilidades para validar logs, estado de contenedores y bases de datos.
- `scripts/check_vps_backend_status.js` – comprueba que los micro‑servicios estén corriendo.
- `scripts/check_docker_responsive.js` – verifica que Docker responda.

## Actualización de la Imagen
```bash
docker compose -f docker-compose-full-vps.yml pull
docker compose -f docker-compose-full-vps.yml up -d --no-deps --build
```

---
*Este documento está basado en la guía oficial de CloudFly y será actualizado conforme evolucionen los componentes.*