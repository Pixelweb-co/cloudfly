package com.app.starter1.controllers;

import com.app.starter1.dto.ChatbotConfigDTO;
import com.app.starter1.persistence.services.ChatbotService;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final UserMethods userMethods;

    @GetMapping("/config")
    public ResponseEntity<ChatbotConfigDTO> getConfig() {
        Long tenantId = userMethods.getTenantId();
        return ResponseEntity.ok(chatbotService.getConfigByTenant(tenantId));
    }

    @PostMapping("/config")
    public ResponseEntity<ChatbotConfigDTO> updateConfig(@RequestBody ChatbotConfigDTO dto) {
        Long tenantId = userMethods.getTenantId();
        return ResponseEntity.ok(chatbotService.createOrUpdateConfig(tenantId, dto));
    }

    @PostMapping("/activate")
    public ResponseEntity<ChatbotConfigDTO> activateChatbot() {
        Long tenantId = userMethods.getTenantId();
        return ResponseEntity.ok(chatbotService.activateChatbot(tenantId));
    }

    @GetMapping("/qr")
    public ResponseEntity<ChatbotConfigDTO> getQrCode() {
        Long tenantId = userMethods.getTenantId();
        return ResponseEntity.ok(chatbotService.getQrCode(tenantId));
    }
}
