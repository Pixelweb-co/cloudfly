# Docker Compose - Arquitectura Separada

Este proyecto utiliza dos archivos Docker Compose separados para mejor organización y escalabilidad:

## 📁 Estructura

### **1. `docker-compose.infra.yml`** - Infraestructura
Servicios base que las aplicaciones necesitan:
- **Bases de datos**: MySQL, PostgreSQL
- **Caché**: Redis
- **Mensajería**: Kafka, Zookeeper
- **Vector DB**: Qdrant
- **Herramientas**: phpMyAdmin, Redis Insight, Kafdrop, Port

ainer
- **Reverse Proxy**: Traefik

### **2. `docker-compose.apps.yml`** - Aplicaciones
Servicios de negocio que dependen de la infraestructura:
- **Backend API**: Spring Boot (Java)
- **Frontend**: Next.js
- **Notification Service**: Spring Boot
- **Evolution API**: WhatsApp Business
- **N8N**: Automatización
- **Chat Socket Service**: WebSocket server
- **Chatwoot**: Chat center

---

## 🚀 Comandos de Uso

### **Iniciar Infraestructura** (Primero)
```bash
# Iniciar todos los servicios de infraestructura
docker-compose -f docker-compose.infra.yml up -d

# Ver logs
docker-compose -f docker-compose.infra.yml logs -f

# Detener
docker-compose -f docker-compose.infra.yml down
```

### **Iniciar Aplicaciones** (Después de infraestructura)
```bash
# Iniciar todas las aplicaciones
docker-compose -f docker-compose.apps.yml up -d

# Ver logs de un servicio específico
docker-compose -f docker-compose.apps.yml logs -f backend-api

# Ver logs de todos
docker-compose -f docker-compose.apps.yml logs -f

# Detener
docker-compose -f docker-compose.apps.yml down
```

### **Gestión Granular**

**Iniciar solo servicios específicos:**
```bash
# Solo backend y frontend
docker-compose -f docker-compose.apps.yml up -d backend-api frontend-react

# Solo notification service
docker-compose -f docker-compose.apps.yml up -d notification-service
```

**Rebuild de un servicio:**
```bash
# Rebuild backend
docker-compose -f docker-compose.apps.yml up -d --build backend-api

# Rebuild frontend
docker-compose -f docker-compose.apps.yml up -d --build frontend-react
```

**Ver estado:**
```bash
# Estado de infraestructura
docker-compose -f docker-compose.infra.yml ps

# Estado de aplicaciones
docker-compose -f docker-compose.apps.yml ps
```

---

## 📋 Orden de Inicio Recomendado

### **Desarrollo Local:**
```bash
# 1. Levantar infraestructura
docker-compose -f docker-compose.infra.yml up -d

# 2. Esperar a que bases de datos estén listas
sleep 10

# 3. Levantar solo lo que necesites
docker-compose -f docker-compose.apps.yml up -d backend-api frontend-react
```

### **Producción Completa:**
```bash
# 1. Infraestructura
docker-compose -f docker-compose.infra.yml up -d

# 2. Esperar estabilización
sleep 15

# 3. Aplicaciones
docker-compose -f docker-compose.apps.yml up -d
```

---

## 🔧 Configuración

### **Redes**
Las aplicaciones se conectan a las redes de infraestructura usando `external: true`:
- `cloudfly_app-net`: Red principal para comunicación entre servicios
- `cloudfly_kafka-net`: Red para Kafka y servicios relacionados

### **Volúmenes**
- **Infraestructura**: Maneja volúmenes de datos persistentes (DBs, etc.)
- **Aplicaciones**: Maneja volúmenes de aplicación (uploads, cache, etc.)

---

## 🛠️ Desarrollo

### **Modo Desarrollo (sin Docker):**
```bash
# 1. Solo levantar infraestructura
docker-compose -f docker-compose.infra.yml up -d

# 2. Correr backend localmente
cd backend
mvn spring-boot:run

# 3. Correr frontend localmente
cd frontend
npm run dev
```

### **Modo Híbrido:**
```bash
# Infraestructura + Backend en Docker, Frontend local
docker-compose -f docker-compose.infra.yml up -d
docker-compose -f docker-compose.apps.yml up -d backend-api notification-service
cd frontend && npm run dev
```

---

## 📊 Acceso a Servicios

### **Herramientas de Gestión:**
- **phpMyAdmin**: http://localhost:8000
- **Redis Insight**: http://localhost:8001
- **Kafdrop (Kafka)**: http://localhost:9100
- **Portainer**: http://localhost:9000

### **Aplicaciones:**
- **Backend API**: http://localhost:8080 (desarrollo) / https://api.cloudfly.com.co (producción)
- **Frontend**: http://localhost:3000 (desarrollo) / https://dashboard.cloudfly.com.co (producción)
- **Notification Service**: http://localhost:8081
- **Evolution API**: http://localhost:8082 / https://eapi.cloudfly.com.co
- **N8N**: https://autobot.cloudfly.com.co
- **Chat Socket**: https://chat.cloudfly.com.co
- **Chatwoot**: https://chatcenter.cloudfly.com.co

---

## 🧹 Limpieza

### **Detener todo:**
```bash
docker-compose -f docker-compose.apps.yml down
docker-compose -f docker-compose.infra.yml down
```

### **Detener y eliminar volúmenes:**
```bash
docker-compose -f docker-compose.apps.yml down -v
docker-compose -f docker-compose.infra.yml down -v
```

### **Limpiar imágenes no usadas:**
```bash
docker image prune -a
```

---

## 🔍 Troubleshooting

### **Las aplicaciones no pueden conectarse a la infraestructura:**
```bash
# Verificar que las redes existan
docker network ls | grep cloudfly

# Si no existen, iniciar infraestructura primero
docker-compose -f docker-compose.infra.yml up -d
```

### **Error de "network not found":**
```bash
# Crear redes manualmente si es necesario
docker network create cloudfly_app-net
docker network create cloudfly_kafka-net
```

### **Ver logs de errores:**
```bash
# Infraestructura
docker-compose -f docker-compose.infra.yml logs --tail=100

# Aplicaciones
docker-compose -f docker-compose.apps.yml logs --tail=100 backend-api
```

---

## 📝 Notas Importantes

1. **Siempre** iniciar `docker-compose.infra.yml` primero
2. Las aplicaciones dependen de las redes creadas por infraestructura
3. En desarrollo, puedes dejar infraestructura corriendo y solo reiniciar aplicaciones
4. Traefik está en infraestructura, así que las rutas HTTPS funcionan cuando ambos están activos
5. Los archivos `.env` y `.env.chatwoot` deben existir para Evolution API y Chatwoot

---

## 🎯 Ventajas de Esta Arquitectura

✅ **Separación de responsabilidades**: Infraestructura vs Aplicaciones  
✅ **Desarrollo ágil**: Reinicia solo lo que necesitas  
✅ **Escalabilidad**: Fácil agregar servicios en cualquier capa  
✅ **Mantenimiento**: Actualizaciones independientes  
✅ **Debug**: Logs y gestión más clara  
✅ **Recursos**: Control fino sobre qué servicios correr
