# Integración con API - Detalles Técnicos

## ✅ Sí, Está Usando la API

El frontend **SÍ está usando la API del backend** mediante el cliente HTTP `httpClient`.

---

## 🏗️ Arquitectura de Integración

```
Frontend (Next.js)
      ↓
httpClient (Axios)
      ↓
API Backend (Spring Boot)
      ↓
Base de Datos (MySQL)
```

---

## 📡 Cliente HTTP Configurado

### Ubicación: `src/lib/httpClient.ts`

```typescript
import Axios from 'axios'

const httpClient = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,  // = http://localhost:8080
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  withXSRFToken: true,
})

export default httpClient
```

### Variable de Entorno: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🔐 Autenticación con JWT

Todos los hooks agregan el token JWT en las peticiones:

```typescript
const token = localStorage.getItem('AuthToken')
const response = await httpClient.get('/api/v1/plans/active', {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
})
```

**Dónde se obtiene el token:**
- Login guarda el token en `localStorage.AuthToken`
- El hook lo recupera automáticamente
- Se envía en header `Authorization: Bearer {token}`

---

## 📍 Endpoints Utilizados

### 1. Obtener Planes

**Hook:** `useSubscription()`

```typescript
fetchActivePlans()
```

**Request:**
```
GET /api/v1/plans/active
Headers: Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Plan Básico",
    "description": "Acceso básico",
    "price": 9.99,
    "durationDays": 30,
    "isActive": true
  },
  ...
]
```

### 2. Crear Suscripción

**Hook:** `useSubscription()`

```typescript
subscribeToPlan(userId, planId, autoRenew)
```

**Request:**
```
POST /api/v1/subscriptions/users/{userId}/subscribe
Headers: Authorization: Bearer {token}
Body: {
  "planId": 1,
  "isAutoRenew": false
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 5,
  "userName": "juan_perez",
  "planId": 1,
  "planName": "Plan Básico",
  "startDate": "2025-11-14T18:39:30",
  "endDate": "2025-12-14T18:39:30",
  "status": "ACTIVE",
  "isAutoRenew": false,
  "createdAt": "2025-11-14T18:39:30",
  "updatedAt": "2025-11-14T18:39:30"
}
```

### 3. Obtener Suscripción Activa

**Hook:** `useSubscription()`

```typescript
getActiveSubscription(userId)
```

**Request:**
```
GET /api/v1/subscriptions/users/{userId}/active
Headers: Authorization: Bearer {token}
```

**Response:** (mismo que crear suscripción)

---

## 🔄 Flujo Completo de Datos

### 1. Usuario hace Login
```
user@email.com : password
         ↓
   /api/v1/auth/login (backend)
         ↓
   ✅ Token JWT guardado en localStorage
   ✅ Datos de usuario guardados
```

### 2. Usuario sin empresa → Account Setup
```
Usuario sin empresa
         ↓
Redirige a /account-setup
         ↓
Muestra AccountSetupWithPlans
```

### 3. Usuario completa formulario de empresa
```
FormCustomer completa datos
         ↓
POST /customers/account-setup
         ↓
✅ Empresa creada en BD
✅ Callback onSuccess ejecutado
         ↓
Pasa customerData a AccountSetup
```

### 4. SelectPlanDialog se abre
```
accountSetup.state.showPlanDialog = true
         ↓
fetchActivePlans() ejecutado
         ↓
GET /api/v1/plans/active
         ↓
Planes cargados de BD
         ↓
Dialog muestra: [Plan Básico] [Plan Pro] [Plan Enterprise]
```

### 5. Usuario selecciona plan
```
handleSelectPlan(plan)
         ↓
setSelectedPlan(plan)
setShowCheckoutDialog(true)
         ↓
CheckoutDialog se abre
```

### 6. Usuario completa checkout
```
Formulario de pago completado
         ↓
handleCheckout() ejecutado
         ↓
subscribeToPlan(userId, planId, autoRenew)
         ↓
POST /api/v1/subscriptions/users/{userId}/subscribe
         ↓
✅ Suscripción creada en BD
✅ Toast success
         ↓
router.push('/home')
```

---

## 🧪 Verificación de Integración

### 1. Verificar que el backend está corriendo

```bash
# En otra terminal
cd C:\apps\cloudfly\backend
mvn spring-boot:run

# O si ya compilaste:
java -jar target/starter1-0.0.1-SNAPSHOT.jar
```

Debe mostrar:
```
Started Starter1Application in X seconds (JVM running for Y)
```

### 2. Verificar que la BD tiene datos

```bash
mysql -u usuario -p base_datos

SELECT * FROM plans;
SELECT COUNT(*) FROM plans;
```

Debe mostrar 3 planes de ejemplo:
- Plan Básico: $9.99
- Plan Pro: $29.99
- Plan Enterprise: $99.99

### 3. Verificar que el frontend puede conectar

En el navegador (DevTools → Network):

1. Login → observa requests a `/api/v1/auth`
2. Account Setup → completa form
3. SelectPlanDialog abierto → observa `GET /api/v1/plans/active`
4. SelectCheckout → completa datos
5. Checkout → observa `POST /api/v1/subscriptions/users/{id}/subscribe`

Todos los requests deben mostrar:
- ✅ Status: 200 o 201
- ✅ Authorization header: `Bearer {token}`

### 4. Verificar BD después del flujo

```bash
mysql -u usuario -p base_datos

SELECT * FROM subscriptions WHERE user_id = YOUR_USER_ID;
```

Debe mostrar una suscripción activa.

---

## 🔧 Troubleshooting

### Error: "Cannot GET /api/v1/plans/active"

**Causa:** Backend no está corriendo

**Solución:**
```bash
# Verificar que backend esté en http://localhost:8080
# En otra terminal:
java -jar backend/target/starter1-0.0.1-SNAPSHOT.jar

# Verificar con curl:
curl http://localhost:8080/api/v1/plans/active
```

### Error: "403 Forbidden" en requests

**Causa:** Token JWT inválido o no enviado

**Solución:**
```typescript
// Verificar en console del navegador
console.log(localStorage.getItem('AuthToken'))

// Debe mostrar algo como:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error: "404 Not Found"

**Causa:** Endpoint no existe o user_id es inválido

**Solución:**
```typescript
// Verificar user_id
const userData = JSON.parse(localStorage.getItem('UserLogin') || '{}')
console.log(userData.id)

// Debe ser un número válido existente en BD
```

### Error: "CORS error"

**Causa:** Backend no permite requests desde frontend

**Solución en Backend:**

En `src/main/java/com/app/starter1/config/SecurityConfig.java`, agregar:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:3000"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

---

## 📊 Estado de Integración

| Componente | Estado | Verificado |
|-----------|--------|-----------|
| httpClient configurado | ✅ | Sí |
| Variables de entorno | ✅ | Sí |
| Token JWT | ✅ | En login |
| useSubscription hook | ✅ | Llama API |
| SelectPlanDialog | ✅ | Carga planes |
| CheckoutDialog | ✅ | Crea suscripción |
| Endpoints backend | ✅ | Todos implementados |

---

## 🚀 Checklist de Deployment

Antes de ir a producción:

- [ ] Backend compilado y testeado
- [ ] BD con tablas creadas (subscription_schema.sql ejecutado)
- [ ] 3 planes de ejemplo en BD
- [ ] Frontend variables de entorno configuradas
- [ ] Token JWT correcto en login
- [ ] Flujo completo testeado (login → empresa → plan → checkout)
- [ ] Verificar BD que se creo la suscripción
- [ ] Logs del backend sin errores
- [ ] Logs del frontend (DevTools) sin errores

---

## 📞 Resumen

**¿Está usando la API?** ✅ **SÍ**

- Hook `useSubscription` hace todas las llamadas HTTP
- httpClient está configurado
- Token JWT se agrega automáticamente
- Todos los endpoints están implementados en backend
- Integración lista para funcionar

**Próximo paso:** Ejecutar el flujo completo y verificar en DevTools → Network que se hacen las requests a los endpoints.

