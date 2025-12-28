package com.app.starter1.controllers;

import com.app.starter1.dto.MessageCreateRequest;
import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.services.ChatService;
import com.app.starter1.services.SystemConfigService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/webhooks/facebook")
@RequiredArgsConstructor
public class FacebookWebhookController {

    private final SystemConfigService systemConfigService;
    private final ChannelRepository channelRepository;
    private final ChatService chatService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Verificación del Webhook por Facebook
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        log.info("🔍 [FB-WEBHOOK] Verifying webhook subscription...");

        SystemConfigDTO config = systemConfigService.getSystemConfigInternal();
        String expectedToken = config.getFacebookWebhookVerifyToken();

        if (expectedToken == null || expectedToken.isEmpty()) {
            log.error("❌ [FB-WEBHOOK] Verify token not configured");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Token not configured");
        }

        if ("subscribe".equals(mode) && expectedToken.equals(token)) {
            log.info("✅ [FB-WEBHOOK] Webhook verified successfully!");
            return ResponseEntity.ok(challenge);
        } else {
            log.warn("❌ [FB-WEBHOOK] Verification failed. Token mismatch.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
        }
    }

    /**
     * Recepción de eventos (POST) de Facebook
     */
    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestBody String payload) {
        log.info("📩 [FB-WEBHOOK] Received event payload");

        try {
            JsonNode root = objectMapper.readTree(payload);
            String object = root.path("object").asText();

            if ("page".equals(object)) {
                JsonNode entries = root.path("entry");
                for (JsonNode entry : entries) {
                    processEntry(entry);
                }
                return ResponseEntity.ok("EVENT_RECEIVED");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            log.error("❌ [FB-WEBHOOK] Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void processEntry(JsonNode entry) {
        String pageId = entry.path("id").asText();
        JsonNode messagingEvents = entry.path("messaging");

        for (JsonNode event : messagingEvents) {
            if (event.has("message")) {
                processMessageEvent(pageId, event);
            }
        }
    }

    private void processMessageEvent(String pageId, JsonNode event) {
        // Buscar canal activo por Page ID
        // Usamos el metodo que acabamos de agregar al repositorio
        Optional<Channel> channelOpt = channelRepository.findByPageIdAndIsActiveTrue(pageId);

        if (channelOpt.isEmpty()) {
            log.warn("⚠️ [FB-WEBHOOK] No active channel found for Page ID: {}", pageId);
            return;
        }

        Channel channel = channelOpt.get();
        Long tenantId = channel.getCustomer().getId();

        String senderId = event.path("sender").path("id").asText();
        JsonNode messageNode = event.path("message");

        // Ignorar mensajes enviados por la propia pagina (eco) si es necesario
        // Pero a veces queremos ver nuestros propios mensajes
        if (event.has("delivery") || event.has("read")) {
            return;
        }

        String text = messageNode.path("text").asText();
        String mediaUrl = null;

        // Manejo básico de adjuntos (imágenes)
        if (messageNode.has("attachments")) {
            JsonNode attachments = messageNode.path("attachments");
            if (attachments.isArray() && attachments.size() > 0) {
                JsonNode firstAttachment = attachments.get(0);
                if ("image".equals(firstAttachment.path("type").asText())) {
                    mediaUrl = firstAttachment.path("payload").path("url").asText();
                }
            }
        }

        if ((text == null || text.isEmpty()) && mediaUrl == null) {
            log.debug("Skipping message with no content");
            return;
        }

        log.info("📨 [FB-WEBHOOK] Processing message from: {} for tenant: {}", senderId, tenantId);

        try {
            // Crear request para ChatService
            MessageCreateRequest request = new MessageCreateRequest();
            request.setTenantId(tenantId);

            // ID conversacion único: prefijo fb_ + PSID del usuario
            String conversationId = "fb_" + senderId;
            request.setConversationId(conversationId);

            // request.setFromUserId(senderId); // Omitido: es para usuario interno
            request.setDirection("INCOMING");
            request.setMessageType(mediaUrl != null ? "IMAGE" : "TEXT");
            request.setBody(text != null ? text : "");
            request.setMediaUrl(mediaUrl);
            request.setPlatform("FACEBOOK");
            request.setTitle("Facebook User");

            // Guardar usando el servicio existente
            chatService.saveMessage(request);

            log.info("✅ [FB-WEBHOOK] Message saved successfully");

        } catch (Exception e) {
            log.error("❌ [FB-WEBHOOK] Error saving message: {}", e.getMessage(), e);
        }
    }
}
