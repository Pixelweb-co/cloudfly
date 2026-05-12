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
import java.util.List;
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
    private final com.app.persistence.repository.ChannelRepository channelRepository;
    private final com.app.persistence.repository.ContactRepository contactRepository;

    /**
     * Get historical messages for a specific conversation
     */
    @GetMapping("/messages/{contactId}")
    public Flux<OmniChannelMessageEntity> getMessages(@PathVariable Long contactId) {
        return userService.getCurrentUser()
                .flatMapMany(user -> {
                    Long tenantId = user.getCustomerId();
                    Long companyId = user.getCompanyId();
                    log.info("📂 [CHAT-CONTROLLER] Fetching messages for contact: {} (Tenant: {}, Company: {})", contactId, tenantId, companyId);
                    return messageRepository.findByTenantIdAndCompanyIdAndContactId(tenantId, companyId, contactId);
                });
    }

    /**
     * Get unread message summary grouped by contact
     */
    @GetMapping("/unread-summary")
    public Flux<Map<String, Object>> getUnreadSummary() {
        return userService.getCurrentUser()
                .flatMapMany(user -> {
                    Long tenantId = user.getCustomerId();
                    Long companyId = user.getCompanyId();
                    log.info("📬 [CHAT-CONTROLLER] Fetching unread summary for tenant: {}, company: {}", tenantId, companyId);
                    return messageRepository.countUnreadGroupedByContactAndCompany(tenantId, companyId)
                            .flatMap(row -> {
                                try {
                                    log.debug("🔍 [CHAT-CONTROLLER] Processing unread row: {}", row);
                                    Long contactId = row.getContactId();
                                    Long count = row.getCnt() != null ? row.getCnt() : 0L;
                                    
                                    if (contactId == null) {
                                        log.warn("⚠️ [CHAT-CONTROLLER] contactId is null in summary row");
                                        return Mono.empty();
                                    }

                                    return contactRepository.findById(contactId)
                                            .map(contact -> {
                                                Map<String, Object> item = new HashMap<>();
                                                item.put("contactId", contact.getId());
                                                item.put("contactName", contact.getName());
                                                item.put("phone", contact.getPhone());
                                                item.put("avatarUrl", contact.getAvatarUrl());
                                                item.put("unreadCount", count);
                                                return item;
                                            })
                                            .defaultIfEmpty(Map.of("contactId", contactId, "contactName", "Desconocido", "unreadCount", count));
                                } catch (Exception e) {
                                    log.error("❌ [CHAT-CONTROLLER] Error processing unread summary row: {}", e.getMessage(), e);
                                    return Mono.error(e);
                                }
                            });
                })
                .doOnError(e -> log.error("❌ [CHAT-CONTROLLER] Global error in getUnreadSummary: {}", e.getMessage(), e));
    }

    /**
     * Mark all messages from a contact as read (DB + Evolution API)
     */
    @PutMapping("/mark-read/{contactId}")
    public Mono<Map<String, Object>> markContactMessagesAsRead(@PathVariable Long contactId) {
        return userService.getCurrentUser()
                .flatMap(user -> {
                    Long tenantId = user.getCustomerId();
                    Long companyId = user.getCompanyId();
                    log.info("✅ [CHAT-CONTROLLER] Marking messages as read for contact: {} (Tenant: {}, Company: {})", contactId, tenantId, companyId);

                    // 1. Get unread messages to extract externalMessageId for Evolution API
                    return messageRepository.findUnreadByTenantIdAndCompanyIdAndContactId(tenantId, companyId, contactId)
                            .collectList()
                            .flatMap(unreadMessages -> {
                                // 2. Mark as READ in DB
                                return messageRepository.markAllReadByContactAndCompany(tenantId, companyId, contactId)
                                        .flatMap(updatedCount -> {
                                            log.info("📝 [CHAT-CONTROLLER] Marked {} messages as READ in DB", updatedCount);

                                            // 3. Send read receipts to Evolution API
                                            if (!unreadMessages.isEmpty()) {
                                                return channelRepository.findByCompanyIdAndTenantId(companyId, tenantId)
                                                        .filter(c -> "WHATSAPP".equals(c.getPlatform()) && Boolean.TRUE.equals(c.getStatus()))
                                                        .next()
                                                        .flatMap(channel -> {
                                                            return contactRepository.findById(contactId)
                                                                    .flatMap(contact -> {
                                                                        String phone = contact.getPhone();
                                                                        if (phone == null || phone.isEmpty()) {
                                                                            return Mono.just(Map.<String, Object>of("marked", updatedCount));
                                                                        }
                                                                        String cleanPhone = phone.replaceAll("[^0-9]", "");
                                                                        String remoteJid = cleanPhone + "@s.whatsapp.net";

                                                                        List<Map<String, Object>> readMessages = unreadMessages.stream()
                                                                                .filter(m -> m.getExternalMessageId() != null)
                                                                                .map(m -> {
                                                                                    Map<String, Object> rm = new HashMap<>();
                                                                                    rm.put("remoteJid", remoteJid);
                                                                                    rm.put("fromMe", false);
                                                                                    rm.put("id", m.getExternalMessageId());
                                                                                    return rm;
                                                                                })
                                                                                .collect(java.util.stream.Collectors.toList());

                                                                        if (!readMessages.isEmpty()) {
                                                                            return evolutionService.markMessagesAsRead(channel.getInstanceName(), readMessages)
                                                                                    .then(Mono.just(Map.<String, Object>of("marked", updatedCount, "evolutionSynced", true)));
                                                                        }
                                                                        return Mono.just(Map.<String, Object>of("marked", updatedCount));
                                                                    });
                                                        })
                                                        .defaultIfEmpty(Map.of("marked", updatedCount));
                                            }
                                            return Mono.just(Map.<String, Object>of("marked", updatedCount));
                                        });
                            });
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
        final String mediaType = (String) payload.get("mediaType");
        final String mediaUrl = (String) payload.get("mediaUrl");
        final Long contactId = payload.get("contactId") != null ? Long.valueOf(payload.get("contactId").toString()) : null;

        return userService.getCurrentUser()
                .flatMap(user -> {
                    Long tenantId = user.getCustomerId();
                    
                    // 1. Guardar en base de datos local
                    OmniChannelMessageEntity msgEntity = OmniChannelMessageEntity.builder()
                            .tenantId(tenantId)
                            .companyId(user.getCompanyId())
                            .contactId(contactId)
                            .direction("OUTBOUND")
                            .body(body)
                            .mediaType(mediaType)
                            .mediaUrl(mediaUrl)
                            .status("SENT")
                            .createdAt(LocalDateTime.now())
                            .build();

                    return messageRepository.save(msgEntity)
                            .flatMap(savedMsg -> {
                                log.info("📤 [CHAT-CONTROLLER] Message saved locally (ID: {}). Looking for channel...", savedMsg.getId());

                                return channelRepository.findByCompanyIdAndTenantId(user.getCompanyId(), tenantId)
                                        .filter(c -> "WHATSAPP".equals(c.getPlatform()) && Boolean.TRUE.equals(c.getStatus()))
                                        .next()
                                        .flatMap(channel -> {
                                            String instanceName = channel.getInstanceName();
                                            
                                            Mono<Map<String, Object>> evolutionCall;
                                            if ("AUDIO".equalsIgnoreCase(mediaType) || "audio".equalsIgnoreCase(mediaType)) {
                                                evolutionCall = evolutionService.sendWhatsAppAudio(instanceName, phone, mediaUrl);
                                            } else if ("IMAGE".equalsIgnoreCase(mediaType) || "image".equalsIgnoreCase(mediaType)) {
                                                evolutionCall = evolutionService.sendMedia(instanceName, phone, mediaUrl, body);
                                            } else {
                                                evolutionCall = evolutionService.sendSimpleMessage(instanceName, phone, body);
                                            }

                                            return evolutionCall
                                                    .flatMap(evolutionRes -> {
                                                        // 3. Notificar al socket
                                                        Map<String, Object> socketPayload = new HashMap<>();
                                                        socketPayload.put("messageId", savedMsg.getId());
                                                        socketPayload.put("tenantId", tenantId);
                                                        socketPayload.put("companyId", savedMsg.getCompanyId());
                                                        socketPayload.put("direction", "OUTBOUND");
                                                        socketPayload.put("body", body);
                                                        socketPayload.put("contactId", contactId);
                                                        socketPayload.put("sentAt", savedMsg.getCreatedAt());
                                                        socketPayload.put("mediaType", mediaType);
                                                        socketPayload.put("mediaUrl", mediaUrl);

                                                        socketNotificationService.notifyNewMessage(socketPayload).subscribe();

                                                        return Mono.just(savedMsg);
                                                    })
                                                    .onErrorResume(e -> {
                                                        log.error("❌ Error sending message via Evolution: {}", e.getMessage());
                                                        savedMsg.setStatus("ERROR");
                                                        return messageRepository.save(savedMsg);
                                                    });
                                        })
                                        .switchIfEmpty(Mono.defer(() -> {
                                            log.warn("⚠️ [CHAT-CONTROLLER] No active channel found for tenant: {}", tenantId);
                                            savedMsg.setStatus("ERROR");
                                            return messageRepository.save(savedMsg);
                                        }));
                            });
                });
    }
}
