# Integración del Sistema de Suscripciones - Frontend

## 📋 Descripción General

Este documento explica cómo integrar el nuevo sistema de suscripciones con selección de planes y checkout al flujo de creación de empresas en el frontend.

## 🎯 Flujo Completo

```
Login sin empresa
    ↓
Account Setup (Crear Empresa)
    ↓ (Empresa creada exitosamente)
Select Plan Dialog (Elegir plan)
    ↓ (Plan seleccionado)
Checkout Dialog (Procesar pago + crear suscripción)
    ↓ (Pago completado)
Home (/home)
```

## 📦 Archivos Creados

### 1. **Hook - `src/hooks/useSubscription.ts`** (156 líneas)
- Maneja toda la lógica de suscripciones
- Métodos: fetchActivePlans, subscribeToPlan, getActiveSubscription, etc.
- Integración con el API backend

**Funciones disponibles:**
```typescript
const {
  plans,                      // Array de planes disponibles
  loading,                    // Estado de carga
  error,                      // Mensajes de error
  fetchActivePlans,           // GET /api/v1/plans/active
  subscribeToPlan,            // POST /api/v1/subscriptions/users/{id}/subscribe
  getActiveSubscription,      // GET /api/v1/subscriptions/users/{id}/active
  cancelSubscription,         // PATCH /api/v1/subscriptions/{id}/cancel
  renewSubscription,          // POST /api/v1/subscriptions/{id}/renew
  changePlan                  // PATCH /api/v1/subscriptions/{id}/change-plan/{planId}
} = useSubscription()
```

### 2. **Component - `src/components/dialogs/SelectPlanDialog.tsx`** (160 líneas)
- Dialog para mostrar planes disponibles
- Selección interactiva con preview
- Carga automática de planes
- Validaciones

**Props:**
```typescript
interface SelectPlanDialogProps {
  open: boolean              // Controlar apertura del dialog
  onClose: () => void        // Callback al cerrar
  onSelectPlan: (plan) => void  // Callback al seleccionar plan
  loading?: boolean          // Estado de carga externo
}
```

**Características:**
- ✓ Grid responsivo (1-2 columnas)
- ✓ Indicación visual de plan seleccionado
- ✓ Información de precio y duración
- ✓ Manejo de errores
- ✓ Loading states

### 3. **Component - `src/components/dialogs/CheckoutDialog.tsx`** (308 líneas)
- Dialog para procesar pagos
- Formulario de tarjeta de crédito
- Resumen de compra
- Creación de suscripción

**Props:**
```typescript
interface CheckoutDialogProps {
  open: boolean              // Controlar apertura
  onClose: () => void        // Callback al cerrar
  plan: Plan | null          // Plan seleccionado
  userId: number             // ID del usuario
  customerName?: string      // Nombre de la empresa (opcional)
}
```

**Formulario incluye:**
- Email (validación)
- Número de tarjeta (13-19 dígitos)
- Nombre del titular
- Fecha de vencimiento (MM/YY)
- CVV (3-4 dígitos)

**Características:**
- ✓ Validación con React Hook Form
- ✓ Resumen del plan a contratar
- ✓ Simulación de pago (sin procesamiento real)
- ✓ Creación de suscripción en backend
- ✓ Redirección a home al finalizar

### 4. **Component - `src/views/pages/auth/AccountSetupWithPlans.tsx`** (120 líneas)
- Versión mejorada de AccountSetup
- Integración de todos los diálogos
- Estado compartido entre componentes

**Estados:**
- `form` - Mostrar formulario de empresa
- `plan` - Mostrar diálogos de planes y checkout
- `checkout` - Checkout activo

## 🔧 Instrucciones de Integración

### Paso 1: Actualizar la página de account-setup

Opción A: **Reemplazar completamente** (Más limpio)

Edita `src/app/(blank-layout-pages)/account-setup/page.tsx`:

```typescript
'use client'

import AccountSetupWithPlans from '@/views/pages/auth/AccountSetupWithPlans'

const AccountSetupPage = () => {
  return (
    <div className='flex flex-col justify-center items-center min-bs-[80dvh] p-6'>
      <AccountSetupWithPlans />
    </div>
  )
}

export default AccountSetupPage
```

Opción B: **Mantener personalización** (Más flexible)

Modifica `src/views/pages/auth/AccountSetup.tsx` para agregar:

```typescript
'use client'

import { useState } from 'react'
import SelectPlanDialog from '@/components/dialogs/SelectPlanDialog'
import CheckoutDialog from '@/components/dialogs/CheckoutDialog'

const AccountSetup = () => {
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [customer, setCustomer] = useState(null)

  const handleFormSuccess = (customerData) => {
    setCustomer(customerData)
    setShowPlanDialog(true)
  }

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setShowPlanDialog(false)
    setShowCheckoutDialog(true)
  }

  return (
    <>
      {/* Tu contenido existente */}
      <FormCustomer onSuccess={handleFormSuccess} />

      <SelectPlanDialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        onSelectPlan={handleSelectPlan}
      />

      {customer && (
        <CheckoutDialog
          open={showCheckoutDialog}
          onClose={() => setShowCheckoutDialog(false)}
          plan={selectedPlan}
          userId={customer.id}
          customerName={customer.name}
        />
      )}
    </>
  )
}
```

### Paso 2: Actualizar FormCustomer

El componente `FormCustomer` necesita llamar `onSuccess` después de crear la empresa.

Edita `src/views/apps/customers/form/page.tsx`:

```typescript
interface FormCustomerProps {
  onSuccess?: (customer: { id: number; name: string; email: string }) => void
}

const FormCustomer = ({ onSuccess }: FormCustomerProps) => {
  const handleSubmit = async (data) => {
    try {
      const response = await apiClient.post(...)
      
      if (onSuccess) {
        onSuccess({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email
        })
      }
      
      // Tu lógica existente...
    } catch (err) {
      // Manejo de error
    }
  }
  
  // ... resto del componente
}
```

### Paso 3: Verificar la configuración de httpClient

Asegúrate de que `src/lib/httpClient.ts` esté correctamente configurado:

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('AuthToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Paso 4: Configurar variable de entorno

En `src/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🧪 Pruebas

### Test del Hook `useSubscription`

```typescript
import { useSubscription } from '@/hooks/useSubscription'

const TestComponent = () => {
  const { plans, loading, fetchActivePlans } = useSubscription()

  useEffect(() => {
    fetchActivePlans()
  }, [])

  return (
    <div>
      {loading && <p>Cargando planes...</p>}
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>${plan.price}</p>
        </div>
      ))}
    </div>
  )
}
```

### Test de Flujo Completo

1. Login con usuario sin empresa
2. Redirige a `/account-setup`
3. Completa formulario de empresa
4. Se abre SelectPlanDialog
5. Selecciona un plan
6. Se abre CheckoutDialog
7. Completa datos de pago (simples números como `1111 1111 1111 1111`)
8. Click "Pagar"
9. Suscripción se crea en backend
10. Redirige a `/home`

## 🔌 Integración con Stripe (Opcional - Futuro)

Cuando quieras integrar pagos reales con Stripe:

```bash
npm install stripe @stripe/react-stripe-js @stripe/stripe-js
```

Reemplaza la lógica en `CheckoutDialog`:

```typescript
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// 1. Obtener cliente de Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)

// 2. Procesar pago
const stripe = useStripe()
const { token } = await stripe.createToken(cardElement)

// 3. Enviar token al backend para procesar pago
await apiClient.post('/api/v1/payments/process', {
  token: token.id,
  amount: plan.price,
  currency: 'USD',
  userId: userId
})
```

## 🎨 Personalización

### Cambiar colores del Dialog

En `SelectPlanDialog.tsx`:

```typescript
borderColor: selectedPlan?.id === plan.id ? 'success.main' : 'divider', // Cambiar primary.main
bgcolor: selectedPlan?.id === plan.id ? 'success.lighter' : 'background.paper',
```

### Agregar más campos al checkout

En `CheckoutDialog.tsx`:

```typescript
interface CheckoutFormData {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
  email: string
  billingAddress?: string  // Nuevo
  city?: string            // Nuevo
}
```

### Cambiar redirección post-checkout

En `CheckoutDialog.tsx`:

```typescript
// Cambiar de:
router.push('/home')

// A:
router.push(`/dashboard/empresa/${customer.id}`)
```

## ⚠️ Consideraciones Importantes

1. **Validación de Token**: El hook asume que el token JWT existe en `localStorage.AuthToken`
2. **Manejo de Errores**: Los errores se muestran con `toast` (react-toastify)
3. **Pago Simulado**: CheckoutDialog NO procesa pagos reales, solo simula
4. **Suscripción Automática**: Se crea suscripción inmediatamente sin procesamiento de pago real
5. **CORS**: Asegúrate de que el backend permita requests desde el frontend

## 🚀 Próximos Pasos

1. ✓ Integración con Stripe/PayPal
2. ✓ Validación de tarjeta en tiempo real
3. ✓ Webhooks para confirmación de pago
4. ✓ Página de planes (sin login)
5. ✓ Dashboard de suscripción actual
6. ✓ Cambio de plan sin cancelar
7. ✓ Renovación automática
8. ✓ Historial de facturación

## 📞 Soporte

Si encuentras errores:

1. Verifica que el backend esté corriendo en `http://localhost:8080`
2. Verifica las tablas de BD (`plans` y `subscriptions`)
3. Revisa la consola del navegador (DevTools > Console)
4. Revisa los logs del backend

---

**Última actualización:** 2025-11-14
