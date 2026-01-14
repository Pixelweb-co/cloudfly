# ARI Voice Bot - API Documentation

## Overview

ARI Voice Bot es un sistema completo de bot telefónico con IA en tiempo real que permite:
- **Llamadas entrantes (Inbound)**: Responder automáticamente cuando alguien llama
- **Llamadas salientes (Outbound)**: Iniciar llamadas programáticamente vía API REST
- **Conversación bidireccional** con Speech-to-Text (STT) y Text-to-Speech (TTS)
- **Barge-in**: Capacidad de interrumpir al bot mientras habla
- **Integración con n8n**: Para lógica de agente IA personalizada

## Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Softphone  │◄───────►│   Asterisk   │◄───────►│   ARI Bot   │
│   (SIP)     │         │  (PJSIP/ARI) │         │  + API REST │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                        ┌────────────────────────────────┼──────────┐
                        │                                │          │
                   ┌────▼────┐                      ┌────▼────┐ ┌──▼───┐
                   │   STT   │                      │   TTS   │ │ n8n  │
                   │(Whisper)│                      │ (Coqui) │ │Agent │
                   └─────────┘                      └─────────┘ └──────┘
```

## Componentes

### 1. **Asterisk**
- Motor de telefonía VoIP
- Maneja conexiones SIP/PJSIP
- Puerto 5060 (UDP/TCP) para señalización SIP
- Puertos 10000-10100 (UDP) para RTP (audio)
- Puerto 8088 para API ARI

### 2. **ARI Bot**
- Bot principal que maneja llamadas
- Procesa audio en tiempo real (RTP)
- Puerto 5000 para API REST (nuevas llamadas salientes)

### 3. **STT (Speech-to-Text)**
- Servicio faster-whisper con GPU
- Puerto 8000
- Modelo: `base` optimizado para español

### 4. **TTS (Text-to-Speech)**
- Coqui TTS con voz femenina (Tacotron2-DDC)
- Puerto 5002
- Voz: Laura (español, femenina)

### 5. **n8n**
- Orquestador de workflows
- Webhook para procesamiento de IA
- URL: `https://autobot.cloudfly.com.co/webhook/telefono-ia`

---

## API REST Endpoints

### Base URL
```
http://localhost:5000
```

### 1. Health Check

**Endpoint:** `GET /health`

**Descripción:** Verificar el estado del servicio

**Response:**
```json
{
  "status": "healthy",
  "service": "ari-bot-api",
  "active_calls": 2
}
```

---

### 2. Iniciar Llamada Saliente

**Endpoint:** `POST /call`

**Descripción:** Inicia una llamada automatizada a un número específico con contexto personalizado

**Request Body:**
```json
{
  "number": "1003",
  "customer_name": "Edwin",
  "agent_context": "Cobro de factura 2025 por valor de $25,000. Vencimiento: 15 de enero.",
  "tenant_id": "empresa_abc",
  "subject": "Recordatorio de pago"
}
```

**Parámetros:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `number` | string | ✅ | Extensión o número a llamar (ej: "1003") |
| `customer_name` | string | ✅ | Nombre del cliente para personalización |
| `agent_context` | string | ✅ | Contexto/instrucciones para el agente IA |
| `tenant_id` | string | ❌ | Identificador de tenant/empresa (default: "default") |
| `subject` | string | ❌ | Asunto/propósito de la llamada |

**Response (201 Created):**
```json
{
  "success": true,
  "call_id": "outbound_empresa_abc_1736780345",
  "channel_id": "1736780345.42",
  "status": "ringing",
  "number": "1003",
  "message": "Call initiated to 1003 for Edwin"
}
```

**Códigos de Estado:**
- `201`: Llamada iniciada exitosamente
- `400`: Parámetros faltantes o inválidos
- `500`: Error del servidor o Asterisk

---

### 3. Obtener Estado de Llamada

**Endpoint:** `GET /call/{call_id}`

**Descripción:** Consultar el estado actual de una llamada

**Parámetros:**
- `call_id`: ID de la llamada (obtenido al iniciar la llamada)

**Response (200 OK):**
```json
{
  "call_id": "outbound_empresa_abc_1736780345",
  "number": "1003",
  "customer_name": "Edwin",
  "status": "in_progress",
  "channel_id": "1736780345.42",
  "duration": 45,
  "tenant_id": "empresa_abc",
  "subject": "Recordatorio de pago"
}
```

**Estados Posibles:**
- `initiating`: Iniciando llamada
- `ringing`: Sonando en el destino
- `answered`: Llamada contestada
- `in_progress`: En conversación
- `ended`: Llamada finalizada
- `failed`: Falló al conectar

**Códigos de Estado:**
- `200`: Estado obtenido correctamente
- `404`: Llamada no encontrada

---

### 4. Colgar Llamada

**Endpoint:** `POST /call/{call_id}/hangup`

**Descripción:** Terminar una llamada activa

**Parámetros:**
- `call_id`: ID de la llamada a terminar

**Response (200 OK):**
```json
{
  "success": true,
  "call_id": "outbound_empresa_abc_1736780345",
  "message": "Call terminated"
}
```

**Códigos de Estado:**
- `200`: Llamada terminada exitosamente
- `400`: Llamada no conectada aún
- `404`: Llamada no encontrada
- `500`: Error al colgar

---

### 5. Listar Llamadas Activas

**Endpoint:** `GET /calls`

**Descripción:** Obtener lista de todas las llamadas activas

**Response (200 OK):**
```json
{
  "total": 2,
  "calls": [
    {
      "call_id": "outbound_empresa_abc_1736780345",
      "number": "1003",
      "customer_name": "Edwin",
      "status": "in_progress",
      "duration": 120,
      "tenant_id": "empresa_abc"
    },
    {
      "call_id": "outbound_empresa_xyz_1736780567",
      "number": "1002",
      "customer_name": "Maria",
      "status": "ringing",
      "duration": 5,
      "tenant_id": "empresa_xyz"
    }
  ]
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Llamada de Cobranza

```bash
curl -X POST http://localhost:5000/call \
  -H "Content-Type: application/json" \
  -d '{
    "number": "1003",
    "customer_name": "Edwin Ramirez",
    "agent_context": "Hola Edwin, te llamamos para recordarte que tienes una factura pendiente número 2025 por valor de $25,000 pesos. El vencimiento es el 20 de enero. ¿Podrías confirmar si realizarás el pago pronto?",
    "tenant_id": "cobranzas_2025",
    "subject": "Recordatorio factura 2025"
  }'
```

### Ejemplo 2: Recordatorio de Cita

```bash
curl -X POST http://localhost:5000/call \
  -H "Content-Type: application/json" \
  -d '{
    "number": "1002",
    "customer_name": "Maria Lopez",
    "agent_context": "Hola Maria, te recordamos que tienes una cita médica programada para mañana a las 10:00 AM en la Clínica Central. Por favor confirma tu asistencia.",
    "tenant_id": "clinica_central",
    "subject": "Recordatorio de cita médica"
  }'
```

### Ejemplo 3: Encuesta de Satisfacción

```bash
curl -X POST http://localhost:5000/call \
  -H "Content-Type: application/json" \
  -d '{
    "number": "1001",
    "customer_name": "Carlos",
    "agent_context": "Hola Carlos, recientemente compraste en nuestra tienda. Nos gustaría saber cómo fue tu experiencia. Del 1 al 10, ¿qué calificación le darías a nuestro servicio?",
    "tenant_id": "tienda_online",
    "subject": "Encuesta de satisfacción"
  }'
```

---

## Configuración

### Variables de Entorno

```bash
# Asterisk ARI
ARI_URL=http://asterisk:8088
ARI_USER=ariuser
ARI_PASS=aripass

# Servicios
STT_URL=http://stt:8000
TTS_URL=http://tts:5002
N8N_WEBHOOK=https://autobot.cloudfly.com.co/webhook/telefono-ia

# API
API_PORT=5000
```

### Extensiones SIP Disponibles

Configuradas en `asterisk/conf/pjsip.conf`:

| Extensión | Usuario | Password | Descripción |
|-----------|---------|----------|-------------|
| 1001 | 1001 | password1001 | Usuario de prueba 1 |
| 1002 | 1002 | password1002 | Usuario de prueba 2 |
| 1003 | 1003 | password1003 | Usuario de prueba 3 |
| 2000 | - | - | Extensión del bot (para llamadas entrantes) |

---

## Instalación y Despliegue

### Requisitos

- Docker y Docker Compose
- GPU NVIDIA con soporte CUDA (opcional, para STT/TTS acelerado)
- Puertos disponibles: 5000, 5060, 8000, 5002, 8088, 10000-10100

### Pasos

1. **Clonar el repositorio o preparar archivos**
```bash
cd /ruta/a/ari_sip_ai_bot_v2
```

2. **Iniciar todos los servicios**
```bash
docker-compose up -d --build
```

3. **Verificar que los servicios estén corriendo**
```bash
docker-compose ps
```

Deberías ver:
- `asterisk` - running
- `ari-bot` - running
- `stt` - running
- `tts` - running

4. **Verificar la API**
```bash
curl http://localhost:5000/health
```

5. **Ver logs del bot**
```bash
docker logs ari-bot -f
```

---

## Integración con n8n

### Workflow de Agente

El bot envía cada mensaje del usuario a n8n vía webhook con este formato:

**Request a n8n:**
```json
{
  "call_id": "1736780345.42",
  "caller": "1003",
  "text": "Hola, recibí tu mensaje sobre la factura",
  "context": {
    "customer_name": "Edwin",
    "agent_context": "Cobro de factura 2025...",
    "tenant_id": "empresa_abc"
  }
}
```

**Response esperado de n8n:**
```json
{
  "call_id": "1736780345.42",
  "response": "Perfecto Edwin, gracias por confirmar. ¿Cuándo podrías realizar el pago?",
  "timestamp": "2026-01-13T12:00:00Z"
}
```

El bot toma el campo `response` (o `text` o `output`) y lo convierte a voz.

---

## Troubleshooting

### El bot no responde

1. Verificar logs:
```bash
docker logs ari-bot --tail 100
```

2. Verificar conectividad con Asterisk:
```bash
docker exec ari-bot curl http://asterisk:8088/ari/asterisk/info -u ariuser:aripass
```

3. Verificar STT/TTS:
```bash
# STT
curl http://localhost:8000/health

# TTS
curl http://localhost:5002/
```

### No se escucha audio

1. Verificar formato de audio generado (debe ser 8000Hz):
```bash
docker exec ari-bot ls -lh /tmp/audio/
```

2. Verificar configuración de red en `pjsip.conf`
3. Verificar puertos RTP (10000-10100)

### API no responde

1. Verificar que el puerto 5000 esté expuesto:
```bash
docker-compose ps ari-bot
```

2. Verificar logs:
```bash
docker logs ari-bot | grep "Starting ARI Bot API"
```

---

## Casos de Uso

### 1. Sistema de Cobranzas Automatizado
- **Agente:** Llama a clientes con facturas vencidas
- **Context:** Información de factura, monto, vencimiento
- **Objetivo:** Recordar pago y programar fecha de pago

### 2. Recordatorios de Citas
- **Agente:** Llama 24h antes de citas médicas/servicios
- **Context:** Fecha, hora, lugar, especialista
- **Objetivo:** Confirmar asistencia o reprogramar

### 3. Encuestas Post-Venta
- **Agente:** Llama después de una compra
- **Context:** Producto comprado, fecha
- **Objetivo:** Obtener calificación y feedback

### 4. Seguimiento de Leads
- **Agente:** Llama a prospectos interesados
- **Context:** Producto de interés, origen del lead
- **Objetivo:** Calificar interés y agendar demostración

### 5. Notificaciones de Emergencia
- **Agente:** Alertas masivas a usuarios
- **Context:** Tipo de emergencia, instrucciones
- **Objetivo:** Informar y obtener confirmación de recepción

---

## Mejores Prácticas

### 1. Diseño del `agent_context`

✅ **Bueno:**
```json
{
  "agent_context": "Hola María, te llamo de la Clínica del Norte. Tienes una cita con el Dr. Pérez mañana a las 3 PM. ¿Confirmas tu asistencia?"
}
```

❌ **Malo:**
```json
{
  "agent_context": "Cita"
}
```

### 2. Manejo de Errores

Siempre verificar el `status_code` y manejar errores:

```python
response = requests.post('http://localhost:5000/call', json=data)
if response.status_code == 201:
    call_id = response.json()['call_id']
    print(f"Llamada iniciada: {call_id}")
else:
    print(f"Error: {response.json()}")
```

### 3. Rate Limiting

Evitar saturar Asterisk con muchas llamadas simultáneas:
- Máximo recomendado: 10 llamadas concurrentes
- Usar un scheduler para distribuir llamadas

### 4. Monitoreo

Implementar monitoreo de:
- Tasa de éxito de llamadas
- Duración promedio
- Errores de conexión
- Uso de recursos (CPU/GPU)

---

## Seguridad

### Autenticación (Recomendado para Producción)

Agregar autenticación a la API:

```python
from flask import request
import os

API_KEY = os.getenv('API_KEY', 'changeme')

@app.before_request
def check_auth():
    if request.endpoint != 'health':
        api_key = request.headers.get('X-API-Key')
        if api_key != API_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
```

### Firewall

Limitar acceso al puerto 5000 solo desde IPs confiables:

```bash
# Ejemplo con iptables
iptables -A INPUT -p tcp --dport 5000 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 5000 -j DROP
```

---

## Licencia

Este proyecto está bajo licencia MIT.

---

## Soporte

Para reportar problemas o solicitar funcionalidades:
- GitHub Issues
- Email: support@example.com

**Versión:** 2.0.0  
**Última actualización:** Enero 2026
