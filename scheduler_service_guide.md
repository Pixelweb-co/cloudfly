# 🚀 Guía del Servicio de Scheduler (WebFlux)

El servicio de Scheduler de CloudFly es ahora un **microservicio independiente** construido sobre **Spring WebFlux**, diseñado para ser altamente escalable y no bloqueante.

## 🏗️ Arquitectura Técnica

- **Framework**: Spring Boot 3.4.0 (WebFlux)
- **Base de Datos**: MySQL via **R2DBC** (Acceso reactivo)
- **Mensajería**: Apache Kafka (Reactor Kafka)
- **Comunicación**: WebClient (No bloqueante)
- **Despliegue**: Docker / Docker Compose

## 🛠️ Microservicios Relacionados

1. **Scheduler Service (Puerto 8085)**: Gestiona el calendario, eventos y la programación de tareas.
2. **Notification Service**: Consume mensajes de Kafka y envía correos (FreeMarker) o mensajes de WhatsApp (Evolution API).

## 📅 Tipos de Eventos Soportados

- `NOTIFICATION`: Envía una notificación programada.
- `REST_ACTION`: Realiza una llamada HTTP (POST/GET) a una URL externa.
- `WHATSAPP_CAMPAIGN`: Integración con campañas de marketing.

## 📡 Endpoints Principales

### 1. Crear un Evento
**POST** `/api/events`

**Ejemplo de Notificación por WhatsApp:**
```json
{
  "tenantId": 1,
  "companyId": 1,
  "calendarId": 1,
  "title": "Aviso de Cobro",
  "eventType": "NOTIFICATION",
  "startTime": "2026-04-26T21:00:00",
  "payload": "{\"to\": \"3115602559\", \"body\": \"Hola! Tienes un pago pendiente.\", \"type\": \"whatsapp\"}"
}
```

**Ejemplo de Notificación por Email con Branding:**
```json
{
  "tenantId": 1,
  "companyId": 1,
  "calendarId": 1,
  "title": "Bienvenida",
  "eventType": "NOTIFICATION",
  "startTime": "2026-04-26T21:00:00",
  "payload": "{\"to\": \"cliente@correo.com\", \"subject\": \"Hola!\", \"body\": \"Bienvenido a bordo.\", \"type\": \"notification\", \"templateData\": {\"companyName\": \"Mi Empresa Pro\"}}"
}
```

### 2. Listar Eventos
**GET** `/api/events?tenantId=1&companyId=1&startDate=2026-04-01T00:00:00&endDate=2026-04-30T23:59:59`

## 🔄 Recurrencia
El servicio soporta eventos recurrentes automáticos. Solo añade el campo `recurrence` al crear el evento:
- `DAILY`: Se repite cada día a la misma hora.
- `WEEKLY`: Se repite cada semana.
- `MONTHLY`: Se repite cada mes.

## 🚀 Despliegue en VPS (Docker)

El servicio está configurado en `docker-compose-full-vps.yml`:

```yaml
  scheduler-service:
    image: cloudfly-scheduler-service:latest
    container_name: scheduler-service
    ports:
      - "8085:8080"
    environment:
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - DB_HOST=mysql
      - DB_DATABASE=cloud_master
```

## 🔍 Monitoreo de Tareas
Puedes verificar el estado de las tareas programadas directamente en la base de datos:
```sql
SELECT * FROM scheduled_jobs ORDER BY execute_at DESC;
```
Estados posibles: `PENDING`, `RUNNING`, `DONE`, `FAILED`.

## 🛡️ Características Especiales
- **Búsqueda Dinámica de Canales**: El Notification Service busca automáticamente la instancia de WhatsApp configurada para cada empresa (`tenant_id`/`company_id`) antes de enviar.
- **Retry Automático**: Si una tarea falla, el scheduler intentará re-ejecutarla basándose en una estrategia de backoff exponencial.
