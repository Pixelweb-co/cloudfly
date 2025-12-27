# 🔐 Permisos de Facebook para CloudFly

## 📊 Análisis de Permisos ManyChat vs CloudFly

### **Permisos que solicita ManyChat** (según capturas)

```
✅ Recibir dirección de correo electrónico
✅ Acceder a anuncios de Facebook y estadísticas
✅ Administrar tu negocio (Business Manager)
✅ Acceder al perfil y publicaciones de Instagram
✅ Administrar comentarios de Instagram
✅ Acceder a estadísticas de Instagram
✅ Administrar conversaciones en Messenger (1 página)
✅ Administrar mensajes de Instagram
✅ Registrar eventos en la página
✅ Registrar eventos en Instagram
✅ Leer contenido publicado en la página
✅ Crear y administrar anuncios
✅ Administrar cuentas, webhooks y datos de normas
✅ Leer contenido del usuario en tu página
✅ Mostrar lista de páginas que administras
```

---

## 🎯 Permisos que NECESITA CloudFly

### **Fase 1: Solo Facebook Messenger** ⭐ Implementar primero

| Permiso | Scope OAuth | Propósito | Crítico |
|---------|------------|-----------|---------|
| **Listar páginas** | `pages_show_list` | Ver qué páginas administra el usuario | ✅ Sí |
| **Gestionar Messenger** | `pages_messaging` | Enviar/recibir mensajes en Messenger | ✅ Sí |
| **Gestionar metadata** | `pages_manage_metadata` | Suscribir webhooks a la página | ✅ Sí |
| **Leer engagement** | `pages_read_engagement` | Ver métricas de mensajes (opcional) | ⚠️ Opcional |
| **Email del usuario** | `email` | Identificar al usuario | ⚠️ Opcional |

### **Fase 2: Agregar Instagram** (Futuro)

| Permiso | Scope OAuth | Propósito |
|---------|------------|-----------|
| **Perfil básico IG** | `instagram_basic` | Acceder a cuenta de Instagram |
| **Mensajes IG** | `instagram_manage_messages` | Gestionar DMs de Instagram |
| **Comentarios IG** | `instagram_manage_comments` | Responder comentarios automáticamente |

### **Permisos NO necesarios para CloudFly v1**

❌ `business_management` - No gestionamos Business Manager  
❌ `ads_management` - No creamos anuncios  
❌ `ads_read` - No necesitamos estadísticas de ads  
❌ `pages_manage_posts` - No publicamos contenido  
❌ `pages_manage_events` - No gestionamos eventos  

---

## 📝 Configuración en Facebook Developer

### **1. Permisos Estándar (Automáticos)**

Estos permisos están disponibles inmediatamente:

```
✅ email
✅ public_profile
```

### **2. Permisos que Requieren Revisión de Facebook**

Estos necesitan que Facebook apruebe tu app:

```
⏳ pages_messaging
⏳ pages_manage_metadata
⏳ pages_show_list
⏳ pages_read_engagement
```

---

## 🔧 Implementación en el Código

### **URL de Autorización OAuth**

```java
@GetMapping("/auth-url")
public ResponseEntity<?> getAuthorizationUrl() {
    String scopes = String.join(",", 
        "email",                      // Email del usuario
        "pages_show_list",            // Listar páginas
        "pages_messaging",            // Gestionar Messenger
        "pages_manage_metadata",      // Webhooks
        "pages_read_engagement"       // Métricas (opcional)
    );
    
    String authUrl = String.format(
        "https://www.facebook.com/v18.0/dialog/oauth?" +
        "client_id=%s&" +
        "redirect_uri=%s&" +
        "state=%s&" +
        "scope=%s",
        appId,
        redirectUri,
        state,
        scopes
    );
    
    return ResponseEntity.ok(Map.of("authUrl", authUrl));
}
```

### **Frontend: Diálogo de Autorización**

```tsx
const handleConnectFacebook = async () => {
    const response = await axiosInstance.get('/api/channels/facebook/auth-url')
    const { authUrl } = response.data
    
    // Redirigir a Facebook
    window.location.href = authUrl
}
```

---

## 🎨 Pantalla de Autorización que Verá el Usuario

```
┌────────────────────────────────────────────────────────────┐
│  🔵 CloudFly desea acceder a tu cuenta de Facebook         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Recibir tu dirección de correo electrónico            │
│                                                            │
│  ✅ Administrar y acceder a conversaciones en Messenger   │
│     Se seleccionó 1 Página                                 │
│     ┌───────────────────────────────────┐                 │
│     │ ☑️ Tienda de Ropa Online          │                 │
│     └───────────────────────────────────┘                 │
│                                                            │
│  ✅ Administrar webhooks y configuración de la página     │
│     Se seleccionó 1 Página                                 │
│                                                            │
│  ✅ Mostrar lista de páginas que administras              │
│                                                            │
│  ✅ Leer contenido e interacciones de la página           │
│     (opcional)                                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Política de privacidad | Condiciones de servicio         │
│                                                            │
│           [Cancelar]          [Continuar] ──────►         │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad y Mejores Prácticas

### **1. Solicitar Solo lo Necesario**

```java
// ❌ MAL - Solicitar demasiados permisos
String scopes = "email,pages_messaging,business_management,ads_read,pages_manage_posts";

// ✅ BIEN - Solo lo esencial
String scopes = "email,pages_messaging,pages_manage_metadata,pages_show_list";
```

**¿Por qué?**
- Mayor tasa de aceptación del usuario
- Más rápido proceso de revisión de Facebook
- Menor riesgo de seguridad

### **2. Explicar Cada Permiso**

En tu frontend, muestra por qué necesitas cada permiso:

```tsx
<Alert severity="info" sx={{ mb: 3 }}>
    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
        📋 Permisos que solicitaremos:
    </Typography>
    <Typography variant="body2" component="div">
        ✅ <strong>Gestionar Messenger:</strong> Para enviar y recibir mensajes automáticos<br/>
        ✅ <strong>Configurar webhooks:</strong> Para recibir notificaciones en tiempo real<br/>
        ✅ <strong>Listar páginas:</strong> Para que elijas cuál conectar<br/>
        ✅ <strong>Email:</strong> Para identificarte en CloudFly
    </Typography>
</Alert>
```

---

## 📋 Proceso de Revisión de Facebook

### **Paso 1: Desarrollo y Testing**

Durante desarrollo, puedes usar tu propia página sin aprobación:

```
Estado: En desarrollo
Permisos: Funcionan solo para administradores de la app
```

### **Paso 2: Solicitar Revisión**

Cuando estés listo para producción:

1. **App Review → Permisos y Funciones**
2. Seleccionar permisos a solicitar:
   - `pages_messaging`
   - `pages_manage_metadata`
   - `pages_show_list`

3. **Proporcionar evidencia:**
   - Screenshot del flujo OAuth
   - Video mostrando cómo usas cada permiso
   - Instrucciones de prueba para Facebook

### **Paso 3: Completar Business Verification**

Facebook requiere verificar tu negocio:

```
Documentos requeridos:
- Registro mercantil o documento de incorporación
- Comprobante de domicilio comercial
- Identificación oficial del representante legal
- Sitio web de la empresa
```

---

## 🎯 Comparativa: CloudFly vs ManyChat

| Aspecto | ManyChat | CloudFly v1 |
|---------|----------|-------------|
| **Permisos totales** | ~15 permisos | 4-5 permisos |
| **Instagram** | ✅ Incluido | ⏳ Fase 2 |
| **Ads Management** | ✅ Incluido | ❌ No necesario |
| **Business Manager** | ✅ Incluido | ❌ No necesario |
| **Complejidad OAuth** | Alta | Baja |
| **Tiempo de aprobación** | 2-4 semanas | 1-2 semanas |

**Ventaja de CloudFly:** Enfoque simple y directo. Solo lo necesario para automatizar respuestas.

---

## 💻 Código Completo del Flujo OAuth

### **Backend: OAuth Controller Simplificado**

```java
@RestController
@RequestMapping("/api/channels/facebook")
public class FacebookOAuthController {
    
    // Scopes mínimos necesarios
    private static final String[] REQUIRED_SCOPES = {
        "email",
        "pages_show_list",
        "pages_messaging",
        "pages_manage_metadata",
        "pages_read_engagement"  // Opcional
    };
    
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthorizationUrl() {
        String scopes = String.join(",", REQUIRED_SCOPES);
        
        String authUrl = String.format(
            "https://www.facebook.com/v18.0/dialog/oauth?" +
            "client_id=%s&" +
            "redirect_uri=%s&" +
            "state=%s&" +
            "scope=%s&" +
            "response_type=code",
            appId,
            redirectUri,
            generateStateToken(),
            scopes
        );
        
        return ResponseEntity.ok(Map.of("authUrl", authUrl));
    }
}
```

---

## 🚀 Plan de Implementación

### **Fase 1: MVP (Solo Messenger)** ⭐ Comenzar aquí

```
Permisos:
✅ pages_show_list
✅ pages_messaging
✅ pages_manage_metadata

Tiempo estimado: 1 semana
```

### **Fase 2: Métricas**

```
Permisos adicionales:
✅ pages_read_engagement

Tiempo estimado: 2 días
```

### **Fase 3: Instagram Direct**

```
Permisos adicionales:
✅ instagram_basic
✅ instagram_manage_messages
✅ instagram_manage_comments

Tiempo estimado: 1 semana
```

---

## ✅ Checklist antes de Solicitar Revisión

- [ ] App funciona correctamente en modo desarrollo
- [ ] Video demostrativo de 2-3 minutos
- [ ] Screenshots del proceso OAuth
- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados
- [ ] App tiene logo y descripción clara
- [ ] Business Verification completada
- [ ] URL de callback en producción configurada

---

## 🔗 Referencias Oficiales

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/overview)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
- [App Review Process](https://developers.facebook.com/docs/app-review)
- [Business Verification](https://www.facebook.com/business/help/2058515294227817)

---

**Siguiente paso:** Implementar el flujo OAuth con los **4 permisos mínimos** y probar con tu página de prueba. 🚀
