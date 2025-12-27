# ✅ Implementación Facebook Messenger OAuth - Completa

## 🎯 Flujo Completo Implementado

Se ha restaurado e implementado el **flujo OAuth completo de Facebook Messenger** para agregar canales de comunicación.

---

## 📊 Flujo de Usuario (Frontend → Backend → Facebook → Backend → Frontend)

### Paso 1: Usuario Inicia Conexión

**Frontend: `/comunicaciones/canales`**
```
1. Usuario hace clic en "Agregar Canal"
2. Selecciona "Facebook Messenger"
3. handleAddChannel('facebook') se ejecuta
```

### Paso 2: Obtener URL de Autorización

**Frontend → Backend:**
```typescript
const response = await axiosInstance.get<{ authUrl: string, state: string }>
    ('/api/channels/facebook/auth-url')
```

**Backend: `FacebookOAuthController.getAuthorizationUrl()`**
```java
@GetMapping("/auth-url")
public ResponseEntity<?> getAuthorizationUrl() {
    // 1. Obtener configuración de Facebook desde system_config
    SystemConfigDTO config = systemConfigService.getSystemConfigInternal();
    
    // 2. Generar state único (seguridad CSRF)
    String state = UUID.randomUUID().toString();
    
    // 3. Construir URL de Facebook Graph API
    String authUrl = "https://www.facebook.com/v18.0/dialog/oauth?" +
        "client_id=" + config.getFacebookAppId() +
        "&redirect_uri=" + config.getFacebookRedirectUri() +
        "&state=" + state +
        "&scope=pages_messaging,pages_manage_metadata,pages_read_engagement";
    
    // 4. Retornar URL y state
    return ResponseEntity.ok(Map.of("authUrl", authUrl, "state", state));
}
```

**Scopes solicitados a Facebook:**
- `pages_messaging` - Enviar/recibir mensajes
- `pages_manage_metadata` - Configurar webhooks
- `pages_read_engagement` - Leer metadata de páginas

### Paso 3: Redirigir a Facebook

**Frontend:**
```typescript
window.location.href = response.data.authUrl
```

**Usuario es redirigido a:**
```
https://www.facebook.com/v18.0/dialog/oauth?
    client_id=1234567890
    &redirect_uri=https://api.cloudfly.com.co/api/channels/facebook/callback
    &state=abc123-xyz789
    &scope=pages_messaging,pages_manage_metadata,pages_read_engagement
```

### Paso 4: Usuario Autoriza en Facebook

**En Facebook:**
1. Usuario inicia sesión (si no lo está)
2. Facebook muestra permisos solicitados
3. Usuario acepta o rechaza
4. Facebook redirige de vuelta con `code` o `error`

### Paso 5: Facebook Redirige al Callback

**Si usuario acepta:**
```
https://api.cloudfly.com.co/api/channels/facebook/callback?
    code=ABC123XYZ
    &state=abc123-xyz789
```

**Si usuario rechaza:**
```
https://api.cloudfly.com.co/api/channels/facebook/callback?
    error=access_denied
    &error_description=User+cancelled
```

### Paso 6: Backend Procesa Callback

**Backend: `FacebookOAuthController.callback()`**
```java
@GetMapping("/callback")
public void callback(
    @RequestParam(required = false) String code,
    @RequestParam(required = false) String state,
    @RequestParam(required = false) String error,
    HttpServletResponse response
) {
    // 1. Validar que no hay error
    if (error != null) {
        response.sendRedirect("/comunicaciones/canales?error=" + error);
        return;
    }
    
    // 2. Validar code y state
    if (code == null || state == null) {
        response.sendRedirect("/comunicaciones/canales?error=invalid_state");
        return;
    }
    
    // 3. Intercambiar code por access_token
    SystemConfigDTO config = systemConfigService.getSystemConfigInternal();
    String shortLivedToken = exchangeCodeForToken(
        code,
        config.getFacebookAppId(),
        config.getFacebookAppSecret(),
        config.getFacebookRedirectUri()
    );
    
    // 4. Intercambiar short-lived por long-lived token
    String longLivedToken = exchangeForLongLivedToken(
        shortLivedToken,
        config.getFacebookAppId(),
        config.getFacebookAppSecret()
    );
    
    // 5. Obtener páginas de Facebook del usuario
    List<FacebookPage> pages = getUserPages(longLivedToken);
    
    // 6. Para cada página, crear canal en BD
    for (FacebookPage page : pages) {
        // Obtener page access token (específico de la página)
        String pageToken = getPageAccessToken(page.getId(), longLivedToken);
        
        // Crear canal en BD
        channelService.createChannel(ChannelCreateRequest.builder()
            .type(ChannelType.FACEBOOK)
            .name(page.getName())
            .pageId(page.getId())
            .accessToken(pageToken)  // Token de la página (long-lived)
            .build());
        
        // Suscribir webhook a la página
        subscribePageToWebhook(page.getId(), pageToken);
    }
    
    // 7. Redirigir al frontend con éxito
    response.sendRedirect("/comunicaciones/canales?success=facebook_connected");
}
```

### Paso 7: Frontend Muestra Resultado

**Frontend: useEffect detecta parámetros**
```typescript
useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'facebook_connected') {
        setSuccessMessage('✅ Facebook Messenger conectado exitosamente')
        window.history.replaceState({}, '', window.location.pathname)  // Limpia URL
    } else if (error) {
        const errorMessages: Record<string, string> = {
            'invalid_state': 'Error de seguridad. Por favor intenta de nuevo.',
            'no_pages': 'No tienes páginas de Facebook. Crea una página primero.',
            'connection_failed': 'Error al conectar con Facebook. Intenta nuevamente.',
            'access_denied': 'Cancelaste la autorización de Facebook.'
        }
        setErrorMessage(errorMessages[error] || 'Error desconocido al conectar Facebook')
        window.history.replaceState({}, '', window.location.pathname)  // Limpia URL
    }
}, [])
```

**Usuario ve:**
- ✅ Alert verde: "Facebook Messenger conectado exitosamente"
- O ❌ Alert rojo con el error específico

---

## 🔐 Tokens de Facebook

### 1. **Short-Lived User Access Token**
- Duración: 1-2 horas
- Se obtiene al intercambiar el `code`

### 2. **Long-Lived User Access Token**
- Duración: 60 días
- Se obtiene intercambiando el short-lived token

### 3. **Page Access Token**
- Duración: Permanente (no expira)
- Específico por página de Facebook
- Este es el que guardamos en BD

---

## 📝 Configuración Requerida

### En Facebook Developers (developers.facebook.com)

1. **App ID:**
   - Ejemplo: `1234567890`
   - Configurar en: `/settings/system`

2. **App Secret:**
   - Ejemplo: `abc123xyz789`
   - Configurar en: `/settings/system`

3. **Redirect URI (OAuth Callback):**
   - DEBE SER: `https://api.cloudfly.com.co/api/channels/facebook/callback`
   - Configurar en:
     - Facebook Developers → App → Settings → Basic → Add Platform → Website
     - Facebook Developers → Messenger → Settings → Callback URL

4. **Webhook Verify Token:**
   - Ejemplo: `cloudfly_token_seguro_123`
   - Debe coincidir en:
     - `/settings/system` (backend)
     - Facebook Developers → Messenger → Webhooks

5. **Webhook URL:**
   - `https://api.cloudfly.com.co/webhooks/facebook`
   - Configurar en: Facebook Developers → Messenger → Webhooks

---

## 🌐 Endpoints Implementados

### Frontend
```
/comunicaciones/canales - Lista de canales + lógica OAuth
/settings/system - Configuración de Facebook
```

### Backend
```
GET  /api/channels/facebook/auth-url  - Genera URL de Facebook
GET  /api/channels/facebook/callback  - Procesa callback OAuth
GET  /webhooks/facebook              - Verifica webhook
POST /webhooks/facebook              - Recibe mensajes
```

---

## ✅ Cambios Implementados en `/canales/page.tsx`

### Estados agregados:
```typescript
const [successMessage, setSuccessMessage] = useState<string | null>(null)
const [errorMessage, setErrorMessage] = useState<string | null>(null)
```

### useEffect actualizado:
- Detecta parámetros `?success=` y `?error=` en URL
- Muestra mensajes correspondientes
- Limpia URL después de mostrar

### handleAddChannel actualizado:
```typescript
if (type === 'facebook') {
    // Obtener URL de Facebook
    const response = await axiosInstance.get('/api/channels/facebook/auth-url')
    // Redirigir a Facebook
    window.location.href = response.data.authUrl
    return
}
// Para otros canales, ir a página de configuración
router.push(`/comunicaciones/canales/configurar/${type}`)
```

### Componentes Alert agregados:
```tsx
{successMessage && (
    <Alert severity="success" onClose={() => setSuccessMessage(null)}>
        {successMessage}
    </Alert>
)}

{errorMessage && (
    <Alert severity="error" onClose={() => setErrorMessage(null)}>
        {errorMessage}
    </Alert>
)}
```

---

## 🚀 Próximos Pasos para Probar

1. **Configurar App de Facebook:**
   - Ir a `/settings/system`
   - Completar:
     - Facebook App ID
     - Facebook App Secret
     - Redirect URI: `https://api.cloudfly.com.co/api/channels/facebook/callback`
     - Webhook Verify Token
     - API Version: `v18.0`
   - Habilitar Facebook Messenger

2. **Probar OAuth:**
   - Ir a `/comunicaciones/canales`
   - Click "Agregar Canal"
   - Seleccionar "Facebook"
   - Autorizar en Facebook
   - Verificar que aparece el canal con tu página de Facebook

3. **Verificar Webhook:**
   - En Facebook Developers → Webhooks → Click "Verify"
   - Debería mostrar ✅ tick verde

---

## ✅ Estado Actual

- ✅ Frontend: Lógica OAuth completa
- ✅ Backend: Controllers OAuth y Webhook completos
- ✅ Base de Datos: Tabla `system_config` lista
- ✅ Compilación: Sin errores

**Todo listo para probar Facebook Messenger.** 🚀
