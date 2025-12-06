package com.app.starter1.controllers;

import com.app.starter1.dto.ChatbotConfigDTO;
import com.app.starter1.persistence.services.ChatbotService;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final UserMethods userMethods;

    @GetMapping("/config")
    public ResponseEntity<ChatbotConfigDTO> getConfig() {
        Long tenantId = userMethods.getTenantId();
        log.info("📋 [CHATBOT] Getting config for tenantId: {}", tenantId);
        ChatbotConfigDTO config = chatbotService.getConfigByTenant(tenantId);
        log.info("✅ [CHATBOT] Config retrieved: {}", config != null ? "Found" : "Not found");
        return ResponseEntity.ok(config);
    }

    @PostMapping("/config")
    public ResponseEntity<ChatbotConfigDTO> updateConfig(@RequestBody ChatbotConfigDTO dto) {
        Long tenantId = userMethods.getTenantId();
        log.info("💾 [CHATBOT] Updating config for tenantId: {}, instanceName: {}", tenantId, dto.getInstanceName());
        ChatbotConfigDTO updated = chatbotService.createOrUpdateConfig(tenantId, dto);
        log.info("✅ [CHATBOT] Config updated successfully");
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/activate")
    public ResponseEntity<ChatbotConfigDTO> activateChatbot() {
        Long tenantId = userMethods.getTenantId();
        log.info("🚀 [CHATBOT] ACTIVATING chatbot for tenantId: {}", tenantId);
        try {
            ChatbotConfigDTO result = chatbotService.activateChatbot(tenantId);
            log.info("✅ [CHATBOT] Chatbot activated successfully for tenantId: {}", tenantId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ [CHATBOT] Error activating chatbot for tenantId: {}, error: {}", tenantId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/qr")
    public ResponseEntity<ChatbotConfigDTO> getQrCode() {
        Long tenantId = userMethods.getTenantId();
        log.info("🔲 [CHATBOT] Getting QR code for tenantId: {}", tenantId);
        ChatbotConfigDTO result = chatbotService.getQrCode(tenantId);
        log.info("✅ [CHATBOT] QR code retrieved for tenantId: {}", tenantId);
        return ResponseEntity.ok(result);
    }
}
