# Installation Guide

## Prerequisitos
- Docker Engine >= 24.x
- Docker Compose >= 2.20
- Python 3.11 (solo para desarrollo local de scripts)
- Acceso a internet para descargar imágenes base y modelos de IA.

## Variables de entorno
Copia el archivo de ejemplo y completa los valores:
```bash
cp .env.example .env
# Edita .env con tu editor favorito
```
Los parámetros críticos son:
- `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `KAFKA_BOOTSTRAP_SERVERS`
- `JIRA_TOKEN` (para integración con Jira)
- `MODEL_CACHE_DIR` (ruta donde se guardarán los modelos descargados).

## Desarrollo local
```bash
# Levanta los contenedores de desarrollo
docker compose -f docker-compose-local.yml up -d

# Verifica que la API esté corriendo
curl http://localhost:8000/health
```
Accede a la documentación Swagger en `http://localhost:8000/docs`.

## Despliegue en VPS
1. **Clona el repositorio** en el VPS.
2. **Copia** el archivo `.env.example` a `.env` y configura las variables.
3. **Ejecuta** el compose de producción:
   ```bash
   docker compose -f docker-compose-full-vps.yml up -d
   ```
4. **Traefik** ya está configurado para exponer el servicio bajo la ruta `/ia_scrum_team`.
5. **Verifica** la salud:
   ```bash
   curl https://<tu-dominio>/ia_scrum_team/health
   ```

## Limpieza
```bash
docker compose -f docker-compose-local.yml down -v   # elimina volúmenes locales
docker compose -f docker-compose-full-vps.yml down -v   # en producción
```

## Screenshots
> *(Insertar capturas de pantalla de la UI de Traefik y del Swagger UI aquí desde `screenshots_modules_final/`)*

---
*Este documento es parte de la guía oficial de CloudFly y se mantiene bajo control de versiones.*