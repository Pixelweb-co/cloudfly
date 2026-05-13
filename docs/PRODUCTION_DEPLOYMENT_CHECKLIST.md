# 🚀 Checklist de Despliegue a Producción - CloudFly AI

Este documento contiene los pasos críticos que deben revertirse o activarse antes de pasar a un entorno de producción real para evitar costos innecesarios o bucles infinitos.

## 🛡️ Seguridad y Estabilidad (Socket Service)
- [ ] **Filtro de Ecos (fromMe)**: En `chat-socket-service/src/services/chatService.js`, descomentar el filtro de `data.key.fromMe`. 
  - *Razón*: Evita que el bot responda a sus propios mensajes, lo que causaría un bucle infinito de mensajes y consumo masivo de tokens.
- [ ] **Ventana de Debounce**: Actualmente configurada en 3000ms en `messageBufferService.js`. Evaluar si se requiere reducir a 1500ms o 2000ms según la carga real.

## 💰 Optimización de Tokens (AI Agent)
- [ ] **Modelo Tiered**: Asegurarse de que `config.OPENAI_MODEL` apunte a `gpt-4o` y que el router a `gpt-4o-mini` esté activo.
- [ ] **Tracking**: Verificar que la tabla `token_usage_log` esté recibiendo datos para el monitoreo de costos.

## 🔑 Credenciales
- [ ] Cambiar todas las llaves de `.env` (JWT_SECRET, OPENAI_API_KEY, etc.) por valores de producción seguros.
- [ ] Desactivar el acceso SSH por contraseña en el VPS (usar solo llaves).

---
*Documento generado automáticamente por Antigravity el 2026-05-13.*
