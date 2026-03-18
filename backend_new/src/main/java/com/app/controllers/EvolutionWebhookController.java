package com.app.controllers;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.entity.OmniChannelMessageEntity;
import com.app.persistence.repository.ChannelRepository;
import com.app.persistence.repository.MarketingCampaignRepository;
import com.app.persistence.repository.OmniChannelMessageRepository;
import com.app.persistence.services.ContactService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
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
    private final com.app.persistence.repository.ConversationPipelineStateRepository conversationPipelineStateRepository;
    private final com.app.persistence.repository.PipelineStageRepository pipelineStageRepository;

    @PostMapping
    public Mono<Void> handleWebhook(@RequestBody Map<String, Object> payload) {
        String type = (String) payload.get("event");
        log.info("📥 [EVOLUTION-WEBHOOK] Received event: {}", type);

        if ("MESSAGES_UPSERT".equals(type)) {
            return processMessageUpsert(payload);
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
                    .flatMap(channel -> {
                        log.info("📡 [EVOLUTION-WEBHOOK] Found channel for instance: {}", instance);
                        
                        return contactService.getOrCreateContact(channel.getTenantId(), remoteJid, pushName)
                                .flatMap(contact -> {
                                    OmniChannelMessageEntity msgEntity = OmniChannelMessageEntity.builder()
                                            .tenantId(channel.getTenantId())
                                            .internalConversationId(conversationId)
                                            .contactId(contact.getId())
                                            .direction("INBOUND")
                                            .messageType("TEXT")
                                            .body(body)
                                            .platform("WHATSAPP")
                                            .provider("EVOLUTION")
                                            .status("RECEIVED")
                                            .createdAt(LocalDateTime.now())
                                            .build();

                                    return messageRepository.save(msgEntity)
                                            .flatMap(savedMsg -> {
                                                log.info("✅ [EVOLUTION-WEBHOOK] Message saved. Checking pipeline state...");
                                                
                                                return conversationPipelineStateRepository.findByTenantIdAndConversationId(channel.getTenantId(), conversationId)
                                                        .switchIfEmpty(Mono.defer(() -> {
                                                            log.info("🆕 [EVOLUTION-WEBHOOK] Creating new pipeline state for conversation: {}", conversationId);
                                                            
                                                            // Find campaign and its pipeline
                                                            return campaignRepository.findByTenantId(channel.getTenantId())
                                                                    .filter(c -> "ACTIVE".equals(c.getStatus()))
                                                                    .next()
                                                                    .flatMap(campaign -> {
                                                                        Long pipelineId = campaign.getTargetPipelineId();
                                                                        if (pipelineId == null) return Mono.empty();
                                                                        
                                                                        return pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipelineId)
                                                                                .next() // Get first stage
                                                                                .flatMap(stage -> {
                                                                                    com.app.persistence.entity.ConversationPipelineStateEntity newState = com.app.persistence.entity.ConversationPipelineStateEntity.builder()
                                                                                            .tenantId(channel.getTenantId())
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
}
