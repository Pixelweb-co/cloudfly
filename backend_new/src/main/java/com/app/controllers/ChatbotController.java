package com.app.controllers;

import com.app.dto.ChatbotConfigDTO;
import com.app.persistence.services.ChatbotService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final UserService userService;

    private Mono<Long> getCurrentTenantId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .doOnNext(auth -> log.info("🔐 [CHATBOT-AUTH] Checking auth for: {}", auth != null ? auth.getName() : "NULL"))
                .flatMap(auth -> userService.findByUsername(auth.getName()))
                .map(user -> {
                    log.info("👤 [CHATBOT-AUTH] Found user: {} with customerId: {}", user.getUsername(), user.getCustomerId());
                    return user.getCustomerId();
                })
                .doOnTerminate(() -> log.info("🏁 [CHATBOT-AUTH] Tenant lookup finished"));
    }

    @GetMapping("/config")
    public Mono<ResponseEntity<ChatbotConfigDTO>> getConfig() {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    log.info("📋 [CHATBOT] Getting config for tenantId: {}", tenantId);
                    return chatbotService.getConfigByTenant(tenantId);
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/qr")
    public Mono<ResponseEntity<ChatbotConfigDTO>> getQrCode() {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    log.info("🔲 [CHATBOT] Getting status/QR for tenantId: {}", tenantId);
                    return chatbotService.getStatus(tenantId);
                })
                .map(ResponseEntity::ok);
    }

    @PostMapping("/activate")
    public Mono<ResponseEntity<ChatbotConfigDTO>> activateChatbot() {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    log.info("🚀 [CHATBOT] Activating chatbot for tenantId: {}", tenantId);
                    return chatbotService.activateChatbot(tenantId);
                })
                .map(ResponseEntity::ok);
    }
}
