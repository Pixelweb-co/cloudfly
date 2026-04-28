# Guía de Desarrollo Local con Backend en Producción

Esta guía explica cómo configurar el entorno de desarrollo local para el frontend (`frontend_new`) apuntando a los servicios de producción en el VPS. Esto permite iterar rápidamente en la UI sin necesidad de desplegar cada cambio.

## 1. Configuración del Frontend Local

En el directorio `c:\apps\cloudfly\frontend_new`, asegúrate de que el archivo `.env` contenga las URLs de producción:

```env
# URLs del VPS (Producción)
NEXT_PUBLIC_API_URL=https://api.cloudfly.com.co
JAVA_API_URL=https://api.cloudfly.com.co
NEXT_PUBLIC_CHAT_API_URL=https://chat.cloudfly.com.co

# URL Local del Frontend
FRONTEND_URL=http://localhost:3000
```

## 2. Configuración de CORS en el VPS

Para que el navegador permita las peticiones desde `localhost` hacia `cloudfly.com.co`, los servicios del backend deben autorizar el origen.

### Chat Socket Service (Node.js)
El archivo `chat-socket-service/src/index.js` ha sido configurado para permitir múltiples orígenes:
- `https://dashboard.cloudfly.com.co` (Producción)
- `http://localhost:3000` (Desarrollo Local)

### Backend API (Java)
El archivo `com.app.config.CorsConfig` ya permite los siguientes orígenes por defecto:
- `https://dashboard.cloudfly.com.co`
- `http://localhost:3000`

## 3. Flujo de Trabajo Recomendado

1.  **Modificar:** Realiza tus cambios en el código local.
2.  **Validar:** Abre `http://localhost:3000` en tu navegador.
3.  **Probar Multimedia:** Envía audios o imágenes. El frontend local se comunicará con el `chat-socket-service` y el `backend-api` del VPS.
4.  **Desplegar:** Una vez que confirmes que todo funciona en local, realiza el `git push` y despliega al VPS para que los cambios estén disponibles en la URL de producción.

## ⚠️ Notas Importantes
- **HTTPS vs HTTP:** El backend de producción usa HTTPS. Es posible que el navegador bloquee peticiones "Mixed Content" si intentas usar HTTP en local hacia HTTPS en producción. Si esto ocurre, habilita HTTPS en tu entorno local o permite el contenido mixto en la configuración del sitio del navegador.
- **Microscopio de Logs:** Puedes seguir viendo los logs en tiempo real en el VPS con `docker compose logs -f` mientras usas el frontend local.
