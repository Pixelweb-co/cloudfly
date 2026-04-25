package com.app.controllers;

import com.app.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
public class ChatbotConfigController {

    private final ContactRepository contactRepository;
    private final WebClient chatSocketClient;

    public ChatbotConfigController(
            ContactRepository contactRepository,
            @Value("${services.socket.url:http://chat-socket-service:3001}") String socketUrl) {
        this.contactRepository = contactRepository;
        this.chatSocketClient = WebClient.builder().baseUrl(socketUrl).build();
    }

    /**
     * Toggle chatbot enabled/disabled for a specific contact.
     * POST /api/contacts/{contactId}/chatbot-toggle
     * Body: { "enabled": true/false }
     */
    @PostMapping("/{contactId}/chatbot-toggle")
    public Mono<ResponseEntity<Map<String, Object>>> toggleChatbot(
            @PathVariable Long contactId,
            @RequestBody Map<String, Object> body) {

        Boolean enabled = (Boolean) body.get("enabled");
        if (enabled == null) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Field 'enabled' is required")));
        }

        log.info("🤖 [CHATBOT-CONFIG] Toggle chatbot for contact {} → {}", contactId, enabled);

        return contactRepository.findById(contactId)
                .flatMap(contact -> {
                    contact.setChatbotEnabled(enabled);
                    return contactRepository.save(contact);
                })
                .flatMap(saved -> {
                    // Call chat-socket-service to invalidate Redis cache
                    Long tenantId = saved.getTenantId() != null ? saved.getTenantId() : 1L;
                    return invalidateChatbotCache(contactId, tenantId, enabled)
                            .thenReturn(ResponseEntity.ok(Map.<String, Object>of(
                                    "contactId", saved.getId(),
                                    "chatbotEnabled", saved.getChatbotEnabled()
                            )));
                })
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Notify chat-socket-service to invalidate the chatbot cache for this contact.
     */
    private Mono<Void> invalidateChatbotCache(Long contactId, Long tenantId, Boolean enabled) {
        return chatSocketClient.post()
                .uri("/api/contacts/{contactId}/chatbot-toggle", contactId)
                .bodyValue(Map.of("enabled", enabled, "tenantId", tenantId))
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(res -> log.info("✅ [CHATBOT-CONFIG] Cache invalidated via chat-socket for contact {}", contactId))
                .doOnError(err -> log.warn("⚠️ [CHATBOT-CONFIG] Failed to invalidate cache via chat-socket: {}", err.getMessage()))
                .onErrorResume(e -> Mono.empty()) // Don't fail the toggle if cache invalidation fails
                .then();
    }

    /**
     * Check if chatbot is enabled for a contact.
     * POST /api/chatbotEnable
     * Body: { "tenantId": number, "contactId": number }
     */
    @PostMapping("/chatbotEnable")
    public Mono<ResponseEntity<Map<String, Object>>> checkChatbotEnable(@RequestBody Map<String, Object> body) {
        Number tenantIdNum = (Number) body.get("tenantId");
        Number contactIdNum = (Number) body.get("contactId");

        if (tenantIdNum == null || contactIdNum == null) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "tenantId and contactId are required")));
        }

        Long contactId = contactIdNum.longValue();

        log.info("🤖 [CHATBOT-GATE] Checking chatbot status for contact {}", contactId);

        return contactRepository.findById(contactId)
                .map(contact -> {
                    boolean chatEnabled = contact.getChatbotEnabled() != null ? contact.getChatbotEnabled() : true;
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "contactId", contact.getId(),
                            "chatbotEnabled", chatEnabled
                    ));
                })
                .defaultIfEmpty(ResponseEntity.ok(Map.of("chatbotEnabled", (Object) true)));
    }
}
