# 🏢 Arquitectura Multi-Nivel: Facebook Messenger

## 🎯 Modelo de Configuración

El sistema tiene **DOS niveles** de configuración para Facebook Messenger:

---

## 🔧 NIVEL 1: Configuración del Sistema (MANAGER)

### Responsable: **MANAGER / SUPERADMIN**

**Ubicación:** `/settings/system`

**Propósito:** Configurar la **App de Facebook de CloudFly** a nivel global.

**Configuración:**
```
1. Facebook App ID         → ID de la App de CloudFly en Facebook Developers
2. Facebook App Secret     → Secret de la App de CloudFly
3. Redirect URI            → https://api.cloudfly.com.co/api/channels/facebook/callback
4. Webhook Verify Token    → Token de seguridad para verificación del webhook
5. API Version             → v18.0 (o la versión actual de Facebook Graph API)
```

**Permisos de Acceso:**
```java
// SecurityConfig.java
http.requestMatchers(HttpMethod.GET, "/api/system/**")
    .hasAnyRole("SUPERADMIN", "MANAGER");  // ← Solo MANAGER puede VER

http.requestMatchers(HttpMethod.PUT, "/api/system/**")
    .hasAnyRole("SUPERADMIN");  // ← Solo SUPERADMIN puede MODIFICAR
```

**Esta configuración es ÚNICA y COMPARTIDA** por todos los customers.

---

## 👤 NIVEL 2: Conexión de Canal (ADMIN del Customer)

### Responsable: **ADMIN del Customer (Tenant)**

**Ubicación:** `/comunicaciones/canales`

**Propósito:** Conectar la **página de Facebook del Customer** usando la App de CloudFly.

**Flujo:**
```
1. ADMIN del Customer 1 hace clic en "Agregar Canal" → Facebook
2. Se redirige a Facebook para autorizar usando SU CUENTA de Facebook
3. Facebook pregunta: "¿Permitir que CloudFly acceda a tu página?"
4. ADMIN acepta
5. Se crea un canal asociado al Customer 1 con el Page Access Token de SU página
```

**Multi-Tenancy:**
```java
// ChannelService.java
public ChannelDTO createChannel(ChannelCreateRequest request) {
    Long tenantId = userMethods.getTenantId();  // ← Customer del usuario autenticado
    
    Channel channel = Channel.builder()
            .customer(customer)  // ← Asocia al Customer 1, 2, 3, etc.
            .pageId(page.getId())
            .accessToken(pageToken)  // ← Token específico de la página del customer
            .build();
}
```

---

## 🌐 Escenario de Ejemplo

### Configuración del Sistema (UNA VEZ)

**MANAGER de CloudFly configura:**
```
App ID: 1234567890
App Secret: abc123xyz789
Redirect URI: https://api.cloudfly.com.co/api/channels/facebook/callback
Webhook Token: cloudfly_webhook_secure_token
```

Esta es la **App de CloudFly** registrada en Facebook Developers.

---

### Customer 1: "Tienda Demo"

**ADMIN del Customer 1:**
- Email: admin@tiendademo.com
- Cuenta Facebook personal: Juan Pérez
- Página de Facebook: "Tienda Demo Oficial"

**Flujo:**
1. Juan (ADMIN) inicia sesión en CloudFly
2. Va a `/comunicaciones/canales`
3. Click "Agregar Canal" → Facebook
4. Se redirige a Facebook
5. Facebook pregunta: "¿Permitir que CloudFly (App ID: 1234567890) acceda a tu página?"
6. Juan acepta
7. **Se crea canal:**
   ```
   customer_id: 1 (Tienda Demo)
   type: FACEBOOK
   name: Tienda Demo Oficial
   page_id: 987654321
   access_token: EAAxxxYYYzzz  ← Token de la página de Juan
   ```

---

### Customer 2: "Restaurante Sabor"

**ADMIN del Customer 2:**
- Email: admin@restaurantesabor.com
- Cuenta Facebook personal: María García
- Página de Facebook: "Restaurante Sabor"

**Flujo:**
1. María (ADMIN) inicia sesión en CloudFly
2. Va a `/comunicaciones/canales`
3. Click "Agregar Canal" → Facebook
4. Se redirige a Facebook
5. Facebook pregunta: "¿Permitir que CloudFly (App ID: 1234567890) acceda a tu página?"
6. María acepta
7. **Se crea canal:**
   ```
   customer_id: 2 (Restaurante Sabor)
   type: FACEBOOK
   name: Restaurante Sabor
   page_id: 123456789
   access_token: EAAbbbCCCddd  ← Token de la página de María
   ```

---

## 🔐 Aislamiento de Datos

### Base de Datos

```sql
SELECT 
    c.id,
    c.customer_id,
    cu.nombre_cliente,
    c.type,
    c.name,
    c.page_id
FROM channels c
LEFT JOIN clientes cu ON c.customer_id = cu.id
WHERE c.type = 'FACEBOOK';
```

**Resultado:**
```
id | customer_id | nombre_cliente    | type     | name                 | page_id
---|-------------|-------------------|----------|----------------------|-----------
4  | 1           | Tienda Demo       | FACEBOOK | Tienda Demo Oficial  | 987654321
5  | 2           | Restaurante Sabor | FACEBOOK | Restaurante Sabor    | 123456789
```

✅ Cada customer tiene su propio canal.

### Seguridad Backend

```java
// ChannelService.java
public List<ChannelDTO> getAllChannels() {
    Long tenantId = userMethods.getTenantId();  // ← Obtiene customer del usuario autenticado
    
    return channelRepository.findByCustomerId(tenantId).stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
}
```

**Resultado:**
- ADMIN del Customer 1 solo ve el canal de "Tienda Demo Oficial"
- ADMIN del Customer 2 solo ve el canal de "Restaurante Sabor"

---

## 📊 Comparación de Responsabilidades

| Aspecto | MANAGER (Sistema) | ADMIN (Customer) |
|---------|-------------------|------------------|
| **Configura** | App de CloudFly en Facebook | Página de Facebook del negocio |
| **Ubicación** | `/settings/system` | `/comunicaciones/canales` |
| **Acceso** | SUPERADMIN, MANAGER | ADMIN del tenant |
| **Frecuencia** | Una vez (configuración inicial) | Cada vez que un customer se une |
| **Scope** | Global (todos los customers) | Específico del tenant |
| **Datos** | App ID, App Secret, Webhook Token | Page ID, Page Access Token |

---

## 🔄 Flujo OAuth Detallado

### 1. MANAGER Configura (UNA VEZ)

```
MANAGER → /settings/system → Guarda configuración de Facebook App
```

**BD:**
```sql
-- Tabla: system_config (una sola fila global)
facebook_app_id: 1234567890
facebook_app_secret: abc123xyz789
facebook_redirect_uri: https://api.cloudfly.com.co/api/channels/facebook/callback
```

### 2. Customer 1 ADMIN Conecta SU Página

```
Customer 1 ADMIN → Agregar Canal → Facebook → Autoriza
```

**Backend:**
```java
// 1. Obtiene configuración global
SystemConfigDTO config = systemConfigService.getSystemConfigInternal();

// 2. Construye URL con App ID global
String authUrl = "https://www.facebook.com/v18.0/dialog/oauth?" +
    "client_id=" + config.getFacebookAppId() +  // ← App de CloudFly
    "&redirect_uri=" + config.getFacebookRedirectUri() +
    "&scope=pages_messaging";

// 3. Redirige a Facebook
// 4. Facebook devuelve code
// 5. Intercambia code por token
// 6. Obtiene páginas del ADMIN
// 7. Para cada página, crea canal asociado al Customer 1

Long tenantId = userMethods.getTenantId();  // ← Customer 1

Channel channel = Channel.builder()
    .customer(customer)  // ← Customer 1
    .pageId(page.getId())
    .accessToken(pageToken)  // ← Token de la página del Customer 1
    .build();
```

**BD:**
```sql
-- Tabla: channels
INSERT INTO channels (customer_id, type, page_id, access_token)
VALUES (1, 'FACEBOOK', '987654321', 'EAAxxxYYYzzz');
```

### 3. Customer 2 ADMIN Conecta SU Página

```
Customer 2 ADMIN → Agregar Canal → Facebook → Autoriza
```

**Backend:**
```java
// Mismo proceso pero con Customer 2
Long tenantId = userMethods.getTenantId();  // ← Customer 2

Channel channel = Channel.builder()
    .customer(customer)  // ← Customer 2
    .pageId(page.getId())
    .accessToken(pageToken)  // ← Token de la página del Customer 2
    .build();
```

**BD:**
```sql
-- Tabla: channels
INSERT INTO channels (customer_id, type, page_id, access_token)
VALUES (2, 'FACEBOOK', '123456789', 'EAAbbbCCCddd');
```

---

## 🎯 Ventajas de esta Arquitectura

### 1. **Configuración Centralizada**
✅ MANAGER configura la App de CloudFly UNA sola vez.  
✅ No necesita reconfigurar para cada customer.

### 2. **Autonomía del Customer**
✅ Cada ADMIN conecta SU PROPIA página de Facebook.  
✅ No depende del MANAGER para cada nuevo customer.

### 3. **Aislamiento de Datos**
✅ Cada customer solo ve y gestiona SUS canales.  
✅ Los mensajes están filtrados por `customer_id`.

### 4. **Escalabilidad**
✅ Soporta N customers sin cambios en la configuración del sistema.  
✅ Cada customer puede tener múltiples páginas de Facebook.

---

## ✅ Implementación Actual

La implementación **YA está correcta** para este escenario:

1. ✅ **SecurityConfig:**
   - `/api/system/**` → Solo MANAGER/SUPERADMIN
   - `/api/channels/**` → Autenticado (multi-tenant)

2. ✅ **SystemConfigService:**
   - Configuración global única
   - Enmascaramiento de secretos

3. ✅ **ChannelService:**
   - Usa `userMethods.getTenantId()` para multi-tenancy
   - Asocia canales al customer correcto

4. ✅ **FacebookOAuthController:**
   - Usa configuración global (App ID, Secret)
   - Crea canales específicos por tenant

---

## 📋 Checklist de Configuración

### MANAGER (Solo una vez)

- [ ] Crear App en Facebook Developers
- [ ] Copiar App ID y App Secret
- [ ] Configurar OAuth Redirect URI en Facebook
- [ ] Configurar Webhook URL en Facebook
- [ ] Ir a `/settings/system` en CloudFly
- [ ] Completar todos los campos de Facebook
- [ ] Guardar configuración

### ADMIN del Customer (Cada tenant)

- [ ] Tener una página de Facebook Business
- [ ] Ir a `/comunicaciones/canales`
- [ ] Click "Agregar Canal" → Facebook
- [ ] Autorizar CloudFly App con cuenta de Facebook
- [ ] Seleccionar la página del negocio
- [ ] Verificar que aparece el canal

---

## 🚀 Estado Actual

✅ **Backend:** Implementación multi-nivel completa  
✅ **Frontend:** Flujo OAuth separado por rol  
✅ **Base de Datos:** Aislamiento por customer_id  
✅ **Seguridad:** Permisos por rol (MANAGER vs ADMIN)  

**La arquitectura está lista para producción.** 🔥
