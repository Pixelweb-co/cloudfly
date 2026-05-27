package com.app.controllers;

import com.app.persistence.entity.ChatbotEntity;
import com.app.persistence.repository.ChatbotRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chatbots")
public class ChatbotController {

    private final ChatbotRepository chatbotRepository;
    private final WebClient aiServiceClient;

    public ChatbotController(
            ChatbotRepository chatbotRepository,
            @Value("${services.ai.url:http://ai-agent:5000}") String aiServiceUrl) {
        this.chatbotRepository = chatbotRepository;
        this.aiServiceClient = WebClient.builder().baseUrl(aiServiceUrl).build();
    }

    @GetMapping
    public Mono<ResponseEntity<ChatbotEntity>> getChatbot(@RequestParam Integer tenantId) {
        log.info("🔍 [CHATBOT-API] Fetching chatbot for tenant {}", tenantId);
        return chatbotRepository.findByTenantId(tenantId)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ChatbotEntity> createChatbot(@RequestBody ChatbotEntity chatbot) {
        log.info("🆕 [CHATBOT-API] Creating chatbot for tenant {}", chatbot.getTenantId());
        chatbot.setCreatedAt(LocalDateTime.now());
        chatbot.setUpdatedAt(LocalDateTime.now());
        return chatbotRepository.save(chatbot);
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ChatbotEntity>> updateChatbot(
            @PathVariable Integer id,
            @RequestBody ChatbotEntity chatbot) {
        log.info("🆙 [CHATBOT-API] Updating chatbot ID {}", id);
        return chatbotRepository.findById(id)
                .flatMap(existing -> {
                    chatbot.setId(id);
                    chatbot.setCreatedAt(existing.getCreatedAt());
                    chatbot.setUpdatedAt(LocalDateTime.now());
                    return chatbotRepository.save(chatbot);
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteChatbot(
            @PathVariable Integer id,
            @RequestParam Integer tenantId) {
        log.info("🗑️ [CHATBOT-API] Deleting chatbot ID {} for tenant {}", id, tenantId);
        return chatbotRepository.findById(id)
                .flatMap(existing -> chatbotRepository.delete(existing).thenReturn(ResponseEntity.noContent().<Void>build()))
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/invalidate-cache")
    public Mono<ResponseEntity<Map<String, Object>>> invalidateCache(@RequestBody Map<String, Object> body) {
        Integer tenantId = (Integer) body.get("tenantId");
        if (tenantId == null) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "tenantId is required")));
        }

        log.info("🧹 [CHATBOT-API] Invalidating AI cache for tenant {}", tenantId);
        
        return aiServiceClient.post()
                .uri("/invalidate-cache")
                .bodyValue(Map.of("tenant_id", tenantId))
                .retrieve()
                .toBodilessEntity()
                .map(res -> ResponseEntity.ok(Map.<String, Object>of("status", "success", "tenantId", tenantId)))
                .onErrorResume(e -> {
                    log.error("❌ [CHATBOT-API] Failed to invalidate AI cache: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to reach AI service", "details", e.getMessage())));
                });
    }
}
