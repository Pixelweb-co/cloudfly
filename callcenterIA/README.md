# 🤖 Voice Bot - Instrucciones de ejecución

## Requisitos previos
- Docker y Docker Compose instalados
- Linux host (o WSL2 en Windows)
- Puertos disponibles: 5060 (SIP), 8088 (ARI), 8000 (STT), 5002 (TTS), 10000-20000 (RTP)
- Softphone configurado (ej: Zoiper, Linphone, MicroSIP)

## 🚀 Inicio rápido

### 1. Configurar n8n (opcional)
Si quieres usar IA conversacional real:
```bash
# Editar docker-compose.yml y descomentar servicio n8n
# O ejecutar n8n externamente
```

### 2. Ajustar IPs (si es necesario)
```bash
# Editar audiohub/audiohub.py con las IPs correctas
# Por defecto usa localhost (127.0.0.1)
```

### 3. Levantar servicios
```bash
cd /path/to/ari_sip_ai_bot_v2

# Iniciar todos los contenedores
docker-compose up -d --build

# Ver logs en tiempo real
docker-compose logs -f
```

### 4. Verificar servicios

```bash
# Ver estado de contenedores
docker-compose ps

# Todos deben estar "Up"
```

#### Verificar Asterisk
```bash
docker exec asterisk asterisk -rx "core show version"
docker exec asterisk asterisk -rx "pjsip show endpoints"
docker exec asterisk asterisk -rx "http show status"
```

#### Verificar STT
```bash
curl http://localhost:8000/health
```

#### Verificar TTS
```bash
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola mundo", "voice": "tts_models/es/css10/vits"}'
```

#### Verificar ARI Bot
```bash
docker logs ari-bot
# Debería mostrar "✅ Connected to Asterisk ARI"
```

### 5. Configurar Softphone

**Extensión 1001:**
- Usuario: 1001
- Contraseña: password1001
- Servidor: <IP_DEL_HOST>
- Puerto: 5060
- Transporte: UDP

**Extensión 1002:**
- Usuario: 1002
- Contraseña: password1002
- Servidor: <IP_DEL_HOST>
- Puerto: 5060
- Transporte: UDP

### 6. Realizar llamada de prueba

1. Registra el softphone con la extensión 1001
2. Marca: **1000**
3. El bot debería contestar automáticamente
4. Escucharás: "Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?"
5. Habla normalmente - el bot transcribirá y responderá

## 📊 Monitoreo

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs específicos
```bash
# ARI Bot
docker logs -f ari-bot

# Asterisk
docker logs -f asterisk

# STT
docker logs -f stt

# TTS
docker logs -f tts
```

### Logs de Asterisk en tiempo real
```bash
docker exec -it asterisk asterisk -rvvv
```

## 🔧 Troubleshooting

### Asterisk no inicia
```bash
# Revisar configuración
docker exec asterisk ls -la /etc/asterisk/

# Ver logs detallados
docker logs asterisk
```

### Bot no se conecta a ARI
```bash
# Verificar que ARI esté activo
docker exec asterisk asterisk -rx "http show status"

# Verificar credenciales en docker-compose.yml
```

### Sin audio en la llamada
```bash
# Verificar RTP
docker exec asterisk asterisk -rx "rtp show settings"

# Revisar puertos RTP (10000-20000)
ss -tulpn | grep asterisk
```

### STT no transcribe
```bash
# Test directo
docker exec -it stt bash
# Dentro del container, verificar el modelo

# Revisar logs
docker logs stt
```

### TTS no genera audio
```bash
# Test directo
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "prueba"}' \
  --output test.wav
  
# Reproducir
play test.wav  # o aplay test.wav
```

## 🎯 Pruebas funcionales

### Test 1: Llamada básica
1. Llamar a 1000
2. Verificar que contesta
3. Verificar saludo de bienvenida

### Test 2: Transcripción
1. Hablar claramente: "Hola, ¿cómo estás?"
2. Observar logs del bot para ver transcripción
3. Verificar que aparece en docker logs ari-bot

### Test 3: Respuesta n8n
1. Configurar n8n con el flujo incluido
2. Hacer pregunta
3. Verificar respuesta del IA

export OPENAI_API_KEY="tu-api-key"
```

### Test 4: Barge-in (interrupción)
1. Mientras el bot habla, interrumpir hablando
2. El bot debería detenerse
3. Debería procesar la nueva entrada

## 🛑 Detener servicios

```bash
# Detener todos los contenedores
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

## 📁 Estructura del proyecto

```
ari_sip_ai_bot_v2/
├── docker-compose.yml          # Orquestación de servicios
├── ari/                         # Bot ARI en Python
│   ├── Dockerfile
│   ├── ari_bot.py              # Código principal del bot
│   └── requirements.txt
├── asterisk/conf/               # Configuración de Asterisk
│   ├── pjsip.conf              # Configuración SIP
│   ├── extensions.conf         # Dialplan
│   ├── ari.conf                # Configuración ARI
│   ├── http.conf               # Servidor HTTP
│   ├── rtp.conf                # Configuración RTP
│   ├── modules.conf            # Módulos a cargar
│   ├── stasis.conf             # Configuración Stasis
│   └── logger.conf             # Configuración de logs
├── audiohub/                    # Scripts auxiliares
│   └── audiohub.py
├── n8n/                         # Flujos de n8n
│   └── voice-bot-flow.json
└── README.md                    # Esta documentación
```

## 🔑 Variables de entorno

Configuradas en `docker-compose.yml`:

- `ARI_URL`: URL del servidor ARI (default: http://127.0.0.1:8088)
- `ARI_USER`: Usuario ARI (default: ariuser)
- `ARI_PASS`: Contraseña ARI (default: aripass)
- `STT_URL`: URL del servicio STT (default: http://127.0.0.1:8000)
- `TTS_URL`: URL del servicio TTS (default: http://127.0.0.1:5002)
- `N8N_WEBHOOK`: URL del webhook n8n 

## 📝 Notas importantes

1. **Latencia**: El sistema está optimizado para baja latencia pero depends de la CPU
2. **GPU**: Para mejor rendimiento en STT/TTS, descomentar flags de GPU en docker-compose
3. **Producción**: Para producción, usar HTTPS/WSS y autenticación robusta
4. **Escalabilidad**: Cada servicios puede escalarse independientemente
5. **Red**: `network_mode: host` es necesario para RTP, ajustar para producción

## 🎤 Extensiones disponibles

- **1000**: Bot de voz con IA
- **1001-1002**: Extensiones SIP para pruebas entre softphones

## 📞 Llamar entre extensiones

1. Registra dos softphones (1001 y 1002)
2. Desde 1001, marca: 1002
3. Debería timbrar en 1002

## ⚡ Características implementadas

✅ Audio bidireccional
✅ STT en tiempo real (Whisper)
✅ TTS con Coqui
✅ Integración n8n
✅ Detección de barge-in
✅ Contexto conversacional
✅ Manejo de sesiones
✅ PJSIP configurado
✅ RTP configurado
✅ ARI WebSocket
✅ Reintentos automáticos

## 🔮 Próximas mejoras

- [ ] Grabación de llamadas
- [ ] Análisis de sentimiento
- [ ] Clonación de voz personalizada
- [ ] Soporte para múltiples idiomas
- [ ] WebRTC para llamadas browser
- [ ] Panel de administración web
- [ ] Métricas y monitoring (Prometheus/Grafana)
- [ ] Integración con CRM

## 📧 Soporte

Para problemas o preguntas:
1. Revisar logs: `docker-compose logs`
2. Verificar configuración de red y puertos
3. Consultar documentación de Asterisk ARI
