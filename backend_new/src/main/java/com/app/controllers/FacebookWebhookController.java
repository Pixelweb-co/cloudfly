package com.app.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks/facebook")
public class FacebookWebhookController {

    @Value("${facebook.verify.token:cloudfly_verify_token}")
    private String verifyToken;

    /**
     * Endpoint para la verificación inicial de Meta (Hub Challenge).
     */
    @GetMapping
    public Mono<ResponseEntity<String>> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {
        
        log.info("🔍 [FB-WEBHOOK] Verification request. Mode: {}, Token: {}", mode, token);
        
        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("✅ [FB-WEBHOOK] Webhook verified successfully!");
            return Mono.just(ResponseEntity.ok(challenge));
        } else {
            log.warn("❌ [FB-WEBHOOK] Verification failed. Expected token: {}", verifyToken);
            return Mono.just(ResponseEntity.status(403).build());
        }
    }

    /**
     * Endpoint para recibir eventos de mensajes de Facebook.
     */
    @PostMapping
    public Mono<ResponseEntity<Void>> handleWebhookEvent(@RequestBody Map<String, Object> payload) {
        log.info("📩 [FB-WEBHOOK] Received event: {}", payload);
        
        // El objeto de Facebook tiene estructura: { object: 'page', entry: [ { id: 'PAGE_ID', messaging: [...] } ] }
        if ("page".equals(payload.get("object"))) {
            List<Map<String, Object>> entries = (List<Map<String, Object>>) payload.get("entry");
            if (entries != null) {
                for (Map<String, Object> entry : entries) {
                    String pageId = (String) entry.get("id");
                    List<Map<String, Object>> messagingEvents = (List<Map<String, Object>>) entry.get("messaging");
                    
                    if (messagingEvents != null) {
                        for (Map<String, Object> event : messagingEvents) {
                            if (event.containsKey("message")) {
                                processMessageEvent(pageId, event);
                            }
                        }
                    }
                }
            }
        }
        
        return Mono.just(ResponseEntity.ok().build());
    }

    private void processMessageEvent(String pageId, Map<String, Object> event) {
        Map<String, Object> sender = (Map<String, Object>) event.get("sender");
        Map<String, Object> message = (Map<String, Object>) event.get("message");
        
        String senderId = (String) sender.get("id");
        String text = (String) message.get("text");
        
        log.info("💬 [FB-WEBHOOK] Message from {} to page {}: {}", senderId, pageId, text);
        
        // TODO: Aquí se debe invocar el servicio que guarda el mensaje en la DB 
        // e identifica el tenant/compañía buscando el pageId en la tabla 'channels'.
    }
}
