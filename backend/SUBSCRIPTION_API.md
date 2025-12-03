# Sistema de Suscripciones a Planes - Documentación

## Descripción General
Sistema completo de suscripciones que permite a los usuarios subscribirse a diferentes planes, renovar, cambiar de plan y gestionar sus suscripciones.

## Entidades Principales

### 1. Plan
- **Campos**: id, name, description, price, durationDays, isActive, createdAt, updatedAt
- **Propósito**: Definir los diferentes planes disponibles con precio y duración

### 2. Subscription
- **Campos**: id, user, plan, startDate, endDate, status, isAutoRenew, createdAt, updatedAt
- **Propósito**: Registrar la suscripción de un usuario a un plan
- **Estados**: ACTIVE, CANCELLED, EXPIRED, SUSPENDED, PENDING

### 3. SubscriptionStatus (Enum)
Estados posibles de una suscripción:
- **ACTIVE**: Suscripción activa y vigente
- **CANCELLED**: Cancelada por el usuario
- **EXPIRED**: Expirada (pasada la fecha de fin)
- **SUSPENDED**: Suspendida temporalmente
- **PENDING**: Pendiente de activación

## Endpoints de la API

### Gestión de Planes

#### 1. Crear un nuevo plan
```
POST /api/v1/plans
Content-Type: application/json

{
  "name": "Plan Pro",
  "description": "Plan profesional con todas las características",
  "price": 29.99,
  "durationDays": 30
}

Response (201 Created):
{
  "id": 1,
  "name": "Plan Pro",
  "description": "Plan profesional con todas las características",
  "price": 29.99,
  "durationDays": 30,
  "isActive": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}
```

#### 2. Obtener plan por ID
```
GET /api/v1/plans/{id}

Response (200 OK):
{
  "id": 1,
  "name": "Plan Pro",
  "description": "Plan profesional con todas las características",
  "price": 29.99,
  "durationDays": 30,
  "isActive": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}
```

#### 3. Obtener todos los planes activos
```
GET /api/v1/plans/active

Response (200 OK):
[
  {
    "id": 1,
    "name": "Plan Pro",
    "description": "Plan profesional...",
    "price": 29.99,
    "durationDays": 30,
    "isActive": true,
    "createdAt": "2025-11-14T10:30:00",
    "updatedAt": "2025-11-14T10:30:00"
  }
]
```

#### 4. Obtener todos los planes
```
GET /api/v1/plans

Response (200 OK):
[...array de planes...]
```

#### 5. Actualizar un plan
```
PUT /api/v1/plans/{id}
Content-Type: application/json

{
  "name": "Plan Pro Plus",
  "description": "Plan mejorado",
  "price": 39.99,
  "durationDays": 30
}

Response (200 OK):
{
  "id": 1,
  "name": "Plan Pro Plus",
  "description": "Plan mejorado",
  "price": 39.99,
  "durationDays": 30,
  "isActive": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T11:00:00"
}
```

#### 6. Cambiar estado de un plan (activar/desactivar)
```
PATCH /api/v1/plans/{id}/toggle-status

Response (200 OK):
{
  "id": 1,
  "name": "Plan Pro",
  "description": "...",
  "price": 29.99,
  "durationDays": 30,
  "isActive": false,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T11:00:00"
}
```

#### 7. Eliminar un plan
```
DELETE /api/v1/plans/{id}

Response (204 No Content)
```

---

### Gestión de Suscripciones

#### 1. Suscribirse a un plan
```
POST /api/v1/subscriptions/users/{userId}/subscribe
Content-Type: application/json

{
  "planId": 1,
  "isAutoRenew": true
}

Response (201 Created):
{
  "id": 1,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 1,
  "planName": "Plan Pro",
  "startDate": "2025-11-14T10:30:00",
  "endDate": "2025-12-14T10:30:00",
  "status": "ACTIVE",
  "isAutoRenew": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}

Errores posibles:
- Usuario no encontrado (404)
- Plan no encontrado (404)
- Usuario ya tiene suscripción activa (409)
```

#### 2. Obtener suscripción por ID
```
GET /api/v1/subscriptions/{id}

Response (200 OK):
{
  "id": 1,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 1,
  "planName": "Plan Pro",
  "startDate": "2025-11-14T10:30:00",
  "endDate": "2025-12-14T10:30:00",
  "status": "ACTIVE",
  "isAutoRenew": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}
```

#### 3. Obtener todas las suscripciones de un usuario
```
GET /api/v1/subscriptions/users/{userId}

Response (200 OK):
[
  {
    "id": 1,
    "userId": 5,
    "userName": "juan_perez",
    "planId": 1,
    "planName": "Plan Pro",
    "startDate": "2025-11-14T10:30:00",
    "endDate": "2025-12-14T10:30:00",
    "status": "ACTIVE",
    "isAutoRenew": true,
    "createdAt": "2025-11-14T10:30:00",
    "updatedAt": "2025-11-14T10:30:00"
  },
  {
    "id": 2,
    "userId": 5,
    "userName": "juan_perez",
    "planId": 2,
    "planName": "Plan Basic",
    "startDate": "2025-10-14T10:30:00",
    "endDate": "2025-11-14T10:30:00",
    "status": "EXPIRED",
    "isAutoRenew": false,
    "createdAt": "2025-10-14T10:30:00",
    "updatedAt": "2025-11-14T10:30:00"
  }
]
```

#### 4. Obtener suscripción activa de un usuario
```
GET /api/v1/subscriptions/users/{userId}/active

Response (200 OK):
{
  "id": 1,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 1,
  "planName": "Plan Pro",
  "startDate": "2025-11-14T10:30:00",
  "endDate": "2025-12-14T10:30:00",
  "status": "ACTIVE",
  "isAutoRenew": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T10:30:00"
}

Errores posibles:
- No hay suscripción activa (404)
```

#### 5. Cancelar una suscripción
```
PATCH /api/v1/subscriptions/{id}/cancel

Response (200 OK):
{
  "id": 1,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 1,
  "planName": "Plan Pro",
  "startDate": "2025-11-14T10:30:00",
  "endDate": "2025-12-14T10:30:00",
  "status": "CANCELLED",
  "isAutoRenew": false,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T11:00:00"
}
```

#### 6. Renovar una suscripción
```
POST /api/v1/subscriptions/{id}/renew

Response (200 OK):
{
  "id": 2,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 1,
  "planName": "Plan Pro",
  "startDate": "2025-11-14T11:00:00",
  "endDate": "2025-12-14T11:00:00",
  "status": "ACTIVE",
  "isAutoRenew": true,
  "createdAt": "2025-11-14T11:00:00",
  "updatedAt": "2025-11-14T11:00:00"
}
```

#### 7. Cambiar de plan
```
PATCH /api/v1/subscriptions/{id}/change-plan/{planId}

Response (200 OK):
{
  "id": 1,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 2,
  "planName": "Plan Premium",
  "startDate": "2025-11-14T10:30:00",
  "endDate": "2025-12-14T10:30:00",
  "status": "ACTIVE",
  "isAutoRenew": true,
  "createdAt": "2025-11-14T10:30:00",
  "updatedAt": "2025-11-14T11:05:00"
}
```

#### 8. Obtener suscripciones por estado
```
GET /api/v1/subscriptions/status/{status}

Donde {status} puede ser: ACTIVE, CANCELLED, EXPIRED, SUSPENDED, PENDING

Response (200 OK):
[...array de suscripciones con ese estado...]
```

---

## Ejemplo de Flujo Completo

### 1. Crear planes disponibles
```bash
curl -X POST http://localhost:8080/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan Básico", "description": "Acceso básico", "price": 9.99, "durationDays": 30}'

curl -X POST http://localhost:8080/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan Pro", "description": "Acceso completo", "price": 29.99, "durationDays": 30}'
```

### 2. Usuario se suscribe a un plan
```bash
curl -X POST http://localhost:8080/api/v1/subscriptions/users/5/subscribe \
  -H "Content-Type: application/json" \
  -d '{"planId": 1, "isAutoRenew": false}'
```

### 3. Verificar suscripción activa
```bash
curl -X GET http://localhost:8080/api/v1/subscriptions/users/5/active \
  -H "Content-Type: application/json"
```

### 4. Cambiar de plan
```bash
curl -X PATCH http://localhost:8080/api/v1/subscriptions/1/change-plan/2 \
  -H "Content-Type: application/json"
```

### 5. Cancelar suscripción
```bash
curl -X PATCH http://localhost:8080/api/v1/subscriptions/1/cancel \
  -H "Content-Type: application/json"
```

---

## Base de Datos - Scripts SQL

### Crear tablas (si no existen)

```sql
-- Tabla de planes
CREATE TABLE plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

-- Tabla de suscripciones
CREATE TABLE subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_auto_renew BOOLEAN DEFAULT false,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Índices para mejorar performance
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_plans_active ON plans(is_active);
```

---

## Notas de Implementación

1. **Validación**: Todos los DTOs incluyen validaciones con Jakarta Validation
2. **Transaccionalidad**: Todos los servicios están marcados con `@Transactional`
3. **Manejo de errores**: Se lanzan excepciones RuntimeException que deben ser manejadas por un `@ControllerAdvice` global
4. **Auto-renovación**: El campo `isAutoRenew` indica si la suscripción debe renovarse automáticamente
5. **Fechas**: Todas las fechas se manejan con `LocalDateTime` en UTC

---

## Posibles Mejoras Futuras

1. Implementar manejador de excepciones global (`@ControllerAdvice`)
2. Agregar auditoría a las suscripciones
3. Implementar pagos (integración con Stripe, PayPal, etc.)
4. Crear tareas programadas para renovación automática
5. Agregar eventos Kafka para notificaciones
6. Implementar roles y permisos para acceso a endpoints
7. Agregar paginación en listados
8. Implementar softdelete para planes
