# 📘 Guía: Configurar Facebook Login for Business

## 🎯 ¿Qué es Facebook Login for Business?

Es la solución de autenticación de Meta diseñada para **proveedores de tecnología** (como Cloudfly) que crean integraciones con herramientas empresariales de Meta.

### **Ventajas sobre el Login tradicional:**

1. ✅ **Delegación Explícita de Activos**: El usuario selecciona exactamente qué páginas/cuentas conectar
2. ✅ **System User Tokens**: Tokens persistentes que no expiran, asociados al negocio (no a una persona)
3. ✅ **Menos problemas de permisos**: El flujo está diseñado para integraciones B2B
4. ✅ **Sin "no_pages_found"**: El usuario **debe** seleccionar páginas durante el flujo

---

## 🔧 Paso 1: Configurar tu App de Facebook

### 1.1. Verificar Tipo de App

Ve a [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)

Tu app **debe ser tipo "Business"**. Si no lo es:
- Ve a **Configuración \u003e Básico**
- Busca "Tipo de app" → Si es "Consumer" o "None", debes migrar
- Contacta soporte de Meta o crea una app nueva de tipo **Business**

### 1.2. Agregar el Producto

1. En el panel de tu app, ve a **Productos**
2. Busca **"Inicio de sesión con Facebook para empresas"** (Facebook Login for Business)
3. Haz clic en **Configurar**

---

## 🎨 Paso 2: Crear una Configuración

1. Ve a **Inicio de sesión para empresas \u003e Configuraciones**
2. Haz clic en **+ Crear una configuración**

### 2.1. Configuración General

**Nombre**: `Cloudfly - Conectar Facebook Messenger`

### 2.2. Tipo de Token

**Selecciona**: **System User Access Token**

- ✅ **Nunca expira** (ideal para servidor)
- ✅ Asociado al negocio, no a una persona
- ✅ Offline (para conexiones 24/7)

### 2.3. Activos Requeridos

Selecciona:
- ✅ **Pages** (Páginas de Facebook)
- ✅ **Instagram Business Accounts** (si también conectarás Instagram)

### 2.4. Permisos

Selecciona los siguientes permisos:

**Para Facebook Messenger:**
- `pages_show_list` - Listar páginas del usuario
- `pages_messaging` - Enviar/recibir mensajes
- `pages_manage_metadata` - Metadatos de la página
- `pages_read_engagement` - Leer engagement

**Para Instagram (opcional):**
- `instagram_basic` - Información básica
- `instagram_manage_messages` - Gestionar mensajes directos

### 2.5. Guardar y Obtener el Config ID

1. Haz clic en **Crear**
2. **IMPORTANTE**: Copia el **`config_id`** que aparece
   - Ejemplo: `123456789012345`
   - Lo necesitarás para configurar Cloudfly

---

## ⚙️ Paso 3: Configurar Cloudfly

### 3.1. Configuración Global (Master)

En el panel de administración de Cloudfly:

1. Ve a **Configuración del Sistema**
2. En la sección **Facebook**:
   - **App ID**: `tu-app-id`
   - **App Secret**: `tu-app-secret`
   - **API Version**: `v18.0` (o la versión actual)
   - **Frontend URL**: `https://tu-dominio.com` (o `http://localhost:3000` en desarrollo)

### 3.2. Configuración por Tenant

Cada tenant debe configurar su `config_id`:

#### **Opción A: Por API** (Recomendado para desarrollo)

```bash
curl -X PUT https://api.cloudfly.com/api/customer-config \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facebookLoginConfigId": "123456789012345",
    "facebookEnabled": true
  }'
```

#### **Opción B: Por Interfaz** (Cuando se implemente)

1. Ve a **Configuración \u003e Integraciones**
2. En la sección **Facebook**:
   - **Config ID**: `123456789012345`
   - **Habilitado**: ✅

---

## 🚀 Paso 4: Probar la Conexión

1. Ve a **Comunicaciones \u003e Canales**
2. Haz clic en **+ Agregar Canal**
3. Selecciona **Facebook Messenger**
4. Serás redirigido a Facebook con una pantalla que dice:
   - "**Selecciona los activos a los que [Cloudfly] puede acceder**"
5. Selecciona las páginas de Facebook que quieres conectar
6. Haz clic en **Continuar**
7. ✅ Deberías ver: "Facebook Messenger conectado exitosamente"

---

## 🔍 Solución de Problemas

### Error: "Facebook integration is not enabled for this tenant"

**Causa**: El tenant no tiene `facebookEnabled = true` en `CustomerConfig`

**Solución**:
```bash
curl -X PUT /api/customer-config \
  -d '{"facebookEnabled": true}'
```

### Error: "facebook_not_configured"

**Causa**: Falta el `facebookLoginConfigId` en `CustomerConfig`

**Solución**: Configura el `config_id` (ver Paso 3.2)

### Error: "no_pages_found" sigue apareciendo

**Posibles causas**:
1. Estás usando `scope` en lugar de `config_id` (verifica que el backend esté actualizado)
2. La configuración en Meta no se guardó correctamente
3. El usuario no tiene páginas de Facebook

**Solución**:
- Verifica los logs del backend: busca `"config_id"` en la URL generada
- Elimina la app de Facebook Settings y vuelve a autorizar
- Verifica que el usuario tenga al menos una página de Facebook Business

### Error: "Facebook App ID not configured"

**Causa**: Falta configuración global en `SystemConfig` o específica en `CustomerConfig`

**Solución**: Configura `facebookAppId` y `facebookAppSecret` en SystemConfig (Paso 3.1)

---

## 🏗️ Arquitectura Multitenant

### Configuración Compartida (SystemConfig)
- **App ID y Secret globales**: Todos los tenants usan la misma app de Facebook
- **API Version y Frontend URL**: Configuración global

### Configuración por Tenant (CustomerConfig)
- **`facebookLoginConfigId`**: Cada tenant tiene su propia configuración en Meta
- **Opción de sobrescribir App ID/Secret**: Si un tenant quiere usar su propia app

**Flujo de decisión:**
```
¿El tenant tiene facebookAppId propio?
  ├─ SÍ → Usar credenciales del tenant (CustomerConfig)
  └─ NO → Usar credenciales globales (SystemConfig)
```

---

## 📝 Notas Importantes

1. **Una configuración por tenant**: Cada tenant necesita su propio `config_id` de Meta
2. **Migración**: Si tenías Facebook conectado con el sistema antiguo, debes reconectar
3. **Instagram**: Usa el mismo flujo, pero con `instagramLoginConfigId` y endpoint `/api/channels/instagram/auth-url`
4. **Producción**: Asegúrate de configurar el dominio de producción en Meta App Settings \u003e Dominios

---

## 🔗 Enlaces Útiles

- [Documentación oficial de Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/)
- [Panel de Apps de Meta](https://developers.facebook.com/apps/)
- [Permisos de Facebook](https://developers.facebook.com/docs/permissions/reference)

---

## ✅ Checklist

Antes de considerar la configuración completa:

- [ ] App de Facebook es tipo "Business"
- [ ] Producto "Login for Business" agregado
- [ ] Configuración creada con System User Token
- [ ] `config_id` copiado
- [ ] SystemConfig tiene App ID/Secret
- [ ] CustomerConfig tiene `config_id` y `facebookEnabled=true`
- [ ] Prueba exitosa de conexión
- [ ] Página de Facebook conectada correctamente

---

¿Necesitas ayuda? Revisa los logs del backend con el tag `[FB-OAUTH]` para más detalles.
