# ✅ Configuración del Sistema - Implementación Completa

## 📁 Archivos Creados

### **Backend**

```
✅ SystemConfig.java (Entity)
   - Configuración general del sistema
   - Integración Facebook (App ID, Secret, etc.)
   - Integración WhatsApp (Evolution API)

✅ SystemConfigRepository.java
   - Acceso a datos de configuración

✅ SystemConfigDTO.java
   - DTO para transferencia de datos

✅ SystemConfigService.java
   - Lógica de negocio
   - Enmascaramiento de secretos

✅ SystemConfigController.java
   - API REST endpoints
   - Solo accesible por SUPERADMIN
```

### **Frontend**

```
✅ /settings/system/page.tsx
   - Página con 3 pestañas (tabs)
   - Tab 1: Configuración General
   - Tab 2: Integración Facebook
   - Tab 3: Integración WhatsApp
```

---

## 🗄️ Base de Datos

### **Tabla: system_config**

```sql
CREATE TABLE system_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Configuración General
    system_name VARCHAR(200),
    system_description VARCHAR(500),
    logo_url VARCHAR(500),
    support_email VARCHAR(100),
    support_phone VARCHAR(50),
    terms_of_service TEXT,
    privacy_policy TEXT,
    
    -- Integración Facebook
    facebook_app_id VARCHAR(100),
    facebook_app_secret TEXT,
    facebook_redirect_uri VARCHAR(500),
    facebook_webhook_verify_token VARCHAR(200),
    facebook_api_version VARCHAR(100),
    facebook_enabled BOOLEAN DEFAULT FALSE,
    
    -- Integración WhatsApp
    evolution_api_url VARCHAR(500),
    evolution_api_key TEXT,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    
    INDEX idx_facebook_enabled (facebook_enabled),
    INDEX idx_whatsapp_enabled (whatsapp_enabled)
);
```

---

## 🔧 API Endpoints

### **GET /api/system/config**
Obtener configuración del sistema

**Requiere:** `ROLE_SUPERADMIN`

**Response:**
```json
{
  "id": 1,
  "systemName": "CloudFly ERP",
  "systemDescription": "Sistema ERP Multi-tenant",
  "facebookAppId": "123456789",
  "facebookAppSecret": "abc1...xyz9",  // Enmascarado
  "facebookRedirectUri": "https://cloudfly.com/api/channels/facebook/callback",
  "facebookWebhookVerifyToken": "clou...2025",  // Enmascarado
  "facebookApiVersion": "v18.0",
  "facebookEnabled": true,
  "evolutionApiUrl": "https://evolution.example.com",
  "evolutionApiKey": "your...here",  // Enmascarado
  "whatsappEnabled": true
}
```

### **PUT /api/system/config**
Actualizar configuración

**Requiere:** `ROLE_SUPERADMIN`

**Request:**
```json
{
  "facebookAppId": "123456789",
  "facebookAppSecret": "abc123def456",
  "facebookRedirectUri": "https://cloudfly.com/api/channels/facebook/callback",
  "facebookWebhookVerifyToken": "cloudfly-secret-2025",
  "facebookEnabled": true
}
```

---

## 🎨 Interfaz de Usuario

### **Tab 1: Configuración General**

```
┌─────────────────────────────────────────────────────────┐
│  Información del Sistema                                │
├─────────────────────────────────────────────────────────┤
│  Nombre del Sistema:     [CloudFly ERP              ]   │
│  Logo URL:               [https://...               ]   │
│  Descripción:            [Sistema ERP Multi-tenant  ]   │
│                                                          │
│  Información de Soporte                                 │
│  Email:                  [support@cloudfly.com      ]   │
│  Teléfono:               [+57 300 123 4567          ]   │
│                                                          │
│  Políticas Legales                                      │
│  Términos:               [https://cloudfly.com/terms]   │
│  Privacidad:             [https://cloudfly.com/privacy] │
└─────────────────────────────────────────────────────────┘
```

### **Tab 2: Integración Facebook** ⭐

```
┌─────────────────────────────────────────────────────────┐
│  💙 Configuración de Facebook Messenger                 │
├─────────────────────────────────────────────────────────┤
│  ℹ️ ¿Dónde obtener estos datos?                         │
│  1. Ve a Facebook for Developers                        │
│  2. Selecciona tu app → Configuración → Básica         │
│                                                          │
│  ☑️ Habilitar integración de Facebook                   │
│                                                          │
│  Facebook App ID *        [123456789            ]       │
│  Facebook App Secret *    [•••••••••••••        ]       │
│  Redirect URI *           [https://cloudfly.com...]      │
│  Webhook Verify Token *   [cloudfly-secret-2025  ]      │
│  API Version              [v18.0                ]       │
│                                                          │
│  📡 URL del Webhook (copiar a Facebook):                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ https://cloudfly.com/api/webhooks/facebook       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Tab 3: Integración WhatsApp**

```
┌─────────────────────────────────────────────────────────┐
│  💬 Configuración de Evolution API (WhatsApp)           │
├─────────────────────────────────────────────────────────┤
│  ℹ️ Evolution API permite conectar WhatsApp Business    │
│                                                          │
│  ☑️ Habilitar integración de WhatsApp                   │
│                                                          │
│  Evolution API URL *      [https://evolution.example...] │
│  Evolution API Key *      [•••••••••••••        ]       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Seguridad

### **1. Enmascaramiento de Secretos**

Los secretos se enmascaran al mostrarse:

```java
private String maskSecret(String secret) {
    if (secret.length() <= 8) {
        return "********";
    }
    return secret.substring(0, 4) + "..." + secret.substring(secret.length() - 4);
}
```

**Ejemplo:**
- `facebookAppSecret: "abc123def456xyz789"`  
- Mostrado como: `"abc1...xyz9"`

### **2. Solo SUPERADMIN**

```java
@PreAuthorize("hasAuthority('ROLE_SUPERADMIN')")
public ResponseEntity<SystemConfigDTO> getSystemConfig() {
    // ...
}
```

---

## 🚀 Siguientes Pasos

### **1. Agregar al Menú**

Agregar enlace en el menú de administración:

```tsx
// VerticalMenu.tsx
{userRole === 'SUPERADMIN' && (
    <MenuItem href="/settings/system">
        <SettingsIcon />
        Configuración del Sistema
    </MenuItem>
)}
```

### **2. Compilar Backend**

```bash
cd backend
mvn clean install -DskipTests
```

### **3. Iniciar Backend**

```bash
java -jar target/starter1-0.0.1-SNAPSHOT.jar
```

### **4. Probar en Frontend**

1. Login como SUPERADMIN
2. Ir a `/settings/system`
3. Completar Tab 2 (Facebook)
4. Guardar

---

## 📋 Checklist de Configuración

### **Configurar Facebook**

- [ ] Crear app en Facebook Developer
- [ ] Obtener App ID
- [ ] Obtener App Secret
- [ ] Configurar OAuth Redirect URI
- [ ] Generar Webhook Verify Token
- [ ] Completar datos en CloudFly: `/settings/system`
- [ ] Habilitar integración (switch)
- [ ] Guardar configuración

### **Configurar WhatsApp**

- [ ] Instalar Evolution API
- [ ] Obtener URL del servidor
- [ ] Generar API Key
- [ ] Completar datos en CloudFly
- [ ] Habilitar integración
- [ ] Guardar configuración

---

## 🎯 Valores por Defecto

Al crear la configuración por primera vez:

```java
SystemConfig defaultConfig = SystemConfig.builder()
    .systemName("CloudFly ERP")
    .systemDescription("Sistema ERP Multi-tenant con IA")
    .facebookApiVersion("v18.0")
    .facebookEnabled(false)
    .whatsappEnabled(false)
    .build();
```

---

## 🔗 Uso en Otros Servicios

### **Ejemplo: OAuth Controller**

```java
@Service
public class FacebookOAuthController {
    
    @Autowired
    private SystemConfigService systemConfigService;
    
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthUrl() {
        // Obtener configuración del sistema
        SystemConfigDTO config = systemConfigService.getSystemConfig();
        
        if (!config.getFacebookEnabled()) {
            return ResponseEntity.badRequest()
                .body("Facebook integration is not enabled");
        }
        
        String authUrl = String.format(
            "https://www.facebook.com/%s/dialog/oauth?" +
            "client_id=%s&redirect_uri=%s...",
            config.getFacebookApiVersion(),
            config.getFacebookAppId(),
            config.getFacebookRedirectUri()
        );
        
        return ResponseEntity.ok(Map.of("authUrl", authUrl));
    }
}
```

---

¡Listo! Ahora tienes una **página completa de configuración del sistema** lista para usar. 🎉
