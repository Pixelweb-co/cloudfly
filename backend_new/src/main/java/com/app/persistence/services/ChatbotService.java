package com.app.persistence.services;

import com.app.dto.ChatbotConfigDTO;
import com.app.persistence.entity.ChatbotConfig;
import com.app.persistence.repository.ChatbotConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatbotConfigRepository chatbotConfigRepository;
    private final EvolutionService evolutionService;

    public Mono<ChatbotConfigDTO> getConfigByTenant(Long tenantId) {
        log.info("📋 [CHATBOT-SERVICE] Getting config for tenantId: {}", tenantId);
        return chatbotConfigRepository.findByTenantId(tenantId)
                .map(this::mapToDTO);
    }

    public Mono<ChatbotConfigDTO> getStatus(Long tenantId) {
        log.info("📊 [CHATBOT-SERVICE] Getting status for tenantId: {}", tenantId);
        return chatbotConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.checkConnection(config.getInstanceName())
                        .flatMap(statusRes -> {
                            ChatbotConfigDTO dto = mapToDTO(config);
                            dto.setExists(true);
                            Object state = statusRes.get("instance");
                            if (state instanceof Map) {
                                Map<String, Object> instance = (Map<String, Object>) state;
                                String status = (String) instance.get("status");
                                dto.setIsConnected("open".equals(status));
                            } else {
                                // Fallback to connectionState check if needed
                                String connectionStatus = (String) statusRes.get("status");
                                dto.setIsConnected("open".equals(connectionStatus));
                            }

                            if (!dto.getIsConnected()) {
                                return evolutionService.fetchQrCode(config.getInstanceName())
                                        .map(qrRes -> {
                                            if (qrRes != null && qrRes.containsKey("base64")) {
                                                dto.setQrCode((String) qrRes.get("base64"));
                                            }
                                            return dto;
                                        })
                                        .onErrorResume(e -> Mono.just(dto));
                            }
                            return Mono.just(dto);
                        })
                        .onErrorResume(e -> {
                            log.warn("⚠️ Instance not found in Evolution: {}", config.getInstanceName());
                            ChatbotConfigDTO dto = mapToDTO(config);
                            dto.setExists(false);
                            dto.setIsConnected(false);
                            return Mono.just(dto);
                        })
                )
                .switchIfEmpty(Mono.just(ChatbotConfigDTO.builder().exists(false).isConnected(false).build()));
    }

    public Mono<ChatbotConfigDTO> activateChatbot(Long tenantId) {
        log.info("🚀 [CHATBOT-SERVICE] Activating chatbot for tenant: {}", tenantId);
        return chatbotConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.createInstance(config.getInstanceName())
                        .flatMap(res -> {
                            log.info("✅ [CHATBOT-SERVICE] Instance created for tenant: {}", tenantId);
                            config.setIsActive(true);
                            config.setUpdatedAt(LocalDateTime.now());
                            return chatbotConfigRepository.save(config)
                                    .flatMap(saved -> getStatus(tenantId));
                        })
                        .onErrorResume(err -> {
                            if (err.getMessage().contains("already exists")) {
                                log.info("ℹ️ [CHATBOT-SERVICE] Instance already exists, fetching status/QR");
                                return getStatus(tenantId);
                            }
                            log.error("❌ [CHATBOT-SERVICE] Error activating chatbot: {}", err.getMessage());
                            return Mono.error(err);
                        })
                );
    }

    public Mono<ChatbotConfigDTO> getQrCode(Long tenantId) {
        return chatbotConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.fetchQrCode(config.getInstanceName())
                        .map(qrRes -> {
                            ChatbotConfigDTO dto = mapToDTO(config);
                            if (qrRes != null && qrRes.containsKey("base64")) {
                                dto.setQrCode((String) qrRes.get("base64"));
                            }
                            return dto;
                        })
                );
    }

    private ChatbotConfigDTO mapToDTO(ChatbotConfig entity) {
        return ChatbotConfigDTO.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .instanceName(entity.getInstanceName())
                .chatbotType(entity.getChatbotType())
                .isActive(entity.getIsActive())
                .n8nWebhookUrl(entity.getN8nWebhookUrl())
                .context(entity.getContext())
                .agentName(entity.getAgentName())
                .apiKey(entity.getApiKey())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
