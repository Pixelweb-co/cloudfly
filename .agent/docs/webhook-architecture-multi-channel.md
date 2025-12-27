# 🔔 Arquitectura de Webhooks Multi-Canal

## 🎯 Concepto Clave

CloudFly maneja **UN ÚNICO WEBHOOK por plataforma** que recibe mensajes de **TODOS los clientes**.

```
┌──────────────────────────────────────────────────────────────┐
│              ESTRATEGIA DE WEBHOOKS                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  WhatsApp (Evolution API):                                  │
│    - 1 webhook por instancia (por tenant)                   │
│    - URL: /api/webhooks/whatsapp/{tenantId}                │
│                                                              │
│  Facebook Messenger:                                         │
│    - 1 webhook GLOBAL (todos los tenants)                   │
│    - URL: /api/webhooks/facebook                            │
│    - Discrimina por page_id                                 │
│                                                              │
│  Instagram Direct:                                           │
│    - 1 webhook GLOBAL (todos los tenants)                   │
│    - URL: /api/webhooks/instagram                           │
│    - Discrimina por account_id                              │
│                                                              │
│  TikTok:                                                     │
│    - 1 webhook GLOBAL (todos los tenants)                   │
│    - URL: /api/webhooks/tiktok                              │
│    - Discrimina por business_id                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Implementación del Webhook de Facebook

### **1. Controller Principal**

```java
package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.services.ChatbotService;
import com.app.starter1.services.FacebookMessengerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/webhooks/facebook")
@Slf4j
@RequiredArgsConstructor
public class FacebookWebhookController {
    
    @Value("${facebook.webhook.verify-token}")
    private String webhookVerifyToken;
    
    @Value("${facebook.app.secret}")
    private String appSecret;
    
    private final FacebookMessengerService facebookService;
    private final ChatbotService chatbotService;
    private final ChannelRepository channelRepository;
    
    /**
     * ============================================================
     * VERIFICACIÓN INICIAL DEL WEBHOOK
     * 
     * Facebook llama este endpoint con GET cuando configuras
     * el webhook en el Developer Console.
     * 
     * Solo se ejecuta UNA VEZ al configurar la app.
     * ============================================================
     */
    @GetMapping
    public ResponseEntity<?> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge
    ) {
        log.info("🔍 [FACEBOOK-WEBHOOK] Verification request received");
        log.info("   Mode: {}, Token provided: {}", mode, token != null ? "***" : "null");
        
        if ("subscribe".equals(mode) && webhookVerifyToken.equals(token)) {
            log.info("✅ [FACEBOOK-WEBHOOK] Verification successful!");
            return ResponseEntity.ok(challenge);
        }
        
        log.error("❌ [FACEBOOK-WEBHOOK] Verification failed - Invalid token");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }
    
    /**
     * ============================================================
     * RECEPCIÓN DE EVENTOS EN TIEMPO REAL
     * 
     * Facebook envía TODOS los mensajes de TODAS las páginas aquí.
     * Usamos el page_id para identificar a qué cliente pertenece.
     * ============================================================
     */
    @PostMapping
    public ResponseEntity<?> receiveWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature
    ) {
        log.info("📨 [FACEBOOK-WEBHOOK] Event received from Facebook");
        log.debug("   Payload size: {} bytes", payload.length());
        
        try {
            // ==========================================
            // PASO 1: Validar firma de seguridad
            // ==========================================
            if (!validateSignature(payload, signature)) {
                log.error("❌ [FACEBOOK-WEBHOOK] Invalid signature - Possible security breach!");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }
            
            // ==========================================
            // PASO 2: Parsear payload JSON
            // ==========================================
            Map<String, Object> data = parsePayload(payload);
            String object = (String) data.get("object");
            
            if (!"page".equals(object)) {
                log.warn("⚠️ [FACEBOOK-WEBHOOK] Unknown object type: {}", object);
                return ResponseEntity.ok().build();
            }
            
            // ==========================================
            // PASO 3: Procesar cada entry (página)
            // ==========================================
            List<Map<String, Object>> entries = (List<Map<String, Object>>) data.get("entry");
            
            for (Map<String, Object> entry : entries) {
                String pageId = entry.get("id").toString();
                
                log.info("📄 [FACEBOOK-WEBHOOK] Processing events for page: {}", pageId);
                
                // ==========================================
                // PASO 4: Buscar canal en BD por page_id
                // ==========================================
                Optional<Channel> channelOpt = channelRepository.findByPageId(pageId);
                
                if (channelOpt.isEmpty()) {
                    log.warn("⚠️ [FACEBOOK-WEBHOOK] Page not configured: {}", pageId);
                    continue; // Ignorar páginas no configuradas
                }
                
                Channel channel = channelOpt.get();
                Long customerId = channel.getCustomer().getId();
                
                log.info("✅ [FACEBOOK-WEBHOOK] Found channel for customer: {}", customerId);
                
                // ==========================================
                // PASO 5: Procesar mensajes
                // ==========================================
                List<Map<String, Object>> messaging = 
                    (List<Map<String, Object>>) entry.get("messaging");
                
                if (messaging != null) {
                    for (Map<String, Object> event : messaging) {
                        processMessagingEvent(channel, event);
                    }
                }
            }
            
            // ==========================================
            // PASO 6: Siempre responder 200 OK a Facebook
            // ==========================================
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("❌ [FACEBOOK-WEBHOOK] Error processing webhook: {}", e.getMessage(), e);
            // Aún así devolver 200 para que Facebook no reintente
            return ResponseEntity.ok().build();
        }
    }
    
    /**
     * ============================================================
     * VALIDAR FIRMA DE SEGURIDAD
     * 
     * Facebook firma cada webhook con tu App Secret.
     * Esto previene ataques de spoofing.
     * ============================================================
     */
    private boolean validateSignature(String payload, String signature) {
        if (signature == null || signature.isEmpty()) {
            log.warn("⚠️ [FACEBOOK-WEBHOOK] No signature provided");
            return false;
        }
        
        try {
            // Remover prefijo "sha256="
            String expectedSig = signature.replace("sha256=", "");
            
            // Calcular HMAC-SHA256
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(appSecret.getBytes(), "HmacSHA256");
            mac.init(keySpec);
            
            byte[] hash = mac.doFinal(payload.getBytes());
            
            // Convertir a hex
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            
            String calculatedSig = hexString.toString();
            
            boolean valid = calculatedSig.equals(expectedSig);
            
            if (!valid) {
                log.error("❌ [FACEBOOK-WEBHOOK] Signature mismatch!");
                log.debug("   Expected: {}", expectedSig);
                log.debug("   Calculated: {}", calculatedSig);
            }
            
            return valid;
            
        } catch (Exception e) {
            log.error("❌ [FACEBOOK-WEBHOOK] Error validating signature: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * ============================================================
     * PARSEAR PAYLOAD JSON
     * ============================================================
     */
    private Map<String, Object> parsePayload(String payload) {
        // Usar tu JSON parser preferido (Jackson, Gson, etc.)
        return objectMapper.readValue(payload, Map.class);
    }
    
    /**
     * ============================================================
     * PROCESAR EVENTO DE MENSAJERÍA
     * 
     * Aquí se manejan los diferentes tipos de eventos:
     * - message: Mensaje de texto del usuario
     * - postback: Usuario presionó un botón
     * - delivery: Mensaje fue entregado (opcional)
     * - read: Usuario leyó el mensaje (opcional)
     * ============================================================
     */
    private void processMessagingEvent(Channel channel, Map<String, Object> event) {
        try {
            String senderId = ((Map<String, Object>) event.get("sender")).get("id").toString();
            Long customerId = channel.getCustomer().getId();
            String pageAccessToken = channel.getAccessToken();
            
            // ==========================================
            // Tipo 1: MENSAJE DE TEXTO
            // ==========================================
            if (event.containsKey("message")) {
                Map<String, Object> message = (Map<String, Object>) event.get("message");
                String messageId = (String) message.get("mid");
                String text = (String) message.get("text");
                
                if (text != null && !text.isEmpty()) {
                    log.info("💬 [FACEBOOK-MSG] From user {} to customer {}: {}", 
                            senderId, customerId, text);
                    
                    // Obtener perfil del usuario
                    Map<String, Object> userProfile = facebookService.getUserProfile(
                        pageAccessToken, senderId
                    );
                    
                    String userName = userProfile.getOrDefault("first_name", "Usuario").toString();
                    
                    // Procesar con chatbot
                    String response = chatbotService.processMessage(
                        customerId,
                        senderId,
                        text,
                        "facebook",
                        Map.of(
                            "userName", userName,
                            "channel", channel.getName(),
                            "messageId", messageId
                        )
                    );
                    
                    // Enviar respuesta
                    facebookService.sendTextMessage(pageAccessToken, senderId, response);
                    
                    log.info("✅ [FACEBOOK-MSG] Response sent to user {}", senderId);
                }
                
                // Adjuntos (imágenes, archivos, etc.)
                if (message.containsKey("attachments")) {
                    handleAttachments(channel, senderId, 
                        (List<Map<String, Object>>) message.get("attachments"));
                }
            }
            
            // ==========================================
            // Tipo 2: POSTBACK (Botón presionado)
            // ==========================================
            else if (event.containsKey("postback")) {
                Map<String, Object> postback = (Map<String, Object>) event.get("postback");
                String payload = (String) postback.get("payload");
                String title = (String) postback.get("title");
                
                log.info("🔘 [FACEBOOK-POSTBACK] User {} clicked: {} (payload: {})", 
                        senderId, title, payload);
                
                handlePostback(channel, senderId, payload, title);
            }
            
            // ==========================================
            // Tipo 3: DELIVERY (Mensaje entregado)
            // ==========================================
            else if (event.containsKey("delivery")) {
                log.debug("✉️ [FACEBOOK-DELIVERY] Message delivered to user {}", senderId);
                // Opcional: Actualizar estado del mensaje en BD
            }
            
            // ==========================================
            // Tipo 4: READ (Usuario leyó el mensaje)
            // ==========================================
            else if (event.containsKey("read")) {
                log.debug("👁️ [FACEBOOK-READ] User {} read message", senderId);
                // Opcional: Actualizar estado del mensaje en BD
            }
            
        } catch (Exception e) {
            log.error("❌ [FACEBOOK-WEBHOOK] Error processing event: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manejar archivos adjuntos (imágenes, videos, archivos)
     */
    private void handleAttachments(Channel channel, String senderId, 
                                   List<Map<String, Object>> attachments) {
        for (Map<String, Object> attachment : attachments) {
            String type = (String) attachment.get("type");
            Map<String, Object> payload = (Map<String, Object>) attachment.get("payload");
            String url = (String) payload.get("url");
            
            log.info("📎 [FACEBOOK-ATTACHMENT] Type: {}, URL: {}", type, url);
            
            // Procesar según tipo: image, video, audio, file
            // Ejemplo: Guardar en storage, analizar con IA, etc.
        }
    }
    
    /**
     * Manejar postbacks (botones)
     */
    private void handlePostback(Channel channel, String senderId, 
                               String payload, String title) {
        String response;
        
        // Enrutar según el payload
        switch (payload) {
            case "GET_STARTED":
                response = "¡Bienvenido! ¿En qué puedo ayudarte hoy?";
                break;
                
            case "VIEW_PRODUCTS":
                response = "Aquí están nuestros productos más populares...";
                break;
                
            case "TALK_TO_AGENT":
                response = "Te estoy conectando con un asesor. Por favor espera un momento.";
                // Crear ticket, notificar agente, etc.
                break;
                
            default:
                // Procesar con chatbot
                response = chatbotService.processPostback(
                    channel.getCustomer().getId(),
                    senderId,
                    payload
                );
        }
        
        facebookService.sendTextMessage(channel.getAccessToken(), senderId, response);
    }
}
```

---

## 🔧 Configuración de Facebook Developer

### **1. En Facebook Developer Console**

```
App Dashboard > Webhooks > Configurar

Callback URL: https://cloudfly.com/api/webhooks/facebook
Verify Token: tu-token-secreto-aqui-12345

Eventos a suscribir:
☑️ messages
☑️ messaging_postbacks
☑️ messaging_optins
☐ messaging_deliveries (opcional)
☐ messaging_reads (opcional)
```

### **2. application.properties**

```properties
# Facebook Messenger Configuration
facebook.app.id=YOUR_APP_ID
facebook.app.secret=YOUR_APP_SECRET
facebook.webhook.verify-token=tu-token-secreto-aqui-12345
facebook.api.url=https://graph.facebook.com/v18.0
```

---

## 🗄️ Actualización de Base de Datos

Agregar índice para búsquedas rápidas por `page_id`:

```sql
-- Índice para búsqueda rápida de canales por page_id
CREATE INDEX idx_channels_page_id ON channels(page_id);

-- Índice para búsqueda por tipo
CREATE INDEX idx_channels_type ON channels(type);

-- Índice compuesto para búsquedas más complejas
CREATE INDEX idx_channels_type_connected ON channels(type, is_connected);
```

---

## 📊 Flujo Completo de un Mensaje

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario envía mensaje en Facebook Messenger                 │
│    "Hola, quiero información sobre precios"                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Facebook Platform envía webhook a CloudFly                  │
│    POST https://cloudfly.com/api/webhooks/facebook              │
│    {                                                             │
│      "object": "page",                                           │
│      "entry": [{                                                 │
│        "id": "123456789",  ◄── page_id                          │
│        "messaging": [{                                           │
│          "sender": {"id": "USER_PSID"},                         │
│          "message": {"text": "Hola, quiero información..."}    │
│        }]                                                        │
│      }]                                                          │
│    }                                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FacebookWebhookController valida firma                      │
│    ✅ Firma válida (App Secret)                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Buscar canal en BD                                           │
│    SELECT * FROM channels WHERE page_id = '123456789'          │
│    ✅ Encontrado: customer_id = 5                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ChatbotService procesa mensaje                              │
│    - Contexto del cliente (customer_id = 5)                     │
│    - Historial de conversación                                  │
│    - IA genera respuesta                                        │
│    ✅ Respuesta: "¡Hola! Nuestros planes empiezan desde $10..." │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. FacebookMessengerService envía respuesta                    │
│    POST https://graph.facebook.com/v18.0/me/messages            │
│    {                                                             │
│      "recipient": {"id": "USER_PSID"},                          │
│      "message": {"text": "¡Hola! Nuestros planes..."}          │
│    }                                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Usuario recibe respuesta en Messenger                       │
│    ✅ "¡Hola! Nuestros planes empiezan desde $10..."           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Seguridad

### **Validación de Firma (Crítico)**

Facebook firma cada webhook con tu App Secret usando HMAC-SHA256:

```
X-Hub-Signature-256: sha256=a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
```

**¿Por qué es crítico?**
- Sin validación, cualquiera podría enviar mensajes falsos a tu sistema
- Podrían crear conversaciones falsas
- Podrían obtener respuestas de tu chatbot sin autorización

---

## 📈 Escalabilidad

### **Manejo de Alto Volumen**

Si tienes muchos clientes con mucho tráfico:

```java
@Async
@Transactional
public void processMessagingEventAsync(Channel channel, Map<String, Object> event) {
    // Procesar en background
    // Usar cola (RabbitMQ, Kafka, etc.) para mayor robustez
}
```

### **Rate Limiting**

Facebook tiene límites de API:
- 200 llamadas/hora por página (tier gratuito)
- Implementar cola de envío si excedes el límite

---

## ✅ Ventajas de Esta Arquitectura

1. ✅ **Un solo webhook** - Fácil de configurar y mantener
2. ✅ **Multi-tenant** - Automáticamente enruta a cada cliente
3. ✅ **Seguro** - Validación de firma en cada request
4. ✅ **Escalable** - Async processing para alto volumen
5. ✅ **Trazable** - Logging detallado de cada evento
6. ✅ **Robusto** - Manejo de errores sin afectar a Facebook

---

## 🔗 Referencias

- [Facebook Webhook Reference](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Security Best Practices](https://developers.facebook.com/docs/messenger-platform/webhooks#security)
- [Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

---

**¿Siguiente paso?** Implementar el código en el backend o configurar primero la app en Facebook Developer?
