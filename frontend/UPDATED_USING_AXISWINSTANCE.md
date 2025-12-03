# ✅ Actualizado: Usando axiosInstance (La librería que ya usas)

## 🎯 Cambios Realizados

He actualizado **TODOS** los archivos para usar `axiosInstance` en lugar de `httpClient`, que es la librería que ya estás usando en todo el proyecto.

---

## 📚 Archivos Actualizados

### 1. **Hook - `src/hooks/useSubscription.ts`**

```typescript
// ❌ ANTES
import httpClient from '@/lib/httpClient'
const response = await httpClient.get('/api/v1/plans/active', {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
})

// ✅ AHORA
import axiosInstance from '@/utils/axiosInterceptor'
const response = await axiosInstance.get('/api/v1/plans/active')
// Token se agrega automáticamente en el interceptor
```

**Todos los métodos actualizados:**
- `fetchActivePlans()` - GET
- `subscribeToPlan()` - POST
- `getActiveSubscription()` - GET
- `cancelSubscription()` - PATCH
- `renewSubscription()` - POST
- `changePlan()` - PATCH

### 2. **Dialog - `src/components/dialogs/CheckoutDialog.tsx`**

Removido import de `httpClient` (no lo usaba)

---

## 🔧 Cómo funciona `axiosInstance`

### Ubicación: `src/utils/axiosInterceptor.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Interceptor de REQUEST (automático)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('AuthToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  console.log(`[Request] ${config.method.toUpperCase()} ${config?.url}`, config)
  return config
})

// Interceptor de RESPONSE (automático)
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('[Response]', response)
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Ventajas:

✅ **Token automático** - No necesitas agregar headers manualmente
✅ **Logging automático** - Request y response se loguean en console
✅ **Manejo de 401** - Redirige al login si el token expira
✅ **Timeout** - 10 segundos por defecto
✅ **Consistente** - Mismo que usa products, solicitudes, etc.

---

## 📊 Comparación Antes/Después

### Hacer un GET

```typescript
// ❌ ANTES (httpClient)
const token = localStorage.getItem('AuthToken')
const response = await httpClient.get('/api/v1/plans/active', {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
})

// ✅ AHORA (axiosInstance)
const response = await axiosInstance.get('/api/v1/plans/active')
```

### Hacer un POST

```typescript
// ❌ ANTES
const token = localStorage.getItem('AuthToken')
const response = await httpClient.post(`/api/v1/subscriptions/users/${userId}/subscribe`, 
  { planId, isAutoRenew },
  { headers: token ? { Authorization: `Bearer ${token}` } : {} }
)

// ✅ AHORA
const response = await axiosInstance.post(`/api/v1/subscriptions/users/${userId}/subscribe`, 
  { planId, isAutoRenew }
)
```

---

## 🚀 Cómo Funciona el Flujo

```
1. Usuario hace login
   ↓
2. Backend devuelve JWT token
   ↓
3. Frontend guarda token en localStorage.AuthToken
   ↓
4. Hook useSubscription() hace request a fetchActivePlans()
   ↓
5. axiosInstance.get('/api/v1/plans/active')
   ↓
6. Interceptor REQUEST agrega: Authorization: Bearer {token}
   ↓
7. Backend recibe request y valida token
   ↓
8. Backend devuelve lista de planes
   ↓
9. Interceptor RESPONSE loguea la respuesta
   ↓
10. Hook actualiza estado con plans[]
   ↓
11. SelectPlanDialog se renderiza con los planes
```

---

## 📝 Ejemplos de Uso

### En SelectPlanDialog

```typescript
import { useSubscription } from '@/hooks/useSubscription'

const SelectPlanDialog = ({ open, onClose, onSelectPlan }) => {
  const { plans, loading, error, fetchActivePlans } = useSubscription()

  useEffect(() => {
    if (open && plans.length === 0) {
      fetchActivePlans() // Usa axiosInstance automáticamente
    }
  }, [open])

  return (
    // Dialog que muestra planes
  )
}
```

### En CheckoutDialog

```typescript
const handleCheckout = async (data) => {
  const { subscribeToPlan } = useSubscription() // Usa axiosInstance
  
  await subscribeToPlan(userId, planId, autoRenew)
  // Token se envía automáticamente via interceptor
}
```

---

## 🧪 Testing

### Verificar en Console del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Login → Account Setup → Selecciona Plan
4. Deberías ver:

```
[Request] GET /api/v1/plans/active
[Response] {...planes...}
[Request] POST /api/v1/subscriptions/users/1/subscribe
[Response] {...suscripción...}
```

### Verificar en Network Tab

1. Abre DevTools → Network
2. Haz el flujo completo
3. Verifica que todos los requests tengan:
   - ✅ Status: 200/201
   - ✅ Authorization header: `Bearer {token}`

---

## ✨ Consistencia del Proyecto

Ahora el proyecto usa **uniformemente** `axiosInstance` en:

- ✅ Products (`src/views/apps/products/list/ProductsListTable.tsx`)
- ✅ Solicitudes (`src/views/apps/solicitudes/components/page.tsx`)
- ✅ Type Device (`src/views/apps/typeDevice/list/TypeDeviceListTable.tsx`)
- ✅ Reports (`src/components/reports/ReporteMantenimientoV.tsx`)
- ✅ Dashboard (`src/views/apps/ecommerce/dashboard/*.tsx`)
- ✅ **Nuevos Planes y Suscripciones** ← TÚ ESTÁS AQUÍ

---

## 🔐 Seguridad

### Token Management

```typescript
// El token se obtiene de:
localStorage.getItem('AuthToken')

// Se guarda en login:
// Viene del backend en /api/v1/auth/login

// Se envía en cada request via interceptor:
config.headers['Authorization'] = `Bearer ${token}`

// Se limpia si expira:
if (error.response?.status === 401) {
  window.location.href = '/login' // Redirige al login
}
```

---

## 📞 Resumen

| Antes | Después |
|-------|---------|
| Importaba `httpClient` | Importa `axiosInstance` |
| Agregaba token manualmente | Token automático en interceptor |
| Inconsistente con el proyecto | Consistente con todo el proyecto |
| Requería headers adicionales | Sin headers adicionales |

---

## ✅ Checklist

- [x] Actualizar useSubscription.ts
- [x] Usar axiosInstance en lugar de httpClient
- [x] Remover headers manuales de token
- [x] Remover import innecesario en CheckoutDialog
- [x] Mantener misma funcionalidad
- [x] Consistente con rest del proyecto

---

**Estado:** ✅ LISTO PARA USAR
**Librería:** axiosInstance (Axios con interceptores)
**Token:** Automático en cada request
**Logging:** Automático en console

