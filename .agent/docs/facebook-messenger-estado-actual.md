# 📊 Estado Actual: Módulo de Conversaciones y Facebook Messenger

## ✅ Lo que YA EXISTE (Backend)

### **1. Entidades para Mensajes**

#### `OmniChannelMessage.java` ✅ **COMPLETA**
- ✅ Multi-tenant (`tenantId`)
- ✅ Soporta múltiples plataformas (enum `MessagePlatform`: WHATSAPP, **FACEBOOK_MESSENGER**, INSTAGRAM_DM, etc.)
- ✅ Soporta múltiples proveedores (enum `MessageProvider`: EVOLUTION, **META**, TELEGRAM, etc.)
- ✅ IDs externos (`externalConversationId`, `externalMessageId`)
- ✅ Dirección (`MessageDirection`: INBOUND/OUTBOUND)
- ✅ Tipos de mensaje (`MessageType`: TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT, etc.)
- ✅ Estados (`MessageStatus`: SENT, DELIVERED, READ, FAILED, etc.)
- ✅ Raw payload (para debug)
- ✅ Timestamps (createdAt, sentAt, deliveredAt, readAt)

#### `Channel.java` ✅ **COMPLETA**
- ✅ Multi-tenant (`customer`)
- ✅ Tipos de canal (enum `ChannelType`: WHATSAPP, **FACEBOOK**, INSTAGRAM, TIKTOK)
- ✅ Campos para Facebook: `pageId`, `accessToken`
- ✅ Estado de conexión: `isActive`, `isConnected`
- ✅ Campos genéricos: `webhookUrl`, `apiKey`, `configuration` (JSON)

### **2. Controllers**

#### `ChatController.java` ✅ **COMPLETO**
```java
GET    /api/chat/contacts/{platform}        // Listar contactos por plataforma
GET    /api/chat/messages/{conversationId}  // Obtener mensajes de una conversación
POST   /api/chat/messages                   // Guardar mensaje nuevo
POST   /api/chat/send/{conversationId}      // Enviar mensaje (actualmente solo WhatsApp)
PATCH  /api/chat/messages/read              // Marcar como leído
PATCH  /api/chat/contacts/{contactId}/stage // Actualizar stage del contacto
```

**❌ Problema:** El método `sendToEvolution()` está hardcodeado solo para Evolution API (WhatsApp). No soporta Facebook todavía.

#### `SystemConfigController.java` ✅ **NUEVO - YA IMPLEMENTADO**
```java
GET  /api/system/config  // Obtener configuración del sistema
PUT  /api/system/config  // Actualizar configuración (Facebook App ID, Secret, etc.)
```

### **3. Services**

#### `ChatService.java` ✅ **EXISTE**
- ✅ `saveMessage()` - Guarda mensajes en `omni_channel_messages`
- ✅ `getMessages()` - Recupera mensajes con paginación
- ✅ `markAsRead()` - Marca mensajes como leídos
- ❌ `sendToEvolution()` - **Solo soporta WhatsApp**, necesita ser genérico

#### `SystemConfigService.java` ✅ **NUEVO - YA IMPLEMENTADO**
- ✅ Guarda configuración de Facebook (App ID, Secret, Webhook Token)

---

## ❌ Lo que FALTA Implementar para Facebook Messenger

### **1. Backend: Webhook de Facebook**

#### `FacebookWebhookController.java` ❌ **NO EXISTE**

**Necesita:**
```java
@RestController
@RequestMapping("/webhooks/facebook")
public class FacebookWebhookController {
    
    // GET - Verificación del webhook por Facebook
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
        @RequestParam("hub.mode") String mode,
        @RequestParam("hub.verify_token") String token,
        @RequestParam("hub.challenge") String challenge
    )
    
    // POST - Recibir eventos de Facebook
    @PostMapping
    public ResponseEntity<String> handleWebhook(
        @RequestHeader("X-Hub-Signature-256") String signature,
        @RequestBody String payload
    )
}
```

**Funcionalidades necesarias:**
1. ✅ Validar `X-Hub-Signature-256` usando HMAC SHA256
2. ✅ Parsear payload JSON de Facebook
3. ✅ Identificar `page_id` para encontrar el `Channel` correcto
4. ✅ Extraer datos del mensaje (sender PSID, texto, media, etc.)
5. ✅ Crear `OmniChannelMessage` con:
   - `platform = FACEBOOK_MESSENGER`
   - `provider = META`
   - `externalConversationId = sender_psid`
   - `externalMessageId = mid`
   - `direction = INBOUND`
6. ✅ Guardar en base de datos
7. ✅ (Opcional) Enviar a chatbot si está configurado

---

### **2. Backend: Servicio de Facebook API**

#### `FacebookMessengerService.java` ❌ **NO EXISTE**

**Necesita:**
```java
@Service
public class FacebookMessengerService {
    
    // Enviar mensaje de texto
    public void sendTextMessage(String pageAccessToken, String recipientPsid, String text)
    
    // Enviar imagen
    public void sendImageMessage(String pageAccessToken, String recipientPsid, String imageUrl)
    
    // Obtener perfil del usuario
    public Map<String, Object> getUserProfile(String psid, String pageAccessToken)
    
    // Suscribir webhooks a una página
    public boolean subscribeWebhooks(String pageId, String pageAccessToken)
}
```

---

### **3. Backend: OAuth Controller**

#### `FacebookOAuthController.java` ❌ **NO EXISTE**

**Necesita:**
```java
@RestController
@RequestMapping("/api/channels/facebook")
public class FacebookOAuthController {
    
    // Generar URL de autorización
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthorizationUrl()
    
    // Callback después de autorización
    @GetMapping("/callback")
    public ResponseEntity<?> handleOAuthCallback(
        @RequestParam("code") String code,
        @RequestParam("state") String state
    )
}
```

---

### **4. Backend: Actualizar ChatService**

#### Cambios en `ChatService.sendToEvolution()`

**De:**
```java
public MessageDTO sendToEvolution(String conversationId, MessageCreateRequest request) {
    // Hardcodeado para Evolution API
}
```

**A:**
```java
public MessageDTO sendMessage(String conversationId, MessageCreateRequest request) {
    // Detectar plataforma del conversationId
    MessagePlatform platform = detectPlatform(conversationId);
    
    if (platform == MessagePlatform.WHATSAPP) {
        return sendToEvolution(conversationId, request);
    } else if (platform == MessagePlatform.FACEBOOK_MESSENGER) {
        return sendToFacebook(conversationId, request);
    } else {
        throw new UnsupportedOperationException("Platform not supported");
    }
}
```

---

### **5. Backend: Repository**

#### `OmniChannelMessageRepository.java` ❓ **VERIFICAR SI EXISTE**

**Necesita:**
```java
@Repository
public interface OmniChannelMessageRepository extends JpaRepository<OmniChannelMessage, Long> {
    
    Page<OmniChannelMessage> findByTenantIdAndInternalConversationId(
        Long tenantId, String conversationId, Pageable pageable
    );
    
    Optional<OmniChannelMessage> findByExternalMessageId(String externalMessageId);
}
```

---

## 🎨 Frontend

### **1. Página de Configuración del Sistema**

#### `/settings/system/page.tsx` ✅ **YA IMPLEMENTADO**
- ✅ Tab 1: Configuración General
- ✅ Tab 2: Integración Facebook
  - ✅ Facebook App ID
  - ✅ Facebook App Secret
  - ✅ Redirect URI
  - ✅ Webhook Verify Token
  - ✅ API Version
  - ✅ URL del webhook (https://api.cloudfly.com.co/webhooks/facebook)

### **2. Página de Configuración de Canal Facebook**

#### `/comunicaciones/canales/configurar/facebook/page.tsx` ❌ **NO EXISTE**

**Necesita:**
- ❌ Botón "Conectar con Facebook" (OAuth)
- ❌ Selector de página (si el usuario tiene múltiples)
- ❌ Mostrar estado de conexión
- ❌ Mostrar Page ID conectado
- ❌ Botón para desconectar

### **3. Módulo de Conversaciones**

#### Frontend de Chat ❓ **VERIFICAR SI EXISTE**

**Ruta probable:** `/comunicaciones/conversaciones` o `/chat`

**Necesita:**
- ❓ Listar conversaciones por plataforma (WHATSAPP, FACEBOOK_MESSENGER)
- ❓ Ver mensajes de una conversación
- ❓ Enviar mensajes
- ❓ Marcar como leído
- ❓ Indicadores visuales (Facebook logo para mensajes de FB)

---

## 📊 Base de Datos

### **Tablas Existentes** ✅

```sql
✅ omni_channel_messages  -- Todos los mensajes de todas las plataformas
✅ channels               -- Canales configurados (WhatsApp, Facebook, etc.)
✅ system_config          -- Configuración global (Facebook App ID, Secret, etc.)
```

### **Índices Necesarios** ❌

```sql
-- Para búsquedas rápidas por page_id en webhooks
CREATE INDEX idx_channels_page_id ON channels(page_id);
CREATE INDEX idx_channels_type_page ON channels(type, page_id);
```

---

## 🔄 Flujo Completo de Facebook Messenger

### **📥 Recibir Mensaje (INBOUND)**

```
1. Usuario escribe mensaje en Facebook Messenger
2. Facebook envía POST a https://api.cloudfly.com.co/webhooks/facebook
3. FacebookWebhookController.handleWebhook()
   ├─ Valida signature (X-Hub-Signature-256)
   ├─ Parsea JSON payload
   ├─ Extrae page_id del evento
   ├─ Busca Channel por page_id y type=FACEBOOK
   ├─ Extrae sender PSID, texto, media, etc.
   └─ Crea OmniChannelMessage:
      - platform = FACEBOOK_MESSENGER
      - provider = META
      - externalConversationId = sender_psid
      - externalMessageId = mid
      - direction = INBOUND
      - body = texto del mensaje
      - tenantId = customer_id del Channel
4. ChatService.saveMessage()
5. (Opcional) ChatbotService.processMessage() si hay chatbot configurado
6. Mensaje aparece en frontend de conversaciones
```

### **📤 Enviar Mensaje (OUTBOUND)**

```
1. Usuario escribe respuesta en frontend
2. POST /api/chat/send/{conversationId}
3. ChatService.sendMessage()
   ├─ Detecta platform = FACEBOOK_MESSENGER
   ├─ Busca Channel por conversationId
   ├─ Obtiene pageAccessToken del Channel
   └─ FacebookMessengerService.sendTextMessage(pageAccessToken, recipientPsid, text)
4. Facebook API responde con message_id
5. Guarda OmniChannelMessage:
   - direction = OUTBOUND
   - externalMessageId = mid de Facebook
   - status = SENT
6. Mensaje aparece en frontend
```

---

## ✅ Checklist de Implementación

### **Fase 1: Configuración (✅ COMPLETA)**
- [x] SystemConfig entity
- [x] SystemConfigService
- [x] SystemConfigController
- [x] Frontend `/settings/system`
- [x] SecurityConfig permisos para `/api/system/**`

### **Fase 2: Webhook (❌ FALTA)**
- [ ] FacebookWebhookController
- [ ] Validación de firma HMAC SHA256
- [ ] Parseo de eventos de Facebook
- [ ] Guardar mensajes INBOUND
- [ ] Routing por page_id a customer correcto

### **Fase 3: Envío de Mensajes (❌ FALTA)**
- [ ] FacebookMessengerService
- [ ] Actualizar ChatService para soportar Facebook
- [ ] Enviar mensajes OUTBOUND
- [ ] Manejo de errores y retry

### **Fase 4: OAuth (❌ FALTA)**
- [ ] FacebookOAuthController
- [ ] Frontend: Botón "Conectar Facebook"
- [ ] Flow completo de autorización
- [ ] Guardar Page Access Token

### **Fase 5: Frontend Chat (❓ VERIFICAR)**
- [ ] Verificar si existe módulo de conversaciones
- [ ] Adaptar para mostrar Facebook Messenger
- [ ] Iconos y badges por plataforma

---

## 🚀 Próximo Paso Recomendado

**Implementar el Webhook de Facebook (Fase 2)** es lo más crítico, porque:

1. ✅ Ya tienes la configuración guardada (`SystemConfig`)
2. ✅ Ya tienes la entidad para guardar mensajes (`OmniChannelMessage`)
3. ❌ Pero no puedes recibir mensajes de Facebook todavía

**Orden de implementación sugerido:**

1. **FacebookWebhookController** (recibir mensajes)
2. **FacebookMessengerService** (enviar mensajes)
3. **FacebookOAuthController** (conectar páginas)
4. **Actualizar ChatService** (soporte multi-plataforma)
5. **Frontend de conexión** (botón OAuth)

¿Quieres que comience con el **FacebookWebhookController**? 🚀
