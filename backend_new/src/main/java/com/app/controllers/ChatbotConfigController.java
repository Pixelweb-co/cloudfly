package com.app.controllers;

import com.app.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ChatbotConfigController {

    private final ContactRepository contactRepository;

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
                .map(saved -> ResponseEntity.ok(Map.of(
                        "contactId", (Object) saved.getId(),
                        "chatbotEnabled", (Object) saved.getChatbotEnabled()
                )))
                .defaultIfEmpty(ResponseEntity.notFound().build());
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
                    boolean enabled = contact.getChatbotEnabled() != null ? contact.getChatbotEnabled() : true;
                    return ResponseEntity.ok(Map.of(
                            "contactId", (Object) contact.getId(),
                            "chatbotEnabled", (Object) enabled
                    ));
                })
                .defaultIfEmpty(ResponseEntity.ok(Map.of("chatbotEnabled", (Object) true)));
    }
}
