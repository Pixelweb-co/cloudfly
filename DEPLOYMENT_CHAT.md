# 🚀 DESPLIEGUE A PRODUCCIÓN - CHAT OMNICANAL

## ⚙️ **PREPARACIÓN**

### 1️⃣ **Variables de Entorno en Servidor**

Crear archivo `.env` en el servidor con:

```bash
# Node Environment
NODE_ENV=production

# URLs
FRONTEND_URL=https://cloudfly.com.co
JAVA_API_URL=http://backend:8080

# Secrets - GENERAR NUEVOS EN PRODUCCIÓN
JWT_SECRET=$(openssl rand -base64 64)
N8N_SECRET_KEY=$(openssl rand -base64 64)

# Socket.IO Public URL
NEXT_PUBLIC_SOCKET_URL=https://chat.cloudfly.com.co
```

### 2️⃣ **DNS Configurado**

Asegurarse que existe:
- ✅ `chat.cloudfly.com.co` → IP del servidor

### 3️⃣ **Traefik Configurado**

El `docker-compose.yml` ya tiene las etiquetas de Traefik:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.chatsocket.rule=Host(`chat.cloudfly.com.co`)"
  - "traefik.http.routers.chatsocket.entrypoints=websecure"
  - "traefik.http.routers.chatsocket.tls.certresolver=le"
```

---

## 📦 **DESPLIEGUE**

### **Paso 1: Subir código al servidor**

```bash
# En tu máquina local
git add .
git commit -m "feat: Chat Omnicanal production ready"
git push origin main

# En el servidor
cd /apps/cloudfly
git pull origin main
```

### **Paso 2: Configurar variables de entorno**

```bash
# En el servidor
cd /apps/cloudfly

# Copiar el template y EDITARLO con secretos reales
cp .env.production .env
nano .env

# IMPORTANTE: Cambiar JWT_SECRET y N8N_SECRET_KEY
```

### **Paso 3: Build y Deploy**

```bash
# Build de servicios
docker-compose build frontend backend chat-socket-service

# Levantar servicios
docker-compose up -d frontend backend chat-socket-service

# Verificar logs
docker-compose logs -f chat-socket-service
```

### **Paso 4: Verificar conectividad**

```bash
# Debe responder 200 OK
curl https://chat.cloudfly.com.co/health

# Debe mostrar "Socket.IO server"
curl https://chat.cloudfly.com.co/
```

---

## ✅ **VERIFICACIÓN**

1. **Frontend**
   - Abrir https://cloudfly.com.co/comunicaciones/conversaciones
   - Verificar en consola: `🔌 Conectando a Socket.IO: https://chat.cloudfly.com.co`
   - Debe decir: `✅ Socket conectado: <id>`

2. **Enviar mensaje**
   - Escribir en chat
   - Debe aparecer instantáneamente
   - Verificar en BD que se guardó

3. **Recibir mensaje de WhatsApp**
   - Enviar mensaje al bot
   - Debe aparecer en CloudFly automáticamente

---

## 🔧 **TROUBLESHOOTING**

### Error: "Socket no conecta"

```bash
# Verificar que el servicio funciona
docker-compose ps chat-socket-service

# Ver logs
docker-compose logs -f chat-socket-service

# Verificar CORS
grep FRONTEND_URL /apps/cloudfly/.env
```

### Error: "JWT Invalid"

```bash
# Verificar que JWT_SECRET es el mismo en:
# - docker-compose.yml (chat-socket-service)
# - backend (application.yml)

# Regenerar token en el frontend
localStorage.removeItem('AuthToken')
# Login nuevamente
```

### Error: "No guarda mensajes"

```bash
# Verificar conexión a BD
docker-compose exec chat-socket-service node -e "console.log(process.env.JAVA_API_URL)"

# Debe mostrar: http://backend:8080

# Verificar backend
docker-compose logs backend | grep "chat"
```

---

## 🔒 **SEGURIDAD**

✅ **Configurado:**
- JWT validation en Socket.IO
- CORS restringido a cloudfly.com.co
- HTTPS con Traefik + Let's Encrypt
- Secrets en variables de entorno (NO en código)

⚠️ **IMPORTANTE:**
- Cambiar `JWT_SECRET` y `N8N_SECRET_KEY` en producción
- NO subir archivo `.env` a Git
- Rotar secrets cada 90 días

---

## 📊 **MONITOREO**

```bash
# CPU/Memoria del servicio
docker stats chat-socket-service

# Conexiones activas
docker-compose exec chat-socket-service netstat -an | grep 3001

# Logs en tiempo real
docker-compose logs -f --tail=100 chat-socket-service
```

---

## 🎉 **LISTO!**

El sistema de chat omnicanal está desplegado y funcionando en producción! 🚀
