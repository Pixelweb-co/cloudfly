package com.app.controllers;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.services.ContactService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
public class ChatbotConfigController {

    private final ContactRepository contactRepository;
    private final ContactService contactService;
    private final WebClient chatSocketClient;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {
    }

    public ChatbotConfigController(
            ContactRepository contactRepository,
            ContactService contactService,
            @Value("${services.socket.url:http://chat-socket-service:3001}") String socketUrl) {
        this.contactRepository = contactRepository;
        this.contactService = contactService;
        this.chatSocketClient = WebClient.builder().baseUrl(socketUrl).build();
    }

    /**
     * Alias legacy: GET /api/contacts/{id} → mismo contrato que /api/v1/contacts/{id}
     * (evita 500 "No static resource" cuando el frontend llama la ruta antigua).
     */
    @GetMapping("/{contactId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<ContactEntity> getContactById(
            @PathVariable Long contactId,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.findById(contactId, ctx.tenantId(), ctx.companyId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found")));
    }

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null, Set.of());
                    }
                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());
                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");
                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager
                            && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id"));
                            finalTenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [CONTACT-AUTH] Invalid x-tenant-id header");
                        }
                    }
                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager
                            && (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-company-id", headers.get("X-Company-Id"));
                            finalCompanyId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [CONTACT-AUTH] Invalid x-company-id header");
                        }
                    }
                    return new UserContext(finalTenantId, finalCompanyId, roles);
                });
    }

    /**
     * Toggle chatbot enabled/disabled for a specific contact.
     * POST /api/contacts/{contactId}/chatbot-toggle
     * Body: { "enabled": true/false }
     */
    @PostMapping("/{contactId:\\d+}/chatbot-toggle")
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
