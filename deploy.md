# Cloudfly Deployment Guide (Fresh Install)

Este documento detalla los pasos necesarios para realizar una instalación completa de Cloudfly desde cero en un servidor VPS Ubuntu 22.04.

## 🏗️ Descripción de la Arquitectura
Cloudfly utiliza una arquitectura multi-tenant:
- **Backend New**: Spring Boot Reactive (WebFlux + R2DBC).
- **Frontend**: Next.js (Dashboard administrativo anterior).
- **Frontend New**: Next.js Moderno (Nuevo Dashboard).
- **Infraestructura**: Docker Compose, MySQL, Redis, Kafka, n8n, Evolution API.

## 📋 Requisitos Previos
- Servidor VPS con al menos 4GB RAM (Recomendado 8GB para n8n + Kafka).
- Docker y Docker Compose instalados.
- Nginx Proxy Manager (o Nginx con Certbot) para gestión de dominios y SSL.

## 🚀 Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/Pixelweb-co/cloudfly.git /apps/cloudfly
cd /apps/cloudfly
```

## ⚙️ Paso 2: Configuración del Entorno (.env)
Crea un archivo `.env` en la raíz basándote en el archivo `docker-compose-full.yml`.
Variables críticas:
- `MYSQL_ROOT_PASSWORD`: Contraseña del motor DB.
- `JWT_SECRET`: Llave para firmas de tokens.
- `EVOLUTION_API_KEY`: API Key para la integración de WhatsApp.
- `NEXT_PUBLIC_API_URL`: URL pública del Backend (ej: `https://api.cloudfly.com.co`).

## 🗄️ Paso 3: Inicialización de Base de Datos
1. Iniciar el servicio de base de datos:
   ```bash
   docker compose up -d db
   ```
2. Ejecutar los scripts de inicialización (en orden):
   - `bootstrap_cloudfly.sql`: Crea tenant maestro, compañía y usuario administrador inicial.
   - `create_channel_configs.sql`: Crea la tabla para configuraciones de instancia.
   - `create_channel_type_configs.sql`: Crea la tabla para tipos de canales (Sales, Support, AI, etc.).

## 🐳 Paso 4: Despliegue de Servicios
Inicia todo el stack tecnológico:
```bash
docker compose -f docker-compose-full.yml up -d --build
```

### Servicios Principales:
- **backend_new**: Port 8080
- **frontend**: Port 3000
- **frontend_new**: Port 3001
- **evolution_api**: Port 8081
- **n8n**: Port 5678

## 🛠️ Paso 5: Verificación Post-Despliegue
1. **Logs**: `docker compose logs -f backend_new`
2. **Dashboard**: Accede a `https://app.cloudfly.com.co/administracion/tipos-chatbot/list` (Ahora renombrado a **Tipos de Canal**).
3. **Pruebas E2E**: Ejecuta el script de validación total:
   ```bash
   python3 tests/test_full_onboarding.py
   ```

## 🔄 Actualización (CI/CD Manual)
Para actualizar el código y reiniciar servicios sin pérdida de datos:
```bash
bash /apps/cloudfly/terraform/generated/deploy.sh
```

## ⚠️ Notas Importantes
- **Evolución nomenclature**: El sistema ha sido migrado de `ChatbotConfig` a `ChannelConfig`. Asegúrate de que todas las referencias en el frontend apunten a `/api/channel-types`.
- **Certificados SSL**: Asegúrate de que los puertos 80 y 443 estén abiertos y apuntando a los contenedores correspondientes mediante un Proxy Inverso.
- **Kafka**: Si los mensajes no fluyen, verifica que el servicio `zookeeper` esté saludable antes de iniciar `kafka`.
