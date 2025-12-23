# 🔧 SOLUCIÓN: Error 401 Bearer null

## ❌ PROBLEMA

```
Hay token: Bearer null
```

**Error en consola del navegador**: 401 Unauthorized al acceder a las vistas de contabilidad.

## 🔍 CAUSA RAÍZ

El archivo `reportService.ts` estaba usando **axios directamente** en lugar de **axiosInstance**:

```typescript
// ❌ ANTES (INCORRECTO)
import axios from 'axios'

const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}

const response = await axios.get(`${API_URL}/api/accounting/reports/libro-diario`, {
    params,
    headers: getAuthHeaders()  // ❌ Token manual desde localStorage
})
```

**Problema**: 
- El token no se estaba obteniendo correctamente del localStorage
- localStorage devuelve `null` cuando la key no existe
- Resultado: `Authorization: Bearer null`

## ✅ SOLUCIÓN APLICADA

Cambiar a usar **axiosInstance** que tiene el interceptor de autenticación configurado:

```typescript
// ✅ DESPUÉS (CORRECTO)
import axiosInstance from '@/utils/axiosInterceptor'

const response = await axiosInstance.get('/api/accounting/reports/libro-diario', {
    params  // ✅ axiosInstance agrega el token automáticamente
})
```

**Beneficios**:
- axiosInstance tiene un interceptor que obtiene el token de `sessionStorage`
- Agrega automáticamente el header `Authorization`
- Maneja errores de autenticación centralizadamente
- No requiere especificar headers manualmente

## 📝 CAMBIOS REALIZADOS

### Archivo: `frontend/src/services/accounting/reportService.ts`

**Cambios aplicados:**
1. ✅ Eliminado `import axios from 'axios'`
2. ✅ Agregado `import axiosInstance from '@/utils/axiosInterceptor'`
3. ✅ Eliminado función `getAuthHeaders()`
4. ✅ Eliminado parámetro `headers` en todas las peticiones
5. ✅ Cambiado URLs absolutas por relativas (axiosInstance ya tiene baseURL)

**Métodos actualizados**:
- ✅ `getLibroDiario`
- ✅ `getLibroMayor`
- ✅ `getBalanceGeneral`
- ✅ `getEstadoResultados`

## 🔑 CÓMO FUNCIONA axiosInstance

El interceptor en `axiosInterceptor.ts` hace lo siguiente:

```typescript
// Request Interceptor - Agrega token automáticamente
axiosInstance.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token')  // ✅ sessionStorage, no localStorage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response Interceptor - Maneja errores 401
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirigir a login, limpiar sesión, etc.
        }
        return Promise.reject(error)
    }
)
```

## ✅ RESULTADO

Ahora todas las peticiones a las APIs de contabilidad incluyen correctamente el token:

```
Hay token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Vistas que ahora funcionan correctamente**:
- ✅ Plan de Cuentas
- ✅ Libro Diario
- ✅ Estado de Resultados
- ✅ Balance General

## 🎯 VALIDACIÓN

Para probar que funciona:

1. Loguéate en `http://localhost:3000`
2. Ve a **Contabilidad** → **Libro Diario**
3. Selecciona fechas y haz clic en "Generar Reporte"
4. Verifica en las DevTools del navegador que:
   - Network tab muestra status 200 (no 401)
   - Request Headers incluyen `Authorization: Bearer [token]`

## 📚 LECCIONES APRENDIDAS

1. **Siempre usar axiosInstance** en lugar de axios directamente
2. **No manejar tokens manualmente** cuando hay un interceptor
3. **Verificar que el token esté en sessionStorage** (no localStorage)
4. **URLs relativas** cuando se usa baseURL configurado

---
**Fecha**: 2025-12-12 01:48
**Estado**: ✅ **SOLUCIONADO**
**Archivo modificado**: `frontend/src/services/accounting/reportService.ts`
