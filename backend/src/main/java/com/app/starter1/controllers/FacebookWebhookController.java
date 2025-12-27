package com.app.starter1.controllers;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.services.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/webhooks/facebook")
@RequiredArgsConstructor
public class FacebookWebhookController {

    private final SystemConfigService systemConfigService;

    /**
     * Verificación del Webhook por Facebook
     * Este endpoint es llamado por Facebook cuando haces clic en "Verificar y
     * guardar"
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {
        log.info("🔍 [FB-WEBHOOK] Verifying webhook subscription...");
        log.info("Hub Mode: {}", mode);

        // Usar método interno para obtener el token sin enmascarar
        SystemConfigDTO config = systemConfigService.getSystemConfigInternal();
        String expectedToken = config.getFacebookWebhookVerifyToken();

        if (expectedToken == null || expectedToken.isEmpty()) {
            log.error("❌ [FB-WEBHOOK] Verify token not configured in System Config");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token not configured");
        }

        log.info("🔑 [FB-WEBHOOK] Expected token: {}", expectedToken);
        log.info("🔑 [FB-WEBHOOK] Received token: {}", token);

        if ("subscribe".equals(mode) && expectedToken.equals(token)) {
            log.info("✅ [FB-WEBHOOK] Webhook verified successfully!");
            // Facebook espera recibir SOLO el challenge como respuesta
            return ResponseEntity.ok(challenge);
        } else {
            log.warn("❌ [FB-WEBHOOK] Verification failed. Token mismatch.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
        }
    }

    /**
     * Recepción de eventos (POST)
     * Este endpoint recibirá los mensajes cuando los implementemos
     */
    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestBody String payload) {
        // Por ahora solo respondemos OK para que Facebook sepa que el endpoint existe
        log.info("📩 [FB-WEBHOOK] Received event: {}", payload);
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
