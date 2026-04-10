package com.app.controllers;

import com.app.persistence.entity.OmniChannelMessageEntity;
import com.app.persistence.repository.OmniChannelMessageRepository;
import com.app.persistence.services.EvolutionService;
import com.app.persistence.services.SocketNotificationService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final OmniChannelMessageRepository messageRepository;
    private final EvolutionService evolutionService;
    private final SocketNotificationService socketNotificationService;
    private final UserService userService;

    /**
     * Get historical messages for a specific conversation
     */
    @GetMapping("/messages/{contactId}")
    public Flux<OmniChannelMessageEntity> getMessages(@PathVariable Long contactId) {
        return userService.getCurrentUser()
                .flatMapMany(user -> {
                    Long tenantId = user.getCustomerId();
                    log.info("📂 [CHAT-CONTROLLER] Fetching messages for contact: {} (Tenant: {})", contactId, tenantId);
                    return messageRepository.findByTenantIdAndContactId(tenantId, contactId);
                });
    }

    /**
     * Send an outbound message
     */
    @PostMapping("/send/{phone}")
    public Mono<OmniChannelMessageEntity> sendMessage(
            @PathVariable String phone,
            @RequestBody Map<String, Object> payload) {
        
        final String body = (String) payload.get("body");
        final Long contactId = payload.get("contactId") != null ? Long.valueOf(payload.get("contactId").toString()) : null;

        return userService.getCurrentUser()
                .flatMap(user -> {
                    Long tenantId = user.getCustomerId();
                    
                    // 1. Guardar en base de datos local
                    OmniChannelMessageEntity msgEntity = OmniChannelMessageEntity.builder()
                            .tenantId(tenantId)
                            .contactId(contactId)
                            .direction("OUTBOUND")
                            .body(body)
                            .status("SENT")
                            .createdAt(LocalDateTime.now())
                            .build();

                    return messageRepository.save(msgEntity)
                            .flatMap(savedMsg -> {
                                log.info("📤 [CHAT-CONTROLLER] Message saved. Routing to provider...");

                                // 2. Enviar a Evolution API (WhatsApp)
                                String instanceName = "cloudfly_chatbot1"; 
                                
                                return evolutionService.sendSimpleMessage(instanceName, phone, body)
                                        .flatMap(evolutionRes -> {
                                            // 3. Notificar al socket
                                            Map<String, Object> socketPayload = new HashMap<>();
                                            socketPayload.put("messageId", savedMsg.getId());
                                            socketPayload.put("tenantId", tenantId);
                                            socketPayload.put("direction", "OUTBOUND");
                                            socketPayload.put("body", body);
                                            socketPayload.put("contactId", contactId);
                                            socketPayload.put("sentAt", savedMsg.getCreatedAt());

                                            socketNotificationService.notifyNewMessage(socketPayload).subscribe();

                                            return Mono.just(savedMsg);
                                        })
                                        .onErrorResume(e -> {
                                            log.error("❌ Error sending message via Evolution: {}", e.getMessage());
                                            savedMsg.setStatus("ERROR");
                                            return messageRepository.save(savedMsg);
                                        });
                            });
                });
    }
}
