# ✅ OAuth Facebook Messenger - Implementación Completa

## 🎯 Lo que se implementó

### **Backend**

#### 1. `FacebookOAuthController.java` ✅
**Ubicación:** `backend/src/main/java/com/app/starter1/controllers/FacebookOAuthController.java`

**Endpoints:**
```java
GET  /api/channels/facebook/auth-url     // Genera URL de autorización
GET  /api/channels/facebook/callback     // Recibe callback de Facebook
```

**Flujo completo:**

1. **Usuario hace clic en "Agregar Canal → Facebook"**
2. **Frontend llama a `/auth-url`**
   - Backend obtiene configuración de `SystemConfig`
   - Valida que Facebook esté habilitado
   - Genera URL de autorización con permisos necesarios:
     - `pages_show_list` - Ver lista de páginas
     - `pages_messaging` - Enviar/recibir mensajes
     - `pages_manage_metadata` - Suscribir webhooks
     - `pages_read_engagement` - Leer interacciones
     - `email` - Email del usuario
   - Genera state token para CSRF protection
   - Devuelve URL al frontend

3. **Frontend redirige a Facebook**
   - Usuario autoriza la app
   - Usuario selecciona qué páginas autorizar

4. **Facebook redirige a `/callback`**
   - Backend valida state token (30 min de validez)
   - Intercambia código por access token de corta duración
   - Intercambia por access token de larga duración
   - Obtiene las páginas del usuario
   - Por ahora, conecta automáticamente la primera página
   - Suscribe webhooks a la página:
     - `messages` - Mensajes nuevos
     - `messaging_postbacks` - Botones clickeados
     - `messaging_optins` - Confirmaciones
     - `message_deliveries` - Confirmaciones de entrega
     - `message_reads` - Mensajes leídos
   - Guarda el canal en la base de datos:
     - `pageId` - ID de la página de Facebook
     - `accessToken` - Page Access Token (larga duración)
     - `type = FACEBOOK`
     - `isActive = true`
     - `isConnected = true`
   - Redirige al frontend con `?success=facebook_connected`

5. **Frontend muestra mensaje de éxito**
   - Detecta query param `success`
   - Muestra Alert verde de éxito
   - Recarga lista de canales

#### 2. Actualización de `ChannelRepository.java` ✅
**Nuevo método:**
```java
Optional<Channel> findByCustomerAndTypeAndPageId(
    Customer customer,
    ChannelType type,
    String pageId
);
```

**Para:** Detectar si ya existe un canal para esa página (evitar duplicados)

#### 3. Actualización de `SecurityConfig.java` ✅
**Nuevas reglas de seguridad:**
```java
// Facebook OAuth
GET /api/channels/facebook/auth-url   → authenticated() (cualquier usuario)
GET /api/channels/facebook/callback   → permitAll() (Facebook redirige sin token)
```

---

### **Frontend**

#### 1. Actualización de `/comunicaciones/canales/page.tsx` ✅

**Cambios:**

1. **Nuevos estados:**
```tsx
const [successMessage, setSuccessMessage] = useState<string | null>(null)
const [errorMessage, setErrorMessage] = useState<string | null>(null)
```

2. **useEffect para detectar callback:**
```tsx
useEffect(() => {
    loadChannels()

    // Detectar si viene de callback de Facebook
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'facebook_connected') {
        setSuccessMessage('✅ Facebook Messenger conectado exitosamente')
        window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
        const errorMessages = {
            'invalid_state': 'Error de seguridad. Por favor intenta de nuevo.',
            'no_pages': 'No tienes páginas de Facebook. Crea una página primero.',
            'connection_failed': 'Error al conectar con Facebook. Intenta nuevamente.',
            'access_denied': 'Cancelaste la autorización de Facebook.'
        }
        setErrorMessage(errorMessages[error] || 'Error desconocido')
        window.history.replaceState({}, '', window.location.pathname)
    }
}, [])
```

3. **Lógica OAuth en handleAddChannel:**
```tsx
const handleAddChannel = async (type: string): Promise<void> => {
    setOpenAddDialog(false)

    // Si es Facebook, iniciar flujo OAuth
    if (type === 'facebook') {
        try {
            const response = await axiosInstance.get<{ authUrl: string }>('/api/channels/facebook/auth-url')
            
            // Redirigir a Facebook para autorización
            window.location.href = response.data.authUrl
        } catch (error) {
            console.error('Error getting Facebook auth URL:', error)
            alert('Error al iniciar conexión con Facebook. Verifica la configuración del sistema.')
        }
        return
    }

    // Para otros canales, ir a la página de configuración
    router.push(`/comunicaciones/canales/configurar/${type}`)
}
```

4. **Alerts de éxito/error:**
```tsx
{successMessage && (
    <Alert 
        severity="success" 
        sx={{ mb: 3 }}
        onClose={() => setSuccessMessage(null)}
    >
        {successMessage}
    </Alert>
)}

{errorMessage && (
    <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        onClose={() => setErrorMessage(null)}
    >
        {errorMessage}
    </Alert>
)}
```

---

## 📋 Configuración Necesaria en Facebook

### **1. Facebook for Developers → Tu App → Configuración → Avanzada**

**URL de devolución de llamada para autorización (OAuth Redirect URI):**
```
https://api.cloudfly.com.co/api/channels/facebook/callback
```

### **2. CloudFly → /settings/system → Tab "Integración Facebook"**

Debes configurar:
- **Facebook App ID:** `[Tu App ID de Facebook]`
- **Facebook App Secret:** `[Tu App Secret]`
- **Redirect URI:** `https://api.cloudfly.com.co/api/channels/facebook/callback`
- **Webhook Verify Token:** `[Token secreto que elijas]`
- **API Version:** `v18.0`
- **☑️ Habilitar integración de Facebook**

---

## 🔄 Flujo Completo del Usuario

```
1. Usuario va a /comunicaciones/canales
2. Hace clic en "Agregar Canal"
3. Selecciona "Facebook Messenger 💙"
   ↓
4. Frontend llama a /api/channels/facebook/auth-url
5. Backend genera URL de Facebook con state token
   ↓
6. Frontend redirige a Facebook
7. Usuario ve pantalla de autorización de Facebook
8. Usuario selecciona página y autoriza
   ↓
9. Facebook redirige a /api/channels/facebook/callback?code=xxx&state=yyy
10. Backend:
    - Valida state
    - Intercambia código por token
    - Obtiene páginas
    - Suscribe webhooks
    - Guarda canal en DB
    ↓
11. Backend redirige a /comunicaciones/canales?success=facebook_connected
12. Frontend detecta success y muestra:
    "✅ Facebook Messenger conectado exitosamente"
13. Canal aparece en la lista con:
    - 💙 Facebook Messenger
    - Estado: ✅ Conectado
    - Nombre de la página
```

---

## 🧪 Testing

### **Paso 1: Verificar configuración del sistema**
1. Ir a `/settings/system`
2. Tab "Integración Facebook"
3. Completar todos los campos
4. Habilitar integración
5. Guardar

### **Paso 2: Probar OAuth**
1. Ir a `/comunicaciones/canales`
2. Clic en "Agregar Canal"
3. Seleccionar "Facebook Messenger"
4. Debería redirigir a Facebook
5. Autorizar y seleccionar página
6. Debería volver a `/comunicaciones/canales` con mensaje de éxito
7. Verificar que el canal aparece en la lista

### **Paso 3: Verificar en base de datos**
```sql
SELECT * FROM channels WHERE type = 'FACEBOOK';
```

Debería mostrar:
- `page_id` - ID de la página
- `access_token` - Token (encriptado o largo)
- `is_connected` = 1
- `is_active` = 1

---

## ⚠️ Manejo de Errores

### **Errores posibles y soluciones:**

| Error | Mensaje | Solución |
|-------|---------|----------|
| `invalid_state` | Error de seguridad | State token expiró (>30 min) o fue manipulado |
| `no_pages` | No tienes páginas de Facebook | El usuario debe crear una página de Facebook primero |
| `connection_failed` | Error al conectar con Facebook | Revisar logs del backend, posibles problemas de red o credenciales |
| `access_denied` | Cancelaste la autorización | Usuario canceló en Facebook, puede intentar nuevamente |

---

## 🔐 Seguridad

### **State Token (CSRF Protection)**
- Formato: `Base64(tenantId:timestamp:uuid)`
- Validez: 30 minutos
- Previene ataques CSRF

### **Permisos de Facebook**
Solo se solicitan los permisos **mínimos necesarios**:
- ✅ `pages_show_list` - Listar páginas
- ✅ `pages_messaging` - Mensajería
- ✅ `pages_manage_metadata` - Webhooks
- ✅ `pages_read_engagement` - Estadísticas
- ✅ `email` - Identificación del usuario

**NO se solicitan:**
- ❌ `business_management` (no necesario)
- ❌ `ads_management` (no necesario)
- ❌ `pages_read_user_content` (invasivo)

---

## 📊 Base de Datos

### **Tabla: channels**
Campos utilizados para Facebook:
```sql
id              BIGINT PRIMARY KEY
customer_id     BIGINT (tenant)
type            VARCHAR(20) = 'FACEBOOK'
name            VARCHAR(100) = 'Facebook - [Nombre Página]'
is_active       BOOLEAN = TRUE
is_connected    BOOLEAN = TRUE
page_id         VARCHAR(100) = '[Page ID de Facebook]'
access_token    TEXT = '[Page Access Token]'
created_at      DATETIME
updated_at      DATETIME
```

---

## 🚀 Próximos Pasos

Ahora que OAuth está implementado, sigue:

1. **FacebookWebhookController** ❌
   - Recibir mensajes de Facebook
   - Validar firma HMAC SHA256
   - Guardar en `omni_channel_messages`

2. **FacebookMessengerService** ❌
   - Enviar mensajes a Facebook
   - Manejo de errores y retry

3. **Actualizar ChatService** ❌
   - Soporte multi-plataforma (WhatsApp + Facebook)

4. **Frontend: Selector de páginas** ❌ (opcional)
   - Permitir al usuario elegir qué página conectar
   - Por ahora se conecta automáticamente la primera

5. **Desconectar canal** ❌
   - Endpoint para revocar token
   - Desuscribir webhooks

---

¡OAuth de Facebook Messenger implementado completamente! 🎉
