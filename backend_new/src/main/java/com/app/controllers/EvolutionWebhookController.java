package com.app.controllers;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.entity.OmniChannelMessageEntity;
import com.app.persistence.repository.ChannelRepository;
import com.app.persistence.repository.MarketingCampaignRepository;
import com.app.persistence.repository.OmniChannelMessageRepository;
import com.app.persistence.services.ContactService;
import com.app.persistence.services.SocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks/evolution")
@RequiredArgsConstructor
public class EvolutionWebhookController {

    private final ChannelRepository channelRepository;
    private final MarketingCampaignRepository campaignRepository;
    private final ContactService contactService;
    private final OmniChannelMessageRepository messageRepository;
    private final SocketNotificationService socketNotificationService;
    private final com.app.persistence.repository.ConversationPipelineStateRepository conversationPipelineStateRepository;
    private final com.app.persistence.repository.PipelineStageRepository pipelineStageRepository;
    private final com.app.persistence.repository.PipelineRepository pipelineRepository;
    private final com.app.persistence.services.EvolutionService evolutionService;

    @PostMapping
    public Mono<Void> handleWebhook(@RequestBody Map<String, Object> payload) {
        String type = (String) payload.get("event");
        log.info("📥 [EVOLUTION-WEBHOOK] Received event: {}", type);

        if ("MESSAGES_UPSERT".equals(type)) {
            return processMessageUpsert(payload);
        }

        if ("CONNECTION_UPDATE".equals(type)) {
            return processConnectionUpdate(payload);
        }

        return Mono.empty();
    }

    private Mono<Void> processMessageUpsert(Map<String, Object> payload) {
        try {
            final String instance = (String) payload.get("instance");
            @SuppressWarnings("unchecked")
            final Map<String, Object> data = (Map<String, Object>) payload.get("data");
            @SuppressWarnings("unchecked")
            final Map<String, Object> message = (Map<String, Object>) data.get("message");
            
            // Extract remoteJid safely
            String remoteJidTemp = (String) data.get("key");
            if (data.containsKey("key") && data.get("key") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> keyMap = (Map<String, Object>) data.get("key");
                remoteJidTemp = (String) keyMap.get("remoteJid");
            }
            final String remoteJid = remoteJidTemp;
            final String conversationId = remoteJid;
            final String pushName = (String) data.get("pushName");
            
            // Extract body safely
            String bodyTemp = "";
            if (message != null) {
                if (message.containsKey("conversation")) {
                    bodyTemp = (String) message.get("conversation");
                } else if (message.containsKey("extendedTextMessage")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> etm = (Map<String, Object>) message.get("extendedTextMessage");
                    bodyTemp = (String) etm.get("text");
                }
            }
            final String body = (bodyTemp != null) ? bodyTemp : "";

            log.info("✉️ [EVOLUTION-WEBHOOK] Message from {}: {}", pushName, body);

            return channelRepository.findByInstanceName(instance)
                    .switchIfEmpty(Mono.defer(() -> {
                        log.warn("⚠️ [EVOLUTION-WEBHOOK] No exact channel match for instance: {}. Attempting fallback...", instance);
                        try {
                            String numericPart = instance.replaceAll("[^0-9]", "");
                            if (!numericPart.isEmpty()) {
                                Long inferredCompanyId = Long.parseLong(numericPart);
                                return channelRepository.findByCompanyId(inferredCompanyId).next();
                            }
                        } catch (Exception e) {
                            log.error("❌ [EVOLUTION-WEBHOOK] Error parsing fallback ID: {}", e.getMessage());
                        }
                        return Mono.empty();
                    }))
                    .flatMap(channel -> {
                        return contactService.getOrCreateContact(channel.getTenantId(), channel.getCompanyId(), remoteJid, pushName)
                                .flatMap(contact -> {
                                    OmniChannelMessageEntity msgEntity = OmniChannelMessageEntity.builder()
                                            .tenantId(channel.getTenantId())
                                            .companyId(channel.getCompanyId())
                                            .contactId(contact.getId())
                                            .direction("INBOUND")
                                            .body(body)
                                            .status("RECEIVED")
                                            .createdAt(LocalDateTime.now())
                                            .build();

                                    return messageRepository.save(msgEntity)
                                            .flatMap(savedMsg -> {
                                                Map<String, Object> socketPayload = new HashMap<>();
                                                socketPayload.put("messageId", savedMsg.getId());
                                                socketPayload.put("conversationId", conversationId);
                                                socketPayload.put("tenantId", channel.getTenantId());
                                                socketPayload.put("companyId", channel.getCompanyId());
                                                socketPayload.put("platform", "WHATSAPP");
                                                socketPayload.put("direction", "INBOUND");
                                                socketPayload.put("body", body);
                                                socketPayload.put("displayName", pushName);
                                                socketPayload.put("contactId", contact.getId());
                                                socketPayload.put("messageType", "TEXT");
                                                
                                                socketNotificationService.notifyNewMessage(socketPayload).subscribe();

                                                return conversationPipelineStateRepository.findByTenantIdAndConversationId(channel.getTenantId(), conversationId)
                                                        .switchIfEmpty(Mono.defer(() -> {
                                                            return pipelineRepository.findByTenantIdAndCompanyIdAndIsDefaultTrue(channel.getTenantId(), channel.getCompanyId())
                                                                    .next()
                                                                    .map(p -> p.getId())
                                                                    .flatMap(pipelineId -> {
                                                                        return pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipelineId)
                                                                                .next()
                                                                                .flatMap(stage -> {
                                                                                    com.app.persistence.entity.ConversationPipelineStateEntity newState = com.app.persistence.entity.ConversationPipelineStateEntity.builder()
                                                                                            .tenantId(channel.getTenantId())
                                                                                            .companyId(channel.getCompanyId())
                                                                                            .conversationId(conversationId)
                                                                                            .contactId(contact.getId())
                                                                                            .pipelineId(pipelineId)
                                                                                            .currentStageId(stage.getId())
                                                                                            .priority("MEDIUM")
                                                                                            .source("WHATSAPP")
                                                                                            .enteredStageAt(LocalDateTime.now())
                                                                                            .isActive(true)
                                                                                            .createdAt(LocalDateTime.now())
                                                                                            .build();
                                                                                    return conversationPipelineStateRepository.save(newState);
                                                                                });
                                                                    });
                                                        }))
                                                        .then();
                                            });
                                });
                    })
                    .then();

        } catch (Exception e) {
            log.error("❌ [EVOLUTION-WEBHOOK] Error processing message: ", e);
            return Mono.empty();
        }
    }

    private Mono<Void> processConnectionUpdate(Map<String, Object> payload) {
        try {
            final String instance = (String) payload.get("instance");
            @SuppressWarnings("unchecked")
            final Map<String, Object> data = (Map<String, Object>) payload.get("data");
            final String state = (String) data.get("state");
            final String owner = (String) data.get("owner");

            if ("open".equals(state) && owner != null) {
                final String phoneNumber = owner.split("@")[0];
                log.info("🔌 [EVOLUTION-WEBHOOK] Instance {} connected with number: {}", instance, phoneNumber);

                return channelRepository.findByPhoneNumber(phoneNumber)
                        .flatMap(existingChannel -> {
                            if (!instance.equals(existingChannel.getInstanceName())) {
                                log.warn("🚫 [EVOLUTION-WEBHOOK] Number {} is already in use by instance {}. Rejecting connection for instance {}", 
                                        phoneNumber, existingChannel.getInstanceName(), instance);
                                
                                return evolutionService.logoutInstance(instance)
                                        .then(Mono.<Void>empty());
                            }
                            return Mono.<Void>empty();
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                            return channelRepository.findByInstanceName(instance)
                                    .flatMap(channel -> {
                                        channel.setPhoneNumber(phoneNumber);
                                        channel.setStatus(true);
                                        channel.setUpdatedAt(LocalDateTime.now());
                                        return channelRepository.save(channel);
                                    })
                                    .then();
                        }))
                        .then();
            }
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-WEBHOOK] Error processing connection update: ", e);
        }
        return Mono.empty();
    }
}
